import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

export const exec = promisify(execFile);
export const WIN = process.platform === 'win32';
export const BOOT_TIMEOUT_MS = 5 * 60000;
const SETTLE_TIMEOUT_MS = 2 * 60000;

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
  return !!l && l.load > l.cores * 2;
}

/** Falls back to the bare name so PATH is searched. */
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
  // The emulator can print INFO or WARNING lines before the names.
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

// A restored Quick Boot snapshot can report booted while system services are missing.
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

export async function pendingEmulators(adbPath: string): Promise<string[]> {
  await exec(adbPath, ['reconnect', 'offline'], { timeout: 10000 }).catch(() => undefined);
  return (await emulators(adbPath)).filter(e => e.state !== 'device').map(e => e.serial);
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

// Detached so the emulator outlives VS Code; a broken snapshot gets one cold boot retry.
export async function bootAvd(adbPath: string, emulator: string, avd: string, options: BootOptions): Promise<string | undefined> {
  const { headless, cold, cancelled = () => false, report } = options;
  const before = new Set((await emulators(adbPath)).map(e => e.serial));
  const args = ['-avd', avd, ...(headless ? ['-no-window'] : []), ...(cold ? ['-no-snapshot-load'] : [])];
  const proc = spawn(emulator, args, { detached: true, stdio: 'ignore' });
  let exited: string | undefined;
  proc.on('error', e => { exited = e.message; });
  proc.on('exit', code => { if (code) { exited = `exit code ${code}`; } });
  proc.unref();
  report?.('Waiting for Android to boot...');
  let serial: string | undefined;
  try {
    serial = await waitForBoot(
      adbPath,
      async () => (await emulators(adbPath)).find(e => !before.has(e.serial))?.serial,
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
  if (!serial && !cancelled()) {
    throw new Error(`${avd} did not finish booting within 5 minutes.`);
  }
  if (serial) {
    await settle(adbPath, serial, cancelled, report);
  }
  return serial;
}

// Right after boot, Play services updates can starve the UI for a minute or two.
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
