import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

export class DeviceTracker implements vscode.Disposable {
  private process?: ChildProcess;
  private devices: string[] = [];
  private emulatorSerials: string[] = [];
  private disposed = false;
  private restartTimer?: NodeJS.Timeout;
  private readonly changed = new vscode.EventEmitter<string[]>();
  readonly onDidChange = this.changed.event;

  constructor(private readonly getAdbPath: () => Promise<string>) {}

  get online(): string[] {
    return this.devices;
  }

  get emulators(): string[] {
    return this.emulatorSerials;
  }

  async start(): Promise<void> {
    if (this.disposed || this.process) {
      return;
    }
    const adb = await this.getAdbPath().catch(() => 'adb');
    if (this.disposed) {
      return;
    }
    const proc = spawn(adb, ['track-devices']);
    this.process = proc;
    let buf = '';
    proc.stdout?.on('data', (d: Buffer) => {
      buf += d.toString();
      while (buf.length >= 4) {
        const len = parseInt(buf.slice(0, 4), 16);
        if (Number.isNaN(len) || buf.length < 4 + len) {
          break;
        }
        const list = buf.slice(4, 4 + len);
        this.update(parseDeviceList(list), parseEmulators(list));
        buf = buf.slice(4 + len);
      }
    });
    proc.on('error', () => undefined);
    proc.on('close', () => {
      if (this.process !== proc) {
        return;
      }
      this.process = undefined;
      this.update([], []);
      if (!this.disposed) {
        this.restartTimer = setTimeout(() => this.start(), 3000);
      }
    });
  }

  restart(): void {
    const proc = this.process;
    this.process = undefined;
    proc?.kill();
    this.start();
  }

  dispose(): void {
    this.disposed = true;
    clearTimeout(this.restartTimer);
    this.process?.kill();
    this.changed.dispose();
  }

  private update(devices: string[], emulators: string[]): void {
    if (devices.join(',') !== this.devices.join(',') || emulators.join(',') !== this.emulatorSerials.join(',')) {
      this.devices = devices;
      this.emulatorSerials = emulators;
      this.changed.fire(devices);
    }
  }
}

export function parseDeviceList(text: string): string[] {
  return text.split('\n')
    .map(l => l.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial]) => serial);
}

export function parseEmulators(text: string): string[] {
  return text.split('\n').map(l => l.trim().split(/\s+/)[0]).filter(serial => serial?.startsWith('emulator-'));
}
