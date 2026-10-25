import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import { execFile } from 'child_process';
import {
  ADB, adb, foreground, formatUiNode, isRecording, KEYCODES, listDevices, pasteText, resolveSerial, screenshot, shell, shellQuote,
  startRecording, stopRecording, uiTree, UiNode, viewHierarchy,
} from './android';
import { avdName, bootAvd, emulators, emulatorTool, findSdk, killEmulators, listAvds, pendingEmulators, recoverPending } from './avd';

type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };
type Args = Record<string, unknown>;

interface Tool {
  name: string;
  description: string;
  properties: Record<string, object>;
  required?: string[];
  noDevice?: boolean;
  acts?: boolean;
  run(args: Args, serial: string): Promise<Content[] | string>;
}

const serialProp = { serial: { type: 'string', description: 'Device serial from list_devices. Optional when one device is connected.' } };
const expectProp = { expectPackage: { type: 'string', description: 'Refuse to act unless this app package is in the foreground, so stray input cannot land in another app.' } };
const num = (description: string) => ({ type: 'number', description });
const str = (description: string) => ({ type: 'string', description });
const bool = (description: string) => ({ type: 'boolean', description });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function int(args: Args, key: string, fallback?: number): number {
  const v = Math.round(Number(args[key] ?? fallback));
  if (!Number.isFinite(v)) {
    throw new Error(`"${key}" must be a number`);
  }
  return v;
}

function pkgArg(args: Args, key = 'package'): string {
  const pkg = String(args[key] ?? '');
  if (!/^[A-Za-z][\w]*(\.[\w]+)+$/.test(pkg)) {
    throw new Error(`"${key}" must be a package name, for example com.example.app`);
  }
  return pkg;
}

function local(file: unknown, key: string): string {
  if (typeof file !== 'string' || !path.isAbsolute(file)) {
    throw new Error(`"${key}" must be an absolute path on this computer`);
  }
  return file;
}

