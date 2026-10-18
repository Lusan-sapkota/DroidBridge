import * as readline from 'readline';
import { adb, formatUiNode, KEYCODES, listDevices, resolveSerial, screenshot, shell, shellQuote, uiTree, UiNode } from './android';

type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };
type Args = Record<string, unknown>;

interface Tool {
  name: string;
  description: string;
  properties: Record<string, object>;
  required?: string[];
  run(args: Args, serial: string): Promise<Content[] | string>;
}

const serialProp = { serial: { type: 'string', description: 'Device serial from list_devices. Optional when one device is connected.' } };
const num = (description: string) => ({ type: 'number', description });
const str = (description: string) => ({ type: 'string', description });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
    async run() {
      const devices = await listDevices();
      return devices.length ? devices.map(d => `${d.serial}\t${d.state}${d.model ? `\t${d.model}` : ''}`).join('\n') : 'No devices connected.';
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
      await shell(serial, `input tap ${Math.round(Number(args.x))} ${Math.round(Number(args.y))}`);
      return `Tapped ${args.x},${args.y}`;
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
    name: 'long_press',
    description: 'Press and hold at device pixel coordinates.',
    properties: { x: num('X in device pixels'), y: num('Y in device pixels'), durationMs: num('Hold time, default 800') },
    required: ['x', 'y'],
    async run(args, serial) {
      const x = Math.round(Number(args.x));
      const y = Math.round(Number(args.y));
      await shell(serial, `input swipe ${x} ${y} ${x} ${y} ${Math.round(Number(args.durationMs ?? 800))}`);
      return `Long pressed ${x},${y}`;
    },
  },
  {
    name: 'swipe',
    description: 'Swipe between two device pixel points. Swipe up (y2 < y1) to scroll content down.',
    properties: { x1: num('Start x'), y1: num('Start y'), x2: num('End x'), y2: num('End y'), durationMs: num('Duration, default 300') },
    required: ['x1', 'y1', 'x2', 'y2'],
    async run(args, serial) {
      const v = ['x1', 'y1', 'x2', 'y2'].map(k => Math.round(Number(args[k])));
      await shell(serial, `input swipe ${v.join(' ')} ${Math.round(Number(args.durationMs ?? 300))}`);
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
      // logcat applies -t before the priority filter, so filter the whole buffer and keep the tail here.
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

export async function handle(message: { id?: number | string; method: string; params?: Args }): Promise<object | undefined> {
  const { id, method, params = {} } = message;
  const reply = (result: object) => (id === undefined ? undefined : { jsonrpc: '2.0', id, result });
  switch (method) {
    case 'initialize': {
      const requested = String(params.protocolVersion ?? '');
      return reply({
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'droidbridge', version: '0.1.0' },
        instructions: 'Control a connected Android device. Typical loop: ui_tree or screenshot to see the screen, tap_element or tap to act, then check again.',
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: { type: 'object', properties: t.name === 'list_devices' ? {} : { ...t.properties, ...serialProp }, required: t.required ?? [] },
        })),
      });
    case 'tools/call': {
      const tool = TOOLS.find(t => t.name === params.name);
      const args = (params.arguments ?? {}) as Args;
      try {
        if (!tool) {
          throw new Error(`Unknown tool ${params.name}`);
        }
        const serial = tool.name === 'list_devices' ? '' : await resolveSerial(typeof args.serial === 'string' ? args.serial : undefined);
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
  rl.on('line', async line => {
    if (!line.trim()) {
      return;
    }
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
      return;
    }
    const response = await handle(message);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  });
  rl.on('close', () => process.exit(0));
}

if (require.main === module) {
  main();
}
