import { ChildProcess, execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as zlib from 'zlib';
import { deviceLoad, isBusy } from './avd';

export const ADB = process.env.DROIDBRIDGE_ADB || 'adb';

export function adb(args: string[], options: { binary?: boolean; timeout?: number } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(ADB, args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024, timeout: options.timeout ?? 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr.toString() || error.message).trim()));
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function listDevices(): Promise<{ serial: string; state: string; model?: string }[]> {
  const out = (await adb(['devices', '-l'])).toString();
  return out.split('\n').slice(1).map(l => l.trim()).filter(Boolean).map(l => {
    const [serial, state] = l.split(/\s+/);
    return { serial, state, model: /model:(\S+)/.exec(l)?.[1] };
  });
}

export async function resolveSerial(serial?: string): Promise<string> {
  if (serial) {
    return serial;
  }
  const online = (await listDevices()).filter(d => d.state === 'device');
  const preferred = process.env.DROIDBRIDGE_SERIAL;
  if (preferred && online.some(d => d.serial === preferred)) {
    return preferred;
  }
  if (online.length === 1) {
    return online[0].serial;
  }
  if (online.length === 0) {
    throw new Error('No Android device connected. Call start_emulator to boot an emulator, or connect a phone over USB or with DroidBridge: Connect to Device.');
  }
  throw new Error(`Several devices are connected (${online.map(d => d.serial).join(', ')}). Pass "serial".`);
}

export function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export async function shell(serial: string, command: string, timeout?: number): Promise<string> {
  return (await adb(['-s', serial, 'shell', command], { timeout })).toString();
}

export interface Screenshot {
  png: Buffer;
  width: number;
  height: number;
  deviceWidth: number;
  deviceHeight: number;
  scale: number;
}

export async function screenshot(serial: string, maxSide = 1024): Promise<Screenshot> {
  return encodeScreencap(await adb(['-s', serial, 'exec-out', 'screencap'], { timeout: 60000 }), maxSide);
}

const PIXEL_FORMATS: Record<number, { bpp: number; r: number; g: number; b: number }> = {
  1: { bpp: 4, r: 0, g: 1, b: 2 },
  2: { bpp: 4, r: 0, g: 1, b: 2 },
  3: { bpp: 3, r: 0, g: 1, b: 2 },
  4: { bpp: 2, r: -1, g: -1, b: -1 },
  5: { bpp: 4, r: 2, g: 1, b: 0 },
};

export function encodeScreencap(raw: Buffer, maxSide = 1024): Screenshot {
  maxSide = Number.isFinite(maxSide) && maxSide >= 64 ? Math.min(maxSide, 4096) : 1024;
  const w = raw.readUInt32LE(0);
  const h = raw.readUInt32LE(4);
  const format = PIXEL_FORMATS[raw.readUInt32LE(8)];
  if (!format) {
    throw new Error(`Unsupported screencap pixel format ${raw.readUInt32LE(8)}`);
  }
  const { bpp } = format;
  const header = raw.length - w * h * bpp;
  if (header !== 12 && header !== 16) {
    throw new Error('Unexpected screencap format');
  }
  const k = Math.max(1, Math.ceil(Math.max(w, h) / maxSide));
  const ow = Math.max(1, Math.floor(w / k));
  const oh = Math.max(1, Math.floor(h / k));
  const rows = Buffer.alloc(oh * (ow * 3 + 1));
  for (let y = 0; y < oh; y++) {
    const rowStart = y * (ow * 3 + 1);
    for (let x = 0; x < ow; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < k; dy++) {
        let p = header + ((y * k + dy) * w + x * k) * bpp;
        for (let dx = 0; dx < k; dx++, p += bpp) {
          if (bpp === 2) {
            const v = raw.readUInt16LE(p);
            r += ((v >> 11) & 31) * 255 / 31; g += ((v >> 5) & 63) * 255 / 63; b += (v & 31) * 255 / 31;
          } else {
            r += raw[p + format.r]; g += raw[p + format.g]; b += raw[p + format.b];
          }
        }
      }
      const n = k * k;
      const o = rowStart + 1 + x * 3;
      rows[o] = r / n; rows[o + 1] = g / n; rows[o + 2] = b / n;
    }
    rows[rowStart] = 1;
    for (let i = rowStart + ow * 3; i > rowStart + 3; i--) {
      rows[i] = (rows[i] - rows[i - 3]) & 0xff;
    }
  }
  return { png: encodePng(rows, ow, oh), width: ow, height: oh, deviceWidth: w, deviceHeight: h, scale: k };
}

