import * as readline from 'readline';
import { ADB, adb, formatUiNode, KEYCODES, listDevices, resolveSerial, screenshot, shell, shellQuote, uiTree, UiNode } from './android';
import { avdName, bootAvd, emulators, emulatorTool, findSdk, killEmulators, listAvds, pendingEmulators, recoverPending } from './avd';

type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };
type Args = Record<string, unknown>;

interface Tool {
  name: string;
  description: string;
  properties: Record<string, object>;
  required?: string[];
  noDevice?: boolean;
  run(args: Args, serial: string): Promise<Content[] | string>;
}

const serialProp = { serial: { type: 'string', description: 'Device serial from list_devices. Optional when one device is connected.' } };
const num = (description: string) => ({ type: 'number', description });
const str = (description: string) => ({ type: 'string', description });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function int(args: Args, key: string, fallback?: number): number {
  const v = Math.round(Number(args[key] ?? fallback));
  if (!Number.isFinite(v)) {
    throw new Error(`"${key}" must be a number`);
  }
  return v;
}

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
    description: 'Restart the ADB server when devices show as offline or commands hang. Stops any running screen mirror.',
    properties: {},
    noDevice: true,
    async run() {
      await adb(['kill-server'], { timeout: 10000 }).catch(() => undefined);
      await adb(['start-server'], { timeout: 30000 });
      await adb(['reconnect', 'offline'], { timeout: 10000 }).catch(() => undefined);
      return `ADB restarted.\n\n${(await listDevices()).map(d => `${d.serial}\t${d.state}`).join('\n') || 'No devices connected yet; USB devices and emulators can take a few seconds to reappear.'}`;
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
    description: 'List on-screen UI elements (text, content description, resource id, clickable, center coordinates in device pixels). Use this to find what to tap.',
    properties: { filter: str('Only return elements whose text, description or id contains this (case-insensitive).') },
    async run(args, serial) {
      let nodes = await uiTree(serial);
      const f = typeof args.filter === 'string' ? args.filter.toLowerCase() : '';
      if (f) {
        nodes = nodes.filter(n => `${n.text} ${n.desc} ${n.id}`.toLowerCase().includes(f));
      }
      return nodes.length ? nodes.map(formatUiNode).join('\n') : 'No matching elements.';
    },
  },
  {
    name: 'tap',
    description: 'Tap at device pixel coordinates.',
    properties: { x: num('X in device pixels'), y: num('Y in device pixels') },
    required: ['x', 'y'],
    async run(args, serial) {
      const x = int(args, 'x');
      const y = int(args, 'y');
      await shell(serial, `input tap ${x} ${y}`);
      return `Tapped ${x},${y}`;
    },
  },
  {
    name: 'tap_element',
    description: 'Find an element by text, resource id or content description and tap its center. At least one of text, id, desc is required.',
    properties: { text: str('Visible text (substring, case-insensitive)'), id: str('Resource id, with or without package prefix'), desc: str('Content description (substring)') },
    async run(args, serial) {
      if (!args.text && !args.id && !args.desc) {
        throw new Error('Pass text, id or desc.');
      }
      const node = findNode(await uiTree(serial), args);
      if (!node) {
        throw new Error('No matching element on screen. Call ui_tree to see what is there.');
      }
      await shell(serial, `input tap ${node.x} ${node.y}`);
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
      for (;;) {
        let nodes: UiNode[] | undefined;
        let failure: unknown;
        try {
          nodes = await uiTree(serial, 1);
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
        await sleep(500);
      }
    },
  },
  {
    name: 'long_press',
    description: 'Press and hold at device pixel coordinates.',
    properties: { x: num('X in device pixels'), y: num('Y in device pixels'), durationMs: num('Hold time, default 800') },
    required: ['x', 'y'],
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
    async run(args, serial) {
      const v = ['x1', 'y1', 'x2', 'y2'].map(k => int(args, k));
      await shell(serial, `input swipe ${v.join(' ')} ${int(args, 'durationMs', 300)}`);
      return `Swiped ${v[0]},${v[1]} -> ${v[2]},${v[3]}`;
    },
  },
  {
    name: 'type_text',
    description: 'Type text into the focused field (tap the field first). ASCII only.',
    properties: { text: str('Text to type'), submit: { type: 'boolean', description: 'Press Enter afterwards' } },
    required: ['text'],
    async run(args, serial) {
      const text = String(args.text);
      if (/[^\x20-\x7e]/.test(text)) {
        throw new Error('Only printable ASCII can be typed through adb.');
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
    description: 'Model, Android version, screen size, density and rotation, load, free memory and battery. Check load when the device seems slow.',
    properties: {},
    async run(_args, serial) {
      const out = await shell(serial, [
        'echo "Device: $(getprop ro.product.manufacturer) $(getprop ro.product.model)"',
        'echo "Android: $(getprop ro.build.version.release) (API $(getprop ro.build.version.sdk))"',
        'wm size | tail -1',
        'wm density | tail -1',
        'echo "Rotation: $(dumpsys input | grep -m1 -o "SurfaceOrientation: [0-9]" | cut -d" " -f2) (0 is natural)"',
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
      const out = await shell(serial, 'dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity"');
      return /\{\S+ \S+ (\S+)/.exec(out)?.[1] ?? out.trim();
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
    description: 'Install or update an APK from a path on this computer.',
    properties: { path: str('Absolute path to the .apk file') },
    required: ['path'],
    async run(args, serial) {
      const out = (await adb(['-s', serial, 'install', '-r', String(args.path)], { timeout: 300000 })).toString();
      return out.trim();
    },
  },
  {
    name: 'logcat',
    description: 'Read recent device logs.',
    properties: {
      lines: num('Number of recent lines, default 200'),
      level: { type: 'string', enum: ['V', 'D', 'I', 'W', 'E', 'F'], description: 'Minimum priority' },
      filter: str('Only lines containing this text (case-insensitive)'),
      clear: { type: 'boolean', description: 'Clear the log buffer after reading' },
    },
    async run(args, serial) {
      const lines = Math.min(Math.max(Number(args.lines ?? 200), 1), 5000);
      const level = typeof args.level === 'string' && /^[VDIWEF]$/.test(args.level) ? ` '*:${args.level}'` : '';
      const f = typeof args.filter === 'string' ? args.filter.toLowerCase() : '';
      const out = (await shell(serial, `logcat -d${level}`, 60000))
        .split('\n').filter(l => l && !l.startsWith('---------') && (!f || l.toLowerCase().includes(f)))
        .slice(-lines).join('\n');
      if (args.clear) {
        await shell(serial, 'logcat -c');
      }
      return out.trim() || 'No log lines.';
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
          inputSchema: { type: 'object', properties: t.noDevice ? t.properties : { ...t.properties, ...serialProp }, required: t.required ?? [] },
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
