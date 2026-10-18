import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

/**
 * Follows `adb track-devices`, which pushes the device list whenever it changes,
 * so the UI knows about USB devices and emulators without polling.
 */
export class DeviceTracker implements vscode.Disposable {
  private process?: ChildProcess;
  private devices: string[] = [];
  private disposed = false;
  private restartTimer?: NodeJS.Timeout;
  private readonly changed = new vscode.EventEmitter<string[]>();
  readonly onDidChange = this.changed.event;

  constructor(private readonly getAdbPath: () => Promise<string>) {}

  get online(): string[] {
    return this.devices;
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
      // Each update is a 4 hex digit length followed by "serial\tstate" lines.
      while (buf.length >= 4) {
        const len = parseInt(buf.slice(0, 4), 16);
        if (Number.isNaN(len) || buf.length < 4 + len) {
          break;
        }
        this.update(parseDeviceList(buf.slice(4, 4 + len)));
        buf = buf.slice(4 + len);
      }
    });
    proc.on('error', () => undefined);
    proc.on('close', () => {
      if (this.process !== proc) {
        return;
      }
      this.process = undefined;
      this.update([]);
      if (!this.disposed) {
        // adb server restarted or is not installed yet; try again shortly.
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

  private update(devices: string[]): void {
    if (devices.join(',') !== this.devices.join(',')) {
      this.devices = devices;
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
