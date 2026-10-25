import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

export const exec = promisify(execFile);
export const WIN = process.platform === 'win32';
export const BOOT_TIMEOUT_MS = 5 * 60000;
const SETTLE_TIMEOUT_MS = 2 * 60000;
const STUCK_TIMEOUT_MS = 90000;

export function findSdk(adbPath: string): string | undefined {
  const home = os.homedir();
  const defaultSdk = process.platform === 'darwin' ? path.join(home, 'Library', 'Android', 'sdk')
    : WIN ? path.join(process.env.LOCALAPPDATA || home, 'Android', 'Sdk')
    : path.join(home, 'Android', 'Sdk');
  const sdks = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.isAbsolute(adbPath) && fs.existsSync(adbPath) ? path.dirname(path.dirname(fs.realpathSync(adbPath))) : undefined,
    defaultSdk,
  ];
  return sdks.find(sdk => sdk && fs.existsSync(path.join(sdk, 'emulator')));
}

export async function deviceLoad(adbPath: string, serial: string): Promise<{ load: number; cores: number } | undefined> {
  const out = await exec(adbPath, ['-s', serial, 'shell', 'cat /proc/loadavg; grep -c ^processor /proc/cpuinfo'], { timeout: 10000 })
    .then(r => r.stdout.split(/\s+/), () => undefined);
  return out && { load: parseFloat(out[0]), cores: parseInt(out[5], 10) || 1 };
}

export function isBusy(l: { load: number; cores: number } | undefined): boolean {
  return !!l && l.load > l.cores * 5;
}