export function encodePng(rows: Buffer, width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])));
  return Buffer.concat([head, data, crc]);
}

export interface UiNode {
  index: number;
  cls: string;
  text: string;
  desc: string;
  id: string;
  clickable: boolean;
  scrollable: boolean;
  checked?: boolean;
  focused: boolean;
  x: number;
  y: number;
  bounds: string;
  rect: [number, number, number, number];
}

export interface UiDump {
  nodes: UiNode[];
  total: number;
  packages: string[];
}

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');

export function parseUiTree(xml: string): UiNode[] {
  const nodes: UiNode[] = [];
  for (const m of xml.matchAll(/<node\s([^>]*?)\/?>/g)) {
    const a: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) {
      a[k] = decode(v);
    }
    const b = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(a.bounds || '');
    if (!b) {
      continue;
    }
    const node: UiNode = {
      index: nodes.length,
      cls: (a.class || '').split('.').pop() || '',
      text: a.text || '',
      desc: a['content-desc'] || '',
      id: (a['resource-id'] || '').replace(/^.*:id\//, ''),
      clickable: a.clickable === 'true' || a['long-clickable'] === 'true',
      scrollable: a.scrollable === 'true',
      checked: a.checkable === 'true' ? a.checked === 'true' : undefined,
      focused: a.focused === 'true',
      x: Math.round((+b[1] + +b[3]) / 2),
      y: Math.round((+b[2] + +b[4]) / 2),
      bounds: a.bounds,
      rect: [+b[1], +b[2], +b[3], +b[4]],
    };
    if (node.text || node.desc || node.clickable || node.scrollable || (node.id && node.cls.includes('Edit'))) {
      nodes.push(node);
    }
  }
  return nodes;
}

export function formatUiNode(n: UiNode): string {
  const parts = [`#${n.index}`, n.cls];
  if (n.text) { parts.push(JSON.stringify(n.text)); }
  if (n.desc) { parts.push(`desc=${JSON.stringify(n.desc)}`); }
  if (n.id) { parts.push(`id=${n.id}`); }
  if (n.clickable) { parts.push('clickable'); }
  if (n.scrollable) { parts.push('scrollable'); }
  if (n.checked !== undefined) { parts.push(n.checked ? 'checked' : 'unchecked'); }
  if (n.focused) { parts.push('focused'); }
  parts.push(`center=${n.x},${n.y}`);
  return parts.join(' ');
}