function run(file: string, args: string[], timeout = 300000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${String(stderr || '').trim() || error.message}`.slice(0, 2000)));
      } else {
        resolve(`${stdout}${stderr}`);
      }
    });
  });
}

async function tapAt(serial: string, x: number, y: number, durationMs: number): Promise<void> {
  await shell(serial, durationMs > 0 ? `input swipe ${x} ${y} ${x} ${y} ${durationMs}` : `input tap ${x} ${y}`);
}

const nodeKey = (nodes: UiNode[]) => nodes.map(n => `${n.text}|${n.desc}|${n.bounds}`).join('\n');

async function findOrScroll(serial: string, args: Args, scrolls: number): Promise<UiNode | undefined> {
  let nodes = (await uiTree(serial)).nodes;
  for (let i = 0; ; i++) {
    const node = findNode(nodes, args);
    if (node || i >= scrolls) {
      return node;
    }
    const list = nodes.filter(n => n.scrollable).sort((a, b) => area(b) - area(a))[0];
    if (!list) {
      return undefined;
    }
    const [l, t, r, b] = list.rect;
    const up = args.scrollDirection !== 'up';
    const x = Math.round((l + r) / 2);
    const [from, to] = up ? [b - (b - t) * 0.2, t + (b - t) * 0.2] : [t + (b - t) * 0.2, b - (b - t) * 0.2];
    await shell(serial, `input swipe ${x} ${Math.round(from)} ${x} ${Math.round(to)} 400`);
    await sleep(400);
    const next = (await uiTree(serial)).nodes;
    if (nodeKey(next) === nodeKey(nodes)) {
      return undefined;
    }
    nodes = next;
  }
}

const area = (n: UiNode) => (n.rect[2] - n.rect[0]) * (n.rect[3] - n.rect[1]);

const PERMISSION = /^[A-Za-z][\w.]*$/;

function findNode(nodes: UiNode[], args: Args): UiNode | undefined {
  const want = (v: unknown) => (typeof v === 'string' && v ? v.toLowerCase() : undefined);
  const text = want(args.text);
  const id = want(args.id);
  const desc = want(args.desc);
  const matches = nodes.filter(n =>
    (!text || n.text.toLowerCase().includes(text)) &&
    (!id || n.id.toLowerCase() === id || n.id.toLowerCase().endsWith(id)) &&
    (!desc || n.desc.toLowerCase().includes(desc)));
  const exact = matches.find(n => (text && n.text.toLowerCase() === text) || (desc && n.desc.toLowerCase() === desc));
  return exact ?? matches.find(n => n.clickable) ?? matches[0];
}

export const TOOLS: Tool[] = [
  {
    name: 'list_devices',
    description: 'List connected Android devices and emulators with their serials and state.',
    properties: {},
    noDevice: true,
    async run() {
      const devices = await listDevices();
      const avds = await listAvds(emulatorTool(findSdk(ADB)));
      return [
        devices.length ? devices.map(d => `${d.serial}\t${d.state}${d.model ? `\t${d.model}` : ''}`).join('\n') : 'No devices connected.',
        avds?.length ? `Emulators that start_emulator can boot: ${avds.join(', ')}` : '',
      ].filter(Boolean).join('\n\n');
    },
  },
  {
    name: 'start_emulator',
    description: 'Boot an Android emulator (AVD) and wait until Android has started. Returns its serial. Booting can take a minute or two.',
    properties: {
      avd: str('AVD name from list_devices. Optional when only one exists.'),
      headless: { type: 'boolean', description: 'Run without an emulator window, default true. Use screenshot to see it, stop_emulator when done.' },
    },
    noDevice: true,
    async run(args) {
      const sdk = findSdk(ADB);
      const emulator = emulatorTool(sdk);
      const avds = await listAvds(emulator);
      if (!avds) {
        throw new Error('The Android Emulator was not found. Install it with the Android Studio SDK Manager and set ANDROID_HOME.');
      }
      const avd = typeof args.avd === 'string' && args.avd ? args.avd : avds.length === 1 ? avds[0] : undefined;
      if (!avd || !avds.includes(avd)) {
        throw new Error(avds.length ? `Pass "avd", one of: ${avds.join(', ')}` : 'No emulator exists. Create one with DroidBridge: Start Emulator in VS Code or Android Studio.');
      }
      const pending = await pendingEmulators(ADB);
      const mine: string[] = [];
      for (const e of await emulators(ADB)) {
        if (await avdName(ADB, e.serial) === avd) {
          if (!pending.includes(e.serial)) {
            return `${avd} is already running as ${e.serial}`;
          }
          mine.push(e.serial);
        }
      }
      if (mine.length) {
        const serial = await recoverPending(ADB, mine, () => false);
        if (serial) {
          return `${avd} finished starting as ${serial}`;
        }
      }
      const headless = args.headless !== false;
      return `Started ${avd} as ${await bootAvd(ADB, emulator, avd, { headless })}${headless ? ' without a window' : ''}`;
    },
  },
  {
    name: 'reset_adb',
    description: 'Recover devices that show as offline or commands that hang. By default reconnects the devices, which interrupts the screen mirror. restartServer restarts the ADB server itself, which also drops every other ADB user on this computer (Android Studio, scrcpy, logcat); it is used automatically when ADB does not respond.',
    properties: { restartServer: bool('Restart the ADB server instead of only reconnecting devices') },
    noDevice: true,
    async run(args) {
      let restarted = !!args.restartServer;
      if (!restarted) {
        try {
          await adb(['reconnect', 'offline'], { timeout: 10000 });
          await adb(['reconnect'], { timeout: 10000 });
          await sleep(2000);
        } catch {
          restarted = true;
        }
      }
      if (restarted) {
        await adb(['kill-server'], { timeout: 10000 }).catch(() => undefined);
        await adb(['start-server'], { timeout: 30000 });
        await adb(['reconnect', 'offline'], { timeout: 10000 }).catch(() => undefined);
      }
      return `${restarted ? 'ADB server restarted.' : 'Devices reconnected.'}\n\n${(await listDevices()).map(d => `${d.serial}\t${d.state}`).join('\n') || 'No devices connected yet; USB devices and emulators can take a few seconds to reappear.'}`;
    },
  },
  {
    name: 'stop_emulator',
    description: 'Shut down a running emulator, including one stuck offline.',
    properties: { serial: str('Emulator serial from list_devices. Optional when only one emulator is running.') },
    noDevice: true,
    async run(args) {
      const running = (await emulators(ADB)).map(e => e.serial);
      const serial = typeof args.serial === 'string' && args.serial ? args.serial : running.length === 1 ? running[0] : undefined;
      if (!serial || !running.includes(serial)) {
        throw new Error(running.length ? `Pass "serial", one of: ${running.join(', ')}` : 'No emulator is running.');
      }
      await killEmulators(ADB, [serial]);
      return `Stopped ${serial}`;
    },
  },
  {
    name: 'screenshot',
    description: 'Capture the device screen as an image. Coordinates for tap and swipe are device pixels; the reply states the scale between image and device.',
    properties: { maxSide: num('Longest side of the returned image in pixels (default 1024).') },
    async run(args, serial) {
      const shot = await screenshot(serial, typeof args.maxSide === 'number' ? args.maxSide : undefined);
      const scale = shot.scale;
      return [
        { type: 'image', data: shot.png.toString('base64'), mimeType: 'image/png' },
        { type: 'text', text: `Image ${shot.width}x${shot.height}, device ${shot.deviceWidth}x${shot.deviceHeight}. Device x = image x * ${scale}, device y = image y * ${scale}. Prefer ui_tree centers for precise taps.` },
      ];
    },
  },
  {
    name: 'ui_tree',
    description: 'List on-screen UI elements (text, content description, resource id, clickable, center coordinates in device pixels). Use this to find what to tap. Says which app the dump came from and how many nodes it held, and falls back to the Android view hierarchy when UI Automator cannot read the screen.',
    properties: { filter: str('Only return elements whose text, description or id contains this (case-insensitive).') },
    async run(args, serial) {
      let dump;
      try {
        dump = await uiTree(serial);
      } catch (error) {
        const views = await viewHierarchy(serial).catch(() => '');
        if (!views) {
          throw error;
        }
        return `${error instanceof Error ? error.message : error}\n\nFallback, view hierarchy of ${views}\n(Bounds are relative to the parent view. Jetpack Compose and Flutter content appears as a single view.)`;
      }
      const f = typeof args.filter === 'string' ? args.filter.toLowerCase() : '';
      const nodes = f ? dump.nodes.filter(n => `${n.text} ${n.desc} ${n.id}`.toLowerCase().includes(f)) : dump.nodes;
      const focus = /mCurrentFocus=Window\{\S+ \S+ ([^\s/}]+)/.exec(await shell(serial, 'dumpsys window 2>/dev/null | grep -m1 mCurrentFocus; true').catch(() => ''))?.[1];
      const covered = focus && dump.packages.length && !dump.packages.includes(focus) && /\./.test(focus)
        ? ` The focused window belongs to ${focus} and is not in this dump; it may cover these elements, check with screenshot.` : '';
      const head = `Window: ${dump.packages.join(', ') || 'unknown'}, ${dump.total} nodes, ${dump.nodes.length} with text, id or actions${f ? `, ${nodes.length} matching "${args.filter}"` : ''}.${covered}`;
      if (nodes.length) {
        return `${head}\n${nodes.map(formatUiNode).join('\n')}`;
      }
      if (dump.nodes.length) {
        return `${head}\nNo element matches the filter. Call ui_tree without a filter to see them.`;
      }
      return `${head}\nThe dump has no readable elements. Flutter apps expose nothing until semantics is enabled (for example SemanticsBinding.instance.ensureSemantics(), or run with an accessibility service on); games, video and canvas views also draw without elements. Use screenshot instead.`;
    },
  },
  {
    name: 'tap',
    description: 'Tap at device pixel coordinates.',
    properties: { x: num('X in device pixels'), y: num('Y in device pixels'), durationMs: num('Time between finger down and up, default 60. Some gesture detectors ignore a zero length tap; 0 sends an instant tap.') },
    required: ['x', 'y'],
    acts: true,
    async run(args, serial) {
      const x = int(args, 'x');
      const y = int(args, 'y');
      await tapAt(serial, x, y, Math.min(Math.max(int(args, 'durationMs', 60), 0), 400));
      return `Tapped ${x},${y}`;
    },
  },
  {
    name: 'tap_element',
    description: 'Find an element by text, resource id or content description and tap its center. At least one of text, id, desc is required. Scrolls the largest scrollable list to bring the element on screen when it is not there yet.',
    properties: {
      text: str('Visible text (substring, case-insensitive)'), id: str('Resource id, with or without package prefix'), desc: str('Content description (substring)'),
      maxScrolls: num('How many times to scroll looking for the element, default 5, 0 to never scroll'),
      scrollDirection: { type: 'string', enum: ['down', 'up'], description: 'Direction to look in, default down' },
    },
    acts: true,
    async run(args, serial) {
      if (!args.text && !args.id && !args.desc) {
        throw new Error('Pass text, id or desc.');
      }
      const node = await findOrScroll(serial, args, Math.min(Math.max(int(args, 'maxScrolls', 5), 0), 20));
      if (!node) {
        throw new Error('No matching element on screen. Call ui_tree to see what is there.');
      }
      if (area(node) <= 0) {
        throw new Error(`The element has no visible area: ${formatUiNode(node)}`);
      }
      await tapAt(serial, node.x, node.y, 60);
      return `Tapped ${formatUiNode(node)}`;
    },
  },
  {
    name: 'wait_for',
    description: 'Wait until an element matching text, id or desc is on screen (or gone, with gone=true). Use after taps that load a new screen.',
    properties: {
      text: str('Visible text (substring, case-insensitive)'), id: str('Resource id'), desc: str('Content description (substring)'),
      gone: { type: 'boolean', description: 'Wait for the element to disappear instead' },
      timeoutMs: num('Give up after this long, default 10000, max 120000'),
    },
    async run(args, serial) {
      if (!args.text && !args.id && !args.desc) {
        throw new Error('Pass text, id or desc.');
      }
      const deadline = Date.now() + Math.min(Math.max(int(args, 'timeoutMs', 10000), 0), 120000);
      for (let delay = 300; ; delay = Math.min(delay * 1.5, 2000)) {
        let nodes: UiNode[] | undefined;
        let failure: unknown;
        try {
          nodes = (await uiTree(serial, 1)).nodes;
        } catch (error) {
          failure = error;
        }
        const node = nodes && findNode(nodes, args);
        if (nodes && (args.gone ? !node : node)) {
          return node ? `Found ${formatUiNode(node)}` : 'Element is gone';
        }
        if (Date.now() > deadline) {
          throw failure ?? new Error(args.gone ? 'The element is still on screen.' : 'The element did not appear. Call ui_tree to see what is on screen.');
        }
        await sleep(Math.min(delay, Math.max(deadline - Date.now(), 0)));
      }
    },
  },
  {
    name: 'long_press',
    description: 'Press and hold at device pixel coordinates.',
    properties: { x: num('X in device pixels'), y: num('Y in device pixels'), durationMs: num('Hold time, default 800') },
    required: ['x', 'y'],
    acts: true,
    async run(args, serial) {
      const x = int(args, 'x');
      const y = int(args, 'y');
      await shell(serial, `input swipe ${x} ${y} ${x} ${y} ${int(args, 'durationMs', 800)}`);
      return `Long pressed ${x},${y}`;
    },
  },
  {
    name: 'swipe',
    description: 'Swipe between two device pixel points. Swipe up (y2 < y1) to scroll content down.',
    properties: { x1: num('Start x'), y1: num('Start y'), x2: num('End x'), y2: num('End y'), durationMs: num('Duration, default 300') },
    required: ['x1', 'y1', 'x2', 'y2'],
    acts: true,
    async run(args, serial) {
      const v = ['x1', 'y1', 'x2', 'y2'].map(k => int(args, k));
      await shell(serial, `input swipe ${v.join(' ')} ${int(args, 'durationMs', 300)}`);
      return `Swiped ${v[0]},${v[1]} -> ${v[2]},${v[3]}`;
    },
  },
  {
    name: 'type_text',
    description: 'Type text into the focused field (tap the field first). Any language and emoji: text that is not plain ASCII is pasted through the device clipboard, replacing its contents.',
    properties: { text: str('Text to type'), submit: bool('Press Enter afterwards') },
    required: ['text'],
    acts: true,
    async run(args, serial) {
      const text = String(args.text);
      if (/[^\x20-\x7e]/.test(text)) {
        await pasteText(serial, text);
        if (args.submit) {
          await shell(serial, 'input keyevent 66');
        }
        return `Pasted ${JSON.stringify(text)}${args.submit ? ' and pressed Enter' : ''}`;
      }
      const words = text.split(' ');
      const cmds = words.map((w, i) => [w ? `input text ${shellQuote(w)}` : '', i < words.length - 1 ? 'input keyevent 62' : ''].filter(Boolean).join(' && '));
      if (args.submit) {
        cmds.push('input keyevent 66');
      }
      await shell(serial, cmds.filter(Boolean).join(' && '));
      return `Typed ${JSON.stringify(text)}${args.submit ? ' and pressed Enter' : ''}`;
    },
  },
  {
    name: 'press_key',
    description: `Press a key: ${Object.keys(KEYCODES).join(', ')}, or a numeric Android keycode.`,
    properties: { key: str('Key name or keycode') },
    required: ['key'],
    acts: true,
    async run(args, serial) {
      const key = String(args.key).toLowerCase();
      const code = KEYCODES[key] ?? (/^\d+$/.test(key) ? Number(key) : undefined);
      if (code === undefined) {
        throw new Error(`Unknown key "${args.key}"`);
      }
      await shell(serial, `input keyevent ${code}`);
      return `Pressed ${key}`;
    },
  },
  {
    name: 'device_info',
    description: 'Model, Android version, screen size, current size and rotation, density, load, free memory and battery. Check load when the device seems slow.',
    properties: {},
    async run(_args, serial) {
      const out = await shell(serial, [
        'echo "Device: $(getprop ro.product.manufacturer) $(getprop ro.product.model)"',
        'echo "Android: $(getprop ro.build.version.release) (API $(getprop ro.build.version.sdk))"',
        'wm size | tail -1',
        'wm density | tail -1',
        'echo "Current size: $(dumpsys window displays 2>/dev/null | grep -m1 -oE "cur=[0-9]+x[0-9]+" | cut -d= -f2)"',
        'echo "Rotation: $(dumpsys window displays 2>/dev/null | grep -m1 -oE "mCurrentRotation=[A-Z_0-9]+" | cut -d= -f2)"',
        'echo "Load: $(cut -d" " -f1-3 /proc/loadavg) on $(grep -c ^processor /proc/cpuinfo) cores"',
        'echo "Free memory: $(($(grep MemAvailable /proc/meminfo | tr -s " " | cut -d" " -f2) / 1024)) MB"',
        'echo "Battery: $(dumpsys battery | grep -m1 level | tr -d " " | cut -d: -f2)%"',
      ].join('; '), 90000);
      return out.trim();
    },
  },
  {
    name: 'current_app',
    description: 'Show the foreground app package and activity.',
    properties: {},
    async run(_args, serial) {
      return await foreground(serial) || 'No app is in the foreground.';
    },
  },
  {
    name: 'list_apps',
    description: 'List installed app packages (third-party only unless all is true).',
    properties: { filter: str('Substring to match'), all: { type: 'boolean', description: 'Include system apps' } },
    async run(args, serial) {
      const out = await shell(serial, `pm list packages${args.all ? '' : ' -3'}`);
      const f = typeof args.filter === 'string' ? args.filter.toLowerCase() : '';
      const pkgs = out.split('\n').map(l => l.replace('package:', '').trim()).filter(p => p && p.toLowerCase().includes(f)).sort();
      return pkgs.join('\n') || 'No matching packages.';
    },
  },
  {
    name: 'launch_app',
    description: 'Launch an app by package name.',
    properties: { package: str('Package name, for example com.android.settings') },
    required: ['package'],
    async run(args, serial) {
      const pkg = String(args.package);
      if (!/^[\w.]+$/.test(pkg)) {
        throw new Error('Invalid package name');
      }
      const out = await shell(serial, `monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`);
      if (/No activities found|aborted/i.test(out)) {
        throw new Error(`Could not launch ${pkg}: ${out.trim()}`);
      }
      await sleep(1000);
      return `Launched ${pkg}`;
    },
  },
  {
    name: 'open_url',
    description: 'Open a URL or app deep link (for example https://example.com or myapp://orders/42) with the matching app.',
    properties: { url: str('URL or deep link') },
    required: ['url'],
    async run(args, serial) {
      const url = String(args.url);
      if (!/^[a-z][\w+.-]*:\S+$/i.test(url)) {
        throw new Error('Pass a URL with a scheme, for example https://example.com');
      }
      const out = await shell(serial, `am start -W -a android.intent.action.VIEW -d ${shellQuote(url)}`);
      if (/^Error|unable to resolve/m.test(out)) {
        throw new Error(`Could not open ${url}: ${out.trim()}`);
      }
      return `Opened ${url}`;
    },
  },
  {
    name: 'install_apk',
    description: 'Install or update an app from this computer: one APK, split APKs of one app (paths), or an Android App Bundle (.aab, needs bundletool on PATH or DROIDBRIDGE_BUNDLETOOL pointing at bundletool.jar).',
    properties: {
      path: str('Absolute path to an .apk or .aab file'),
      paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths to the split APKs of one app, installed together' },
      grantPermissions: bool('Grant all runtime permissions listed in the manifest (-g)'),
      allowDowngrade: bool('Allow installing an older version over a newer one (-d)'),
    },
    async run(args, serial) {
      const files = (Array.isArray(args.paths) && args.paths.length ? args.paths : [args.path]).map((f, i) => local(f, Array.isArray(args.paths) ? `paths[${i}]` : 'path'));
      for (const f of files) {
        if (!fs.existsSync(f)) {
          throw new Error(`File not found: ${f}`);
        }
      }
      const flags = ['-r', ...(args.grantPermissions ? ['-g'] : []), ...(args.allowDowngrade ? ['-d'] : [])];
      if (files.length === 1 && files[0].toLowerCase().endsWith('.aab')) {
        return installBundle(serial, files[0], !!args.allowDowngrade);
      }
      const out = (await adb(['-s', serial, files.length > 1 ? 'install-multiple' : 'install', ...flags, ...files], { timeout: 300000 })).toString();
      return out.trim();
    },
  },
  {
    name: 'logcat',
    description: 'Read recent device logs, filtered on the device by app, tag, priority and time.',
    properties: {
      lines: num('Number of recent lines, default 200'),
      level: { type: 'string', enum: ['V', 'D', 'I', 'W', 'E', 'F'], description: 'Minimum priority' },
      package: str('Only lines from this running app\'s process'),
      tags: { type: 'array', items: { type: 'string' }, description: 'Only these log tags, for example ["ReactNativeJS", "flutter"]' },
      sinceSeconds: num('Only lines from the last this many seconds'),
      filter: str('Only lines containing this text (case-insensitive)'),
      clear: bool('Clear the log buffer after reading'),
    },
    async run(args, serial) {
      const lines = Math.min(Math.max(int(args, 'lines', 200), 1), 5000);
      const level = typeof args.level === 'string' && /^[VDIWEF]$/.test(args.level) ? args.level : 'V';
      const f = typeof args.filter === 'string' ? args.filter.toLowerCase() : '';
      const cmd = ['logcat', '-d', '-v', 'threadtime'];
      if (args.package) {
        const pkg = pkgArg(args);
        const pid = (await shell(serial, `pidof -s ${pkg}; true`)).trim();
        if (!/^\d+$/.test(pid)) {
          throw new Error(`${pkg} is not running. Start it first, or leave out package.`);
        }
        cmd.push(`--pid=${pid}`);
      }
      if (args.sinceSeconds !== undefined) {
        cmd.push('-T', `"$(($(date +%s)-${Math.max(int(args, 'sinceSeconds'), 0)})).0"`);
      } else if (!f) {
        cmd.push('-t', String(lines));
      }
      const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];
      if (tags.some(t => !/^[\w.$-]+$/.test(t))) {
        throw new Error('Tags may contain letters, digits, dot, dash, underscore and $ only.');
      }
      cmd.push(...(tags.length ? [...tags.map(t => `'${t}:${level}'`), "'*:S'"] : [`'*:${level}'`]));
      const out = (await shell(serial, cmd.join(' '), 60000))
        .split('\n').filter(l => l && !l.startsWith('---------') && (!f || l.toLowerCase().includes(f)))
        .slice(-lines).join('\n');
      if (args.clear) {
        await shell(serial, 'logcat -c');
      }
      return out.trim() || 'No log lines.';
    },
  },
  {
    name: 'set_display',
    description: 'Change display settings to test layouts: dark mode, font scale, screen size and density (test tablet layouts on a phone and the reverse), and rotation. Pass only what to change; "reset" restores the default. Returns the resulting settings.',
    properties: {
      darkMode: { type: 'string', enum: ['yes', 'no', 'auto'], description: 'Dark theme' },
      fontScale: str('Font scale such as 0.85, 1.3 or 2.0, or reset'),
      size: str('Screen size WIDTHxHEIGHT in pixels, for example 1600x2560, or reset'),
      density: str('Screen density in dpi, for example 320, or reset'),
      rotation: { type: 'string', enum: ['auto', '0', '90', '180', '270'], description: 'Lock rotation to this angle, or auto to follow the sensor' },
    },
    async run(args, serial) {
      const cmds: string[] = [];
      if (args.darkMode !== undefined) {
        if (!['yes', 'no', 'auto'].includes(String(args.darkMode))) {
          throw new Error('darkMode must be yes, no or auto');
        }
        cmds.push(`cmd uimode night ${args.darkMode}`);
      }
      if (args.fontScale !== undefined) {
        const v = String(args.fontScale);
        if (v !== 'reset' && !(Number(v) >= 0.5 && Number(v) <= 3)) {
          throw new Error('fontScale must be between 0.5 and 3, or reset');
        }
        cmds.push(`settings put system font_scale ${v === 'reset' ? '1.0' : Number(v)}`);
      }
      if (args.size !== undefined) {
        const v = String(args.size);
        if (v !== 'reset' && !/^\d{3,5}x\d{3,5}$/.test(v)) {
          throw new Error('size must look like 1600x2560, or reset');
        }
        cmds.push(`wm size ${v}`);
      }
      if (args.density !== undefined) {
        const v = String(args.density);
        if (v !== 'reset' && !(/^\d+$/.test(v) && +v >= 72 && +v <= 1000)) {
          throw new Error('density must be a dpi between 72 and 1000, or reset');
        }
        cmds.push(`wm density ${v}`);
      }
      if (args.rotation !== undefined) {
        const v = String(args.rotation);
        const index = ['0', '90', '180', '270'].indexOf(v);
        if (v !== 'auto' && index < 0) {
          throw new Error('rotation must be auto, 0, 90, 180 or 270');
        }
        cmds.push(v === 'auto' ? 'settings put system accelerometer_rotation 1' : `settings put system accelerometer_rotation 0; settings put system user_rotation ${index}`);
      }
      if (cmds.length) {
        await shell(serial, cmds.join('; '));
        await sleep(800);
      }
      return (await shell(serial, [
        'echo "Dark mode: $(cmd uimode night | sed "s/.*: //")"',
        'echo "Font scale: $(settings get system font_scale | sed s/null/1.0/)"',
        'wm size | tail -1', 'wm density | tail -1',
        'if [ "$(settings get system accelerometer_rotation)" = 1 ]; then echo "Rotation: auto"; else echo "Rotation: locked at $(($(settings get system user_rotation | sed s/null/0/) * 90))"; fi',
      ].join('; '))).trim();
    },
  },
  {
    name: 'set_app_locale',
    description: 'Run an app in another language (Android 13 and later), for example fr-FR or ar. The app restarts. Pass an empty locales to go back to the system language.',
    properties: { package: str('App package name'), locales: str('Comma separated language tags such as fr-FR or hi,en') },
    required: ['package', 'locales'],
    async run(args, serial) {
      const pkg = pkgArg(args);
      const locales = String(args.locales ?? '');
      if (!/^[A-Za-z0-9,-]*$/.test(locales)) {
        throw new Error('locales must be language tags such as fr-FR, separated by commas');
      }
      const out = await shell(serial, `cmd locale set-app-locales ${pkg} --locales '${locales}' 2>&1`);
      if (/exception|error|unknown/i.test(out)) {
        throw new Error(out.trim());
      }
      return `${pkg} now uses ${locales || 'the system language'}.`;
    },
  },
  {
    name: 'stop_app',
    description: 'Force-stop an app, so the next launch starts it fresh.',
    properties: { package: str('App package name') },
    required: ['package'],
    async run(args, serial) {
      const pkg = pkgArg(args);
      await shell(serial, `am force-stop ${pkg}`);
      return `Stopped ${pkg}`;
    },
  },
  {
    name: 'clear_app_data',
    description: 'Erase all data of an app (pm clear), as if freshly installed. Also revokes its runtime permissions.',
    properties: { package: str('App package name') },
    required: ['package'],
    async run(args, serial) {
      const pkg = pkgArg(args);
      const out = (await shell(serial, `pm clear ${pkg} 2>&1`)).trim();
      if (!/Success/.test(out)) {
        throw new Error(`Could not clear ${pkg}: ${out}`);
      }
      return `Cleared the data of ${pkg}`;
    },
  },
  {
    name: 'set_permission',
    description: 'Grant or revoke a runtime permission of an app, for example CAMERA or android.permission.POST_NOTIFICATIONS.',
    properties: { package: str('App package name'), permission: str('Permission name; android.permission. is added when there is no dot'), grant: bool('true to grant, false to revoke') },
    required: ['package', 'permission', 'grant'],
    async run(args, serial) {
      const pkg = pkgArg(args);
      const raw = String(args.permission ?? '');
      if (!PERMISSION.test(raw)) {
        throw new Error('Invalid permission name');
      }
      const permission = raw.includes('.') ? raw : `android.permission.${raw}`;
      const out = (await shell(serial, `pm ${args.grant ? 'grant' : 'revoke'} ${pkg} ${permission} 2>&1`)).trim();
      if (out) {
        throw new Error(out.split('\n')[0]);
      }
      return `${args.grant ? 'Granted' : 'Revoked'} ${permission} ${args.grant ? 'to' : 'from'} ${pkg}`;
    },
  },
  {
    name: 'start_activity',
    description: 'Start an activity or send an intent with extras (am start), for example a specific screen of your app with test data. Give component, or action and data.',
    properties: {
      component: str('Activity to start, package/.Activity or package/full.class.Name'),
      action: str('Intent action, for example android.intent.action.SEND'),
      data: str('Data URI'),
      mimeType: str('MIME type'),
      package: str('Limit the intent to this app'),
      extras: { type: 'object', description: 'Intent extras. Strings, booleans, integers and decimals are sent with their type, for example {"userId": 42, "debug": true}' },
      stopFirst: bool('Force-stop the app before starting'),
    },
    async run(args, serial) {
      const parts = ['am start -W'];
      if (args.stopFirst) { parts.push('-S'); }
      if (args.component !== undefined) {
        if (!/^[\w.]+\/[\w.$]+$/.test(String(args.component))) {
          throw new Error('component must look like com.example.app/.MainActivity');
        }
        parts.push('-n', String(args.component));
      }
      if (args.action !== undefined) { parts.push('-a', shellQuote(String(args.action))); }
      if (args.data !== undefined) { parts.push('-d', shellQuote(String(args.data))); }
      if (args.mimeType !== undefined) { parts.push('-t', shellQuote(String(args.mimeType))); }
      if (args.package !== undefined) { parts.push('-p', pkgArg(args)); }
      if (parts.length === (args.stopFirst ? 2 : 1)) {
        throw new Error('Pass component, or action and data.');
      }
      const extras = args.extras && typeof args.extras === 'object' ? Object.entries(args.extras as Args) : [];
      for (const [key, value] of extras) {
        const flag = typeof value === 'boolean' ? '--ez' : typeof value === 'number' ? (Number.isInteger(value) ? (Math.abs(value) > 2147483647 ? '--el' : '--ei') : '--ef') : '--es';
        parts.push(flag, shellQuote(key), shellQuote(String(value)));
      }
      const out = (await shell(serial, `${parts.join(' ')} 2>&1`, 60000)).trim();
      if (/^Error|Exception|unable to resolve/im.test(out)) {
        throw new Error(out);
      }
      return out;
    },
  },
  {
    name: 'push_file',
    description: 'Copy a file or folder from this computer to the device, for example test data to import into /sdcard/Download.',
    properties: { localPath: str('Absolute path on this computer'), devicePath: str('Destination on the device, for example /sdcard/Download/') },
    required: ['localPath', 'devicePath'],
    async run(args, serial) {
      const from = local(args.localPath, 'localPath');
      const out = (await adb(['-s', serial, 'push', from, String(args.devicePath)], { timeout: 600000 })).toString();
      return out.trim().split('\n').pop() || `Pushed ${from}`;
    },
  },
  {
    name: 'pull_file',
    description: 'Copy a file or folder from the device to this computer, for example an exported file. With package, reads from a debuggable app\'s private storage (run-as), such as databases/app.db.',
    properties: {
      devicePath: str('Path on the device. With package, relative to the app data folder, for example databases/app.db'),
      localPath: str('Absolute destination path on this computer'),
      package: str('Debuggable app whose private files to read'),
    },
    required: ['devicePath', 'localPath'],
    async run(args, serial) {
      const to = local(args.localPath, 'localPath');
      const from = String(args.devicePath ?? '');
      if (args.package) {
        const pkg = pkgArg(args);
        const data = await adb(['-s', serial, 'exec-out', `run-as ${pkg} cat ${shellQuote(from)}`], { timeout: 300000 });
        if (/^run-as: |No such file|Permission denied|is a directory/.test(data.subarray(0, 200).toString())) {
          throw new Error(data.toString().trim().split('\n')[0]);
        }
        fs.writeFileSync(to, data);
        return `Saved ${data.length} bytes to ${to}`;
      }
      const out = (await adb(['-s', serial, 'pull', from, to], { timeout: 600000 })).toString();
      return out.trim().split('\n').pop() || `Pulled to ${to}`;
    },
  },
  {
    name: 'screen_record',
    description: 'Record the screen to an MP4, for animations and timing bugs that screenshots miss. Call with action start, do the steps, then action stop to save the video on this computer. Recordings end on their own after timeLimit seconds (max 180).',
    properties: {
      action: { type: 'string', enum: ['start', 'stop'], description: 'start or stop' },
      timeLimit: num('start: maximum length in seconds, default 180'),
      localPath: str('stop: absolute path for the .mp4, default a file in the temp folder'),
    },
    required: ['action'],
    async run(args, serial) {
      if (args.action === 'start') {
        await startRecording(ADB, serial, int(args, 'timeLimit', 180));
        return `Recording ${serial}. Call screen_record with action stop to save it.`;
      }
      if (args.action !== 'stop') {
        throw new Error('action must be start or stop');
      }
      if (!isRecording(serial)) {
        throw new Error('No recording is running on this device. Start one first.');
      }
      const to = args.localPath === undefined ? path.join(os.tmpdir(), `droidbridge-${Date.now()}.mp4`) : local(args.localPath, 'localPath');
      return `Saved the recording to ${await stopRecording(ADB, serial, to)}`;
    },
  },
  {
    name: 'pair_device',
    description: 'Pair with a phone or tablet over Wi-Fi (Android 11 and later). On the device: Developer options > Wireless debugging > Pair device with pairing code, then pass the IP address and port and the code shown there. Then call connect_device with the port shown on the Wireless debugging screen.',
    properties: { address: str('IP:port from the pairing dialog'), code: str('6 digit pairing code') },
    required: ['address', 'code'],
    noDevice: true,
    async run(args) {
      const address = String(args.address ?? '');
      if (!/^[\w.:[\]-]+:\d+$/.test(address) || !/^\d{6}$/.test(String(args.code ?? ''))) {
        throw new Error('Pass address as IP:port and code as the 6 digit code.');
      }
      const out = (await adb(['pair', address, String(args.code)], { timeout: 30000 })).toString().trim();
      if (!/Successfully paired/i.test(out)) {
        throw new Error(out || 'Pairing failed');
      }
      return out;
    },
  },
  {
    name: 'connect_device',
    description: 'Connect to a device over Wi-Fi by IP:port (the Wireless debugging port, or 5555 after adb tcpip).',
    properties: { address: str('IP:port, for example 192.168.1.20:37099') },
    required: ['address'],
    noDevice: true,
    async run(args) {
      const address = String(args.address ?? '');
      if (!/^[\w.:[\]-]+(:\d+)?$/.test(address)) {
        throw new Error('Pass address as IP:port.');
      }
      const out = (await adb(['connect', address], { timeout: 20000 })).toString().trim();
      if (!/connected to/i.test(out)) {
        throw new Error(out || 'Could not connect');
      }
      return out;
    },
  },
  {
    name: 'disconnect_device',
    description: 'Disconnect a Wi-Fi device by IP:port.',
    properties: { address: str('IP:port from list_devices') },
    required: ['address'],
    noDevice: true,
    async run(args) {
      const address = String(args.address ?? '');
      if (!/^[\w.:[\]-]+(:\d+)?$/.test(address)) {
        throw new Error('Pass address as IP:port.');
      }
      return (await adb(['disconnect', address], { timeout: 10000 })).toString().trim();
    },
  },
  {
    name: 'shell',
    description: 'Run a shell command on the device (adb shell) and return its output.',
    properties: { command: str('Command to run on the device') },
    required: ['command'],
    async run(args, serial) {
      return (await shell(serial, String(args.command), 60000)).trim() || '(no output)';
    },
  },
];

async function installBundle(serial: string, aab: string, allowDowngrade: boolean): Promise<string> {
  const tool = process.env.DROIDBRIDGE_BUNDLETOOL || 'bundletool';
  const [cmd, base] = tool.endsWith('.jar') ? ['java', ['-jar', tool]] : [tool, []];
  const apks = path.join(os.tmpdir(), `droidbridge-${Date.now()}.apks`);
  const adbFlag = path.isAbsolute(ADB) ? [`--adb=${ADB}`] : [];
  try {
    await run(cmd, [...base, 'build-apks', `--bundle=${aab}`, `--output=${apks}`, '--connected-device', `--device-id=${serial}`, ...adbFlag]);
    return (await run(cmd, [...base, 'install-apks', `--apks=${apks}`, `--device-id=${serial}`, ...adbFlag, ...(allowDowngrade ? ['--allow-downgrade'] : [])])).trim() || `Installed ${path.basename(aab)}`;
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (/ENOENT/.test(text)) {
      throw new Error('bundletool was not found. Install it (for example brew install bundletool) or set DROIDBRIDGE_BUNDLETOOL to the path of bundletool.jar.');
    }
    throw error;
  } finally {
    fs.rmSync(apks, { force: true });
  }
}

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

export async function handle(message: { id?: number | string; method: string; params?: Args | null }): Promise<object | undefined> {
  if (!message || typeof message !== 'object' || typeof message.method !== 'string') {
    return { jsonrpc: '2.0', id: (message as { id?: unknown } | null)?.id ?? null, error: { code: -32600, message: 'Invalid request' } };
  }
  const { id, method } = message;
  const params: Args = message.params ?? {};
  const reply = (result: object) => (id === undefined ? undefined : { jsonrpc: '2.0', id, result });
  switch (method) {
    case 'initialize': {
      const requested = String(params.protocolVersion ?? '');
      return reply({
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'droidbridge', version: process.env.DROIDBRIDGE_VERSION || 'dev' },
        instructions: 'Control a connected Android device or emulator. With nothing connected, list_devices shows emulators that start_emulator can boot. Typical loop: ui_tree or screenshot to see the screen, tap_element or tap to act, wait_for the next screen, then check again.',
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: { type: 'object', properties: t.noDevice ? t.properties : { ...t.properties, ...(t.acts ? expectProp : {}), ...serialProp }, required: t.required ?? [] },
        })),
      });
    case 'tools/call': {
      const tool = TOOLS.find(t => t.name === params.name);
      const args = (params.arguments ?? {}) as Args;
      if (!tool) {
        return id === undefined ? undefined : { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${params.name}` } };
      }
      try {
        const serial = tool.noDevice ? '' : await resolveSerial(typeof args.serial === 'string' ? args.serial : undefined);
        if (tool.acts && typeof args.expectPackage === 'string' && args.expectPackage) {
          const top = await foreground(serial);
          if (top.split('/')[0] !== args.expectPackage) {
            throw new Error(`Refused: ${top || 'nothing'} is in the foreground, not ${args.expectPackage}. Bring the app back (launch_app) and check the screen first.`);
          }
        }
        const result = await tool.run(args, serial);
        return reply({ content: typeof result === 'string' ? [{ type: 'text', text: result }] : result });
      } catch (error) {
        return reply({ content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }], isError: true });
      }
    }
    default:
      if (id === undefined) {
        return undefined;
      }
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

function main(): void {
  const rl = readline.createInterface({ input: process.stdin });
  let running = 0;
  let closed = false;
  const exitWhenIdle = () => { if (closed && running === 0) { process.stdout.write('', () => process.exit(0)); } };
  rl.on('line', async line => {
    if (!line.trim()) {
      return;
    }
    running++;
    try {
      await respond(line);
    } finally {
      running--;
      exitWhenIdle();
    }
  });
  rl.on('close', () => { closed = true; exitWhenIdle(); });
}

async function respond(line: string): Promise<void> {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
    return;
  }
  let response: object | undefined;
  try {
    response = await handle(message);
  } catch (error) {
    response = { jsonrpc: '2.0', id: message?.id ?? null, error: { code: -32603, message: error instanceof Error ? error.message : String(error) } };
  }
  if (response) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

if (require.main === module) {
  main();
}
