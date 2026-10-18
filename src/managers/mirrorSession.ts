import { ChildProcess, execFile, spawn } from 'child_process';
import * as net from 'net';
import { Logger } from './logger';

export interface MirrorTarget {
  postMessage(message: unknown): Thenable<boolean> | Promise<boolean>;
}

export interface MirrorStartOptions {
  adbPath: string;
  serverPath: string;
  serial?: string;
  maxSize?: number;
  bitrate?: number | string;
}

export type MirrorInput =
  | { kind: 'touch'; action: number; pointerId: number; x: number; y: number; w: number; h: number; pressure: number }
  | { kind: 'scroll'; x: number; y: number; w: number; h: number; hscroll: number; vscroll: number }
  | { kind: 'key'; keycode: number }
  | { kind: 'text'; text: string }
  | { kind: 'back' }
  | { kind: 'rotate' };

// Bundled resources/scrcpy-server is the official scrcpy release of this version; the control
// message layout in serializeInput matches it.
export const SERVER_VERSION = '3.3.4';
const REMOTE_JAR = '/data/local/tmp/droidbridge-scrcpy-server.jar';
const MSG_INJECT_KEYCODE = 0;
const MSG_INJECT_TEXT = 1;
const MSG_INJECT_TOUCH = 2;
const MSG_INJECT_SCROLL = 3;
const MSG_BACK_OR_SCREEN_ON = 4;
const MSG_ROTATE_DEVICE = 11;
const MSG_RESET_VIDEO = 17;

export function serializeInput(input: MirrorInput): Buffer[] {
  switch (input.kind) {
    case 'touch': {
      const b = Buffer.alloc(32);
      b[0] = MSG_INJECT_TOUCH;
      b[1] = input.action;
      b.writeBigInt64BE(BigInt(input.pointerId), 2);
      writePosition(b, 10, input);
      b.writeUInt16BE(input.action === 1 ? 0 : toU16fp(input.pressure), 22);
      return [b];
    }
    case 'scroll': {
      const b = Buffer.alloc(21);
      b[0] = MSG_INJECT_SCROLL;
      writePosition(b, 1, input);
      b.writeInt16BE(toI16fp(input.hscroll / 16), 13);
      b.writeInt16BE(toI16fp(input.vscroll / 16), 15);
      return [b];
    }
    case 'key':
      return [0, 1].map(action => {
        const b = Buffer.alloc(14);
        b[0] = MSG_INJECT_KEYCODE;
        b[1] = action;
        b.writeInt32BE(input.keycode, 2);
        return b;
      });
    case 'text': {
      const text = Buffer.from(input.text, 'utf8').subarray(0, 300);
      const b = Buffer.alloc(5);
      b[0] = MSG_INJECT_TEXT;
      b.writeUInt32BE(text.length, 1);
      return [Buffer.concat([b, text])];
    }
    case 'back':
      return [0, 1].map(action => Buffer.from([MSG_BACK_OR_SCREEN_ON, action]));
    case 'rotate':
      return [Buffer.from([MSG_ROTATE_DEVICE])];
  }
}

function writePosition(b: Buffer, offset: number, p: { x: number; y: number; w: number; h: number }): void {
  b.writeInt32BE(Math.round(p.x), offset);
  b.writeInt32BE(Math.round(p.y), offset + 4);
  b.writeUInt16BE(p.w, offset + 8);
  b.writeUInt16BE(p.h, offset + 10);
}

function toU16fp(v: number): number {
  return Math.min(0xffff, Math.max(0, Math.round(v * 0x10000)));
}

function toI16fp(v: number): number {
  return Math.min(0x7fff, Math.max(-0x8000, Math.round(Math.min(1, Math.max(-1, v)) * 0x8000)));
}

function run(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) { reject(new Error((stderr || error.message).trim())); } else { resolve(stdout); }
    });
  });
}

export class MirrorSession {
  private server?: ChildProcess;
  private video?: net.Socket;
  private control?: net.Socket;
  private port?: number;
  private adbArgs: string[] = [];
  private adbPath = 'adb';
  private target?: MirrorTarget;
  private configPacket?: Uint8Array;
  private size?: { width: number; height: number };
  private stopping = false;
  private streaming = false;

  constructor(private readonly logger: Logger, private readonly onStopped: (reason?: string) => void) {}

  get running(): boolean {
    return !!this.video && !this.stopping;
  }

  setTarget(target: MirrorTarget | undefined): void {
    this.target = target;
    this.resync();
  }

  /** Resend codec config and request a keyframe so a fresh decoder can start. */
  resync(): void {
    if (!this.running || !this.target) {
      return;
    }
    if (this.size) {
      this.target.postMessage({ type: 'mirrorStarted', ...this.size });
    }
    // Resetting before capture starts crashes the scrcpy server; the first keyframe is on its way anyway.
    if (this.streaming) {
      this.control?.write(Buffer.from([MSG_RESET_VIDEO]));
    }
  }

  sendInput(input: MirrorInput): void {
    if (this.control && !this.control.destroyed) {
      for (const b of serializeInput(input)) {
        this.control.write(b);
      }
    }
  }