export function parseUiDump(xml: string): UiDump {
  const packages = new Set([...xml.matchAll(/\spackage="([^"]+)"/g)].map(m => m[1]));
  return { nodes: parseUiTree(xml), total: (xml.match(/<node\s/g) ?? []).length, packages: [...packages] };
}

let uiQueue: Promise<unknown> = Promise.resolve();

export function uiTree(serial: string, attempts = 3): Promise<UiDump> {
  const run = uiQueue.then(() => readUiTree(serial, attempts));
  uiQueue = run.catch(() => undefined);
  return run;
}

async function readUiTree(serial: string, attempts: number): Promise<UiDump> {
  const path = `/data/local/tmp/droidbridge-ui-${process.pid}-${Date.now()}.xml`;
  let reason = '';
  for (let attempt = 0; attempt < attempts; attempt++) {
    const out = await shell(serial, `uiautomator dump ${path} 2>&1 | tail -1; cat ${path} 2>/dev/null; rm -f ${path}`, 20000).catch(e => String(e.message));
    const start = out.indexOf('<?xml');
    if (out.includes('<hierarchy')) {
      return parseUiDump(out.slice(Math.max(start, 0)));
    }
    reason = out.trim().split('\n').pop() ?? '';
    await new Promise(r => setTimeout(r, 700));
  }
  const load = attempts > 1 ? await deviceLoad(ADB, serial) : undefined;
  if (isBusy(load)) {
    throw new Error(`Could not read the screen UI: the device is overloaded (load ${load!.load.toFixed(1)} on ${load!.cores} cores), common for a minute or two after starting. Wait and try again, or use screenshot.`);
  }
  const hint = /idle state/i.test(reason) ? 'The app animates continuously, so UI Automator never sees it idle.' : 'The screen may be animating or show protected content.';
  throw new Error(`Could not read the screen UI (uiautomator: ${reason || 'no output'}). ${hint} Try again, or use screenshot.`);
}

export async function viewHierarchy(serial: string, maxLines = 150): Promise<string> {
  const out = await shell(serial, 'dumpsys activity top 2>/dev/null', 30000);
  const activity = out.lastIndexOf('\n  ACTIVITY ');
  const section = out.slice(activity).split('View Hierarchy:')[1];
  if (activity < 0 || !section) {
    return '';
  }
  const lines = section.split('\n').slice(1);
  const end = lines.findIndex(l => !/^\s{6,}\S/.test(l));
  const views = lines.slice(0, end < 0 ? undefined : end)
    .filter(l => /\{\w+ V/.test(l))
    .map(l => l.replace(/^ {6}/, '').replace(/\{\w+ (\S+ \S+) /, '{$1 '));
  const name = /ACTIVITY (\S+)/.exec(out.slice(activity))?.[1];
  return `${name}\n${views.slice(0, maxLines).join('\n')}${views.length > maxLines ? `\n... ${views.length - maxLines} more` : ''}`;
}

export async function foreground(serial: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const out = await shell(serial, 'dumpsys activity activities 2>/dev/null | grep -m1 -E "topResumedActivity|mResumedActivity"; true');
    const top = /\{\S+ \S+ (\S+)/.exec(out)?.[1];
    if (top || attempt >= 2) {
      return top ?? '';
    }
    await new Promise(r => setTimeout(r, 400));
  }
}

export const SCRCPY_VERSION = '3.3.4';
export const SCRCPY_REMOTE_JAR = '/data/local/tmp/droidbridge-scrcpy-server.jar';

function scrcpyServer(): string {
  const candidates = [process.env.DROIDBRIDGE_SCRCPY_SERVER, path.join(__dirname, 'scrcpy-server'), path.join(__dirname, '..', 'resources', 'scrcpy-server')];
  const found = candidates.find(c => c && fs.existsSync(c));
  if (!found) {
    throw new Error('scrcpy-server was not found next to the MCP server. Reinstall DroidBridge or run DroidBridge: Set Up AI Agent Access again.');
  }
  return found;
}

export function clipboardMessage(text: string, paste: boolean, sequence = 1): Buffer {
  const body = Buffer.from(text, 'utf8');
  const head = Buffer.alloc(14);
  head[0] = 9;
  head.writeBigUInt64BE(BigInt(sequence), 1);
  head[9] = paste ? 1 : 0;
  head.writeUInt32BE(body.length, 10);
  return Buffer.concat([head, body]);
}

export async function pasteText(serial: string, text: string): Promise<void> {
  await adb(['-s', serial, 'push', scrcpyServer(), SCRCPY_REMOTE_JAR]);
  const scid = Math.floor(Math.random() * 0x7fffffff).toString(16).padStart(8, '0');
  const port = parseInt((await adb(['-s', serial, 'forward', 'tcp:0', `localabstract:scrcpy_${scid}`])).toString(), 10);
  const server = spawn(ADB, ['-s', serial, 'shell', `CLASSPATH=${SCRCPY_REMOTE_JAR}`, 'app_process', '/', 'com.genymobile.scrcpy.Server', SCRCPY_VERSION,
    `scid=${scid}`, 'tunnel_forward=true', 'video=false', 'audio=false', 'control=true', 'clipboard_autosync=false', 'send_device_meta=false', 'log_level=warn']);
  server.on('error', () => undefined);
  let socket: net.Socket | undefined;
  try {
    for (let attempt = 0; attempt < 50 && !socket && server.exitCode === null; attempt++) {
      const s = net.connect(port, '127.0.0.1');
      const ok = await new Promise<boolean>(resolve => {
        s.once('data', () => resolve(true));
        s.once('close', () => resolve(false));
        s.on('error', () => undefined);
      });
      if (ok) {
        socket = s;
      } else {
        s.destroy();
        await new Promise(r => setTimeout(r, 100));
      }
    }
    if (!socket) {
      throw new Error('Could not start the input helper on the device.');
    }
    const acked = new Promise<void>((resolve, reject) => {
      let reply = Buffer.alloc(0);
      socket!.on('data', (d: Buffer) => {
        reply = Buffer.concat([reply, d]);
        if (reply.length >= 9 && reply[0] === 1) {
          resolve();
        }
      });
      socket!.once('close', () => reject(new Error('The device closed the input helper before pasting.')));
      setTimeout(() => reject(new Error('The device did not confirm the paste.')), 10000);
    });
    socket.write(clipboardMessage(text, true));
    await acked;
    await new Promise(r => setTimeout(r, 300));
  } finally {
    socket?.destroy();
    server.kill();
    adb(['-s', serial, 'forward', '--remove', `tcp:${port}`]).catch(() => undefined);
  }
}

const recordings = new Map<string, { proc: ChildProcess; remote: string }>();

export function startRecording(adbPath: string, serial: string, seconds = 180): string {
  if (recordings.has(serial)) {
    throw new Error('A recording is already running on this device.');
  }
  const remote = `/sdcard/droidbridge-${Date.now()}.mp4`;
  const proc = spawn(adbPath, ['-s', serial, 'shell', 'screenrecord', '--time-limit', String(Math.min(Math.max(Math.round(seconds), 1), 180)), remote]);
  proc.on('error', () => undefined);
  proc.on('exit', () => { if (recordings.get(serial)?.proc === proc && proc.exitCode) { recordings.delete(serial); } });
  recordings.set(serial, { proc, remote });
  return remote;
}

export function isRecording(serial: string): boolean {
  return recordings.has(serial);
}

export async function stopRecording(adbPath: string, serial: string, local: string): Promise<string> {
  const rec = recordings.get(serial);
  if (!rec) {
    throw new Error('No recording is running on this device.');
  }
  recordings.delete(serial);
  const run = (args: string[]) => new Promise<void>((resolve, reject) => execFile(adbPath, ['-s', serial, ...args], { timeout: 60000 }, (e, _o, err) => (e ? reject(new Error((err || e.message).trim())) : resolve())));
  if (rec.proc.exitCode === null) {
    const exited = new Promise(r => rec.proc.once('exit', r));
    await run(['shell', 'pkill -INT screenrecord']).catch(() => undefined);
    await Promise.race([exited, new Promise(r => setTimeout(r, 5000))]);
  }
  await new Promise(r => setTimeout(r, 500));
  try {
    await run(['pull', rec.remote, local]);
    if (!fs.statSync(local).size) {
      fs.rmSync(local, { force: true });
      throw new Error('The recording is empty. Record for at least a second before stopping.');
    }
  } finally {
    await run(['shell', `rm -f ${rec.remote}`]).catch(() => undefined);
  }
  return local;
}

export const KEYCODES: Record<string, number> = {
  back: 4, home: 3, recents: 187, app_switch: 187, enter: 66, delete: 67, backspace: 67, forward_delete: 112,
  tab: 61, space: 62, escape: 111, up: 19, down: 20, left: 21, right: 22, menu: 82, search: 84,
  power: 26, wakeup: 224, sleep: 223, volume_up: 24, volume_down: 25, volume_mute: 164,
  move_home: 122, move_end: 123, page_up: 92, page_down: 93, camera: 27, notification: 83,
};
