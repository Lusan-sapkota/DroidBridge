import { execFile } from 'child_process';
import * as zlib from 'zlib';

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

/**
 * Picks the device for a call: explicit serial, then DROIDBRIDGE_SERIAL, then the only online device.
 */
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
    throw new Error('No Android device connected. Connect one over USB or with DroidBridge: Connect to Device.');
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

/**
 * Raw screencap downscaled by an integer box filter so the longest side is at most maxSide.
 */
export async function screenshot(serial: string, maxSide = 1024): Promise<Screenshot> {
  const raw = await adb(['-s', serial, 'exec-out', 'screencap'], { timeout: 60000 });
  const w = raw.readUInt32LE(0);
  const h = raw.readUInt32LE(4);
  const header = raw.length - w * h * 4;
  if (header !== 12 && header !== 16) {
    throw new Error('Unexpected screencap format');
  }
  const k = Math.max(1, Math.ceil(Math.max(w, h) / maxSide));
  const ow = Math.floor(w / k);
  const oh = Math.floor(h / k);
  const rows = Buffer.alloc(oh * (ow * 3 + 1));
  for (let y = 0; y < oh; y++) {
    const rowStart = y * (ow * 3 + 1);
    for (let x = 0; x < ow; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < k; dy++) {
        let p = header + ((y * k + dy) * w + x * k) * 4;
        for (let dx = 0; dx < k; dx++, p += 4) {
          r += raw[p]; g += raw[p + 1]; b += raw[p + 2];
        }
      }
      const n = k * k;
      const o = rowStart + 1 + x * 3;
      rows[o] = r / n; rows[o + 1] = g / n; rows[o + 2] = b / n;
    }
    // PNG "Sub" filter: store each byte as the difference to the pixel on its left, which compresses far better.
    rows[rowStart] = 1;
    for (let i = rowStart + ow * 3; i > rowStart + 3; i--) {
      rows[i] = (rows[i] - rows[i - 3]) & 0xff;
    }
  }
  return { png: encodePng(rows, ow, oh), width: ow, height: oh, deviceWidth: w, deviceHeight: h, scale: k };
}

/** Encodes RGB rows, each prefixed with its PNG filter type byte, as a PNG. */
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
}

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');

/** Keeps nodes that carry text, a description, an id, or accept input. */
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

export async function uiTree(serial: string): Promise<UiNode[]> {
  const path = '/data/local/tmp/droidbridge-ui.xml';
  const xml = await shell(serial, `uiautomator dump ${path} >/dev/null && cat ${path}`, 30000);
  if (!xml.includes('<hierarchy')) {
    throw new Error(`UI dump failed: ${xml.trim().slice(0, 200)}`);
  }
  return parseUiTree(xml);
}

export const KEYCODES: Record<string, number> = {
  back: 4, home: 3, recents: 187, app_switch: 187, enter: 66, delete: 67, backspace: 67, forward_delete: 112,
  tab: 61, space: 62, escape: 111, up: 19, down: 20, left: 21, right: 22, menu: 82, search: 84,
  power: 26, wakeup: 224, sleep: 223, volume_up: 24, volume_down: 25, volume_mute: 164,
  move_home: 122, move_end: 123, page_up: 92, page_down: 93, camera: 27, notification: 83,
};