function sdkTool(sdk: string | undefined, dirs: string[], name: string): string {
  for (const dir of sdk ? dirs : []) {
    const candidate = path.join(sdk!, dir, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return name;
}

export function emulatorTool(sdk: string | undefined): string {
  return sdkTool(sdk, ['emulator'], WIN ? 'emulator.exe' : 'emulator');
}

export function cmdlineTool(sdk: string | undefined, name: string): string {
  const dirs = ['latest', ...(sdk && fs.existsSync(path.join(sdk, 'cmdline-tools')) ? fs.readdirSync(path.join(sdk, 'cmdline-tools')) : [])];
  return sdkTool(sdk, [...dirs.map(d => path.join('cmdline-tools', d, 'bin')), path.join('tools', 'bin')], WIN ? `${name}.bat` : name);
}

export function parseAvdList(stdout: string): string[] {
  return stdout.split(/\r?\n/).map(l => l.trim()).filter(l => /^[\w.-]+$/.test(l));
}

export async function listAvds(emulator: string): Promise<string[] | undefined> {
  try {
    return parseAvdList((await exec(emulator, ['-list-avds'], { timeout: 15000 })).stdout);
  } catch {
    return undefined;
  }
}

export function listSystemImages(sdk: string, arch = process.arch): { id: string; api: number }[] {
  const abis = arch === 'arm64' ? ['arm64-v8a'] : ['x86_64', 'x86'];
  const root = path.join(sdk, 'system-images');
  const dirs = (p: string) => (fs.existsSync(p) ? fs.readdirSync(p) : []);
  const images: { id: string; api: number }[] = [];
  for (const platform of dirs(root)) {
    const api = parseInt(platform.replace(/^android-/, ''), 10);
    for (const tag of dirs(path.join(root, platform))) {
      for (const abi of dirs(path.join(root, platform, tag)).filter(a => abis.includes(a))) {
        images.push({ id: `system-images;${platform};${tag};${abi}`, api });
      }
    }
  }
  return images.sort((a, b) => (b.api || 0) - (a.api || 0));
}

export function pickProfile(profiles: string[], tablet: boolean): string | undefined {
  const preferred = tablet ? ['medium_tablet', 'pixel_tablet', 'pixel_c'] : ['medium_phone', 'pixel_8', 'pixel_7', 'pixel_6', 'pixel'];
  return preferred.find(p => profiles.includes(p));
}

export async function emulators(adbPath: string): Promise<{ serial: string; state: string }[]> {
  const { stdout } = await exec(adbPath, ['devices']).catch(() => ({ stdout: '' }));
  return stdout.split(/\r?\n/).map(l => l.trim().split(/\s+/))
    .filter(([serial, state]) => serial?.startsWith('emulator-') && state)
    .map(([serial, state]) => ({ serial, state }));
}

type BootState = 'booting' | 'ready' | 'broken';

async function bootState(adbPath: string, serial: string): Promise<BootState> {
  const out = await exec(adbPath, ['-s', serial, 'shell', 'getprop sys.boot_completed; service check accessibility'], { timeout: 5000 })
    .then(r => r.stdout, () => '');
  if (!out.startsWith('1')) {
    return 'booting';
  }
  return /accessibility: found/.test(out) ? 'ready' : 'broken';
}

class BrokenBoot extends Error {
  constructor(readonly serial: string) { super(`${serial} booted without its system services`); }
}

export async function waitForBoot(
  adbPath: string, find: () => Promise<string | undefined>, timeoutMs: number, cancelled: () => boolean, check?: () => void,
): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs;
  let serial: string | undefined;
  let brokenSince = 0;
  while (!cancelled() && Date.now() < deadline) {
    check?.();
    serial ??= await find();
    const state = serial ? await bootState(adbPath, serial) : 'booting';
    if (state === 'ready') {
      return serial;
    }
    brokenSince = state === 'broken' ? brokenSince || Date.now() : 0;
    if (brokenSince && Date.now() - brokenSince > 30000) {
      throw new BrokenBoot(serial!);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return undefined;
}

export function avdName(adbPath: string, serial: string): Promise<string> {
  return exec(adbPath, ['-s', serial, 'emu', 'avd', 'name'], { timeout: 5000 }).then(r => r.stdout.split(/\r?\n/)[0].trim(), () => '');
}

export async function pendingEmulators(adbPath: string): Promise<string[]> {
  await exec(adbPath, ['reconnect', 'offline'], { timeout: 10000 }).catch(() => undefined);
  const pending: string[] = [];
  for (const e of await emulators(adbPath)) {
    if (e.state !== 'device' || await bootState(adbPath, e.serial) !== 'ready') {
      pending.push(e.serial);
    }
  }
  return pending;
}

export async function recoverPending(adbPath: string, pending: string[], cancelled: () => boolean, report?: (message: string) => void): Promise<string | undefined> {
  const find = async () => pending[0];
  let serial = await waitForBoot(adbPath, find, STUCK_TIMEOUT_MS, cancelled).catch(() => undefined);
  if (!serial && !cancelled() && (await emulators(adbPath)).some(e => e.serial === pending[0] && e.state === 'device')) {
    serial = await waitForBoot(adbPath, find, BOOT_TIMEOUT_MS, cancelled).catch(() => undefined);
  }
  if (serial || cancelled()) {
    return serial;
  }
  report?.('It is not responding, restarting it...');
  await killEmulators(adbPath, pending);
  return undefined;
}

export async function killEmulators(adbPath: string, serials: string[]): Promise<void> {
  await Promise.all(serials.map(s => exec(adbPath, ['-s', s, 'emu', 'kill'], { timeout: 10000 }).catch(() => undefined)));
  for (let i = 0; i < 15 && (await emulators(adbPath)).some(e => serials.includes(e.serial)); i++) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

export interface BootOptions {
  headless: boolean;
  cancelled?: () => boolean;
  report?: (message: string) => void;
  cold?: boolean;
}

export async function bootAvd(adbPath: string, emulator: string, avd: string, options: BootOptions): Promise<string | undefined> {
  const { headless, cold, cancelled = () => false, report } = options;
  const before = new Set((await emulators(adbPath)).map(e => e.serial));
  // A headless emulator often renders in software; its snapshot would break the next windowed boot and the reverse.
  const args = ['-avd', avd, ...(headless ? ['-no-window', '-no-snapshot'] : cold ? ['-no-snapshot-load'] : [])];
  const proc = spawn(emulator, args, { detached: true, stdio: 'ignore' });
  let exited: string | undefined;
  proc.on('error', e => { exited = e.message; });
  proc.on('exit', code => { if (code) { exited = `exit code ${code}`; } });
  proc.unref();
  report?.('Waiting for Android to boot...');
  let found: string | undefined;
  const find = async () => {
    for (const e of await emulators(adbPath)) {
      if (!before.has(e.serial) && await avdName(adbPath, e.serial) === avd) {
        return (found = e.serial);
      }
    }
    return undefined;
  };
  let serial: string | undefined;
  try {
    serial = await waitForBoot(
      adbPath,
      find,
      BOOT_TIMEOUT_MS,
      cancelled,
      () => {
        if (exited) {
          throw new Error(`The emulator stopped (${exited}). If ${avd} is already open in another window, close it and try again.`);
        }
      },
    );
  } catch (error) {
    if (!(error instanceof BrokenBoot)) {
      throw error;
    }
    if (cold) {
      throw new Error(`${avd} starts without its system services. Wipe its data in Android Studio Device Manager.`);
    }
    report?.('The saved state is broken, starting fresh...');
    await killEmulators(adbPath, [error.serial]);
    return bootAvd(adbPath, emulator, avd, { ...options, cold: true });
  }
  if (!serial) {
    if (found) {
      await killEmulators(adbPath, [found]);
    } else {
      try { process.kill(WIN ? proc.pid! : -proc.pid!); } catch { return undefined; }
    }
    if (!cancelled()) {
      throw new Error(`${avd} did not finish booting within 5 minutes.`);
    }
    return undefined;
  }
  await settle(adbPath, serial, cancelled, report);
  return serial;
}

async function settle(adbPath: string, serial: string, cancelled: () => boolean, report?: (message: string) => void): Promise<void> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  while (!cancelled() && Date.now() < deadline) {
    const load = await deviceLoad(adbPath, serial);
    if (!isBusy(load)) {
      return;
    }
    report?.(`Android is busy after starting (load ${load!.load.toFixed(1)} on ${load!.cores} cores)...`);
    await new Promise(r => setTimeout(r, 3000));
  }
}

export function avdHome(): string {
  const env = process.env;
  return env.ANDROID_AVD_HOME
    || (env.ANDROID_EMULATOR_HOME && path.join(env.ANDROID_EMULATOR_HOME, 'avd'))
    || (env.ANDROID_USER_HOME && path.join(env.ANDROID_USER_HOME, 'avd'))
    || path.join(os.homedir(), '.android', 'avd');
}

export function avdDir(avd: string): string {
  const home = avdHome();
  const ini = path.join(home, `${avd}.ini`);
  const linked = fs.existsSync(ini) ? /^path=(.+)$/m.exec(fs.readFileSync(ini, 'utf8'))?.[1].trim() : undefined;
  return linked && fs.existsSync(linked) ? linked : path.join(home, `${avd}.avd`);
}

export function readAvdConfig(avd: string): Record<string, string> {
  const config: Record<string, string> = {};
  for (const line of fs.readFileSync(path.join(avdDir(avd), 'config.ini'), 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      config[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }
  return config;
}

export function writeAvdConfig(avd: string, changes: Record<string, string>): void {
  const file = path.join(avdDir(avd), 'config.ini');
  const pending = new Map(Object.entries(changes));
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(line => {
    const key = line.slice(0, line.indexOf('=')).trim();
    if (line.includes('=') && pending.has(key)) {
      const value = pending.get(key);
      pending.delete(key);
      return `${key}=${value}`;
    }
    return line;
  });
  while (lines.length && !lines[lines.length - 1]) {
    lines.pop();
  }
  fs.writeFileSync(file, [...lines, ...[...pending].map(([k, v]) => `${k}=${v}`), ''].join('\n'));
}

export function wipeAvd(avd: string, keepData: boolean): void {
  const dir = avdDir(avd);
  const targets = keepData ? ['snapshots'] : ['snapshots', 'userdata-qemu.img', 'userdata-qemu.img.qcow2', 'cache.img', 'cache.img.qcow2', 'encryptionkey.img', 'encryptionkey.img.qcow2'];
  for (const name of targets) {
    fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  }
}