  async start(options: MirrorStartOptions): Promise<void> {
    if (this.server) {
      throw new Error('Mirror is already running');
    }
    this.stopping = false;
    this.adbPath = options.adbPath;
    this.adbArgs = options.serial ? ['-s', options.serial] : [];

    const scid = Math.floor(Math.random() * 0x7fffffff).toString(16).padStart(8, '0');
    await this.adb(['push', options.serverPath, REMOTE_JAR]);
    this.port = parseInt(await this.adb(['forward', 'tcp:0', `localabstract:scrcpy_${scid}`]), 10);

    const args = [
      'shell', `CLASSPATH=${REMOTE_JAR}`, 'app_process', '/', 'com.genymobile.scrcpy.Server', SERVER_VERSION,
      `scid=${scid}`, 'tunnel_forward=true', 'audio=false', 'control=true', 'video_codec=h264',
      'stay_awake=true', 'log_level=info',
    ];
    if (options.maxSize) { args.push(`max_size=${options.maxSize}`); }
    if (options.bitrate) { args.push(`video_bit_rate=${parseBitrate(options.bitrate)}`); }

    let serverLog = '';
    this.server = spawn(this.adbPath, [...this.adbArgs, ...args]);
    this.server.stdout?.on('data', d => { serverLog += d; this.logger.logProcessOutput('scrcpy-server', d.toString()); });
    this.server.stderr?.on('data', d => { serverLog += d; this.logger.logProcessOutput('scrcpy-server', d.toString()); });
    this.server.on('close', () => this.stop(this.stopping ? undefined : 'Device mirror server exited'));

    try {
      this.video = await this.connectVideo();
      this.control = await this.connect();
    } catch (error) {
      const detail = serverLog.split('\n').find(l => /ERROR|Exception/.test(l))?.trim();
      await this.stop();
      throw new Error(detail || (error instanceof Error ? error.message : String(error)));
    }
    this.control.on('data', () => { /* device messages (clipboard etc.) are not used */ });
    this.control.on('error', () => this.stop('Mirror control connection lost'));
    this.readVideo(this.video);
  }

  async stop(reason?: string): Promise<void> {
    if (this.stopping && !this.server) {
      return;
    }
    const wasRunning = !!this.server;
    this.stopping = true;
    this.video?.destroy();
    this.control?.destroy();
    this.server?.kill();
    this.video = this.control = this.server = undefined;
    this.configPacket = this.size = undefined;
    this.streaming = false;
    if (this.port) {
      const port = this.port;
      this.port = undefined;
      await this.adb(['forward', '--remove', `tcp:${port}`]).catch(() => undefined);
    }
    if (wasRunning) {
      this.target?.postMessage({ type: 'mirrorStopped', reason });
      this.onStopped(reason);
    }
  }

  private adb(args: string[]): Promise<string> {
    return run(this.adbPath, [...this.adbArgs, ...args]);
  }

  private connect(): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(this.port!, '127.0.0.1');
      socket.once('connect', () => resolve(socket));
      socket.once('error', reject);
    });
  }

  /**
   * With a forward tunnel adb accepts the TCP connection before the server listens,
   * so the first socket is only usable once the server's dummy byte arrives.
   */
  private async connectVideo(): Promise<net.Socket> {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (!this.server || this.server.exitCode !== null) {
        break;
      }
      const socket = await this.connect().catch(() => undefined);
      if (socket) {
        const first = await new Promise<Buffer | undefined>(resolve => {
          socket.once('data', resolve);
          socket.once('close', () => resolve(undefined));
        });
        if (first) {
          socket.pause();
          if (first.length > 1) { socket.unshift(first.subarray(1)); }
          return socket;
        }
        socket.destroy();
      }
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error('Could not connect to the device mirror server');
  }

  private readVideo(socket: net.Socket): void {
    let buf: Buffer = Buffer.alloc(0);
    let stage = 0;
    socket.on('data', (chunk: Buffer) => {
      buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
      for (;;) {
        if (stage === 0) {
          if (buf.length < 64) { return; }
          buf = buf.subarray(64);
          stage = 1;
        }
        if (stage === 1) {
          if (buf.length < 12) { return; }
          this.size = { width: buf.readUInt32BE(4), height: buf.readUInt32BE(8) };
          this.target?.postMessage({ type: 'mirrorStarted', ...this.size });
          buf = buf.subarray(12);
          stage = 2;
        }
        if (buf.length < 12) { return; }
        const flags = buf.readBigUInt64BE(0);
        const length = buf.readUInt32BE(8);
        if (buf.length < 12 + length) { return; }
        const data = new Uint8Array(buf.subarray(12, 12 + length));
        buf = buf.subarray(12 + length);
        if (flags >> 63n) {
          this.configPacket = data;
          continue;
        }
        this.streaming = true;
        const key = !!((flags >> 62n) & 1n);
        const pts = Number(flags & 0x3fffffffffffffffn);
        let payload = data;
        if (key && this.configPacket) {
          payload = new Uint8Array(this.configPacket.length + data.length);
          payload.set(this.configPacket);
          payload.set(data, this.configPacket.length);
        }
        this.target?.postMessage({ type: 'mirrorFrame', key, pts, data: payload.buffer });
      }
    });
    socket.on('close', () => this.stop(this.stopping ? undefined : 'Device disconnected'));
    socket.on('error', () => undefined);
    socket.resume();
  }
}

function parseBitrate(value: number | string): number {
  if (typeof value === 'number') { return value; }
  const m = /^(\d+(?:\.\d+)?)\s*([kKmM]?)$/.exec(value.trim());
  if (!m) { return 8000000; }
  const mult = m[2].toLowerCase() === 'm' ? 1e6 : m[2].toLowerCase() === 'k' ? 1e3 : 1;
  return Math.round(parseFloat(m[1]) * mult);
}
