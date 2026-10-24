import * as vscode from 'vscode';
import {
  bootAvd, cmdlineTool, emulators, emulatorTool, exec, findSdk, killEmulators, listAvds,
  listSystemImages, pendingEmulators, pickProfile, recoverPending, WIN,
} from '../mcp/avd';

const headlessStarted = new Map<string, string>();
const CREATE_ITEM = '$(add) Create new emulator...';
const DOWNLOAD_API = 35;

async function adoptPending(adbPath: string): Promise<string | 'none' | undefined> {
  const pending = await pendingEmulators(adbPath);
  if (pending.length === 0) {
    return 'none';
  }
  return vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Waiting for ${pending[0]} to finish starting`, cancellable: true },
    async (progress, token) => {
      const cancelled = () => token.isCancellationRequested;
      const serial = await recoverPending(adbPath, pending, cancelled, message => progress.report({ message }));
      return serial ?? (cancelled() ? undefined : 'none');
    },
  );
}

async function createAvd(sdk: string | undefined, existing: string[]): Promise<string | undefined> {
  const images = sdk ? listSystemImages(sdk) : [];
  if (images.length === 0) {
    const pkg = `system-images;android-${DOWNLOAD_API};google_apis;${process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64'}`;
    const choice = await vscode.window.showWarningMessage(
      'No Android system image is installed. Download one with sdkmanager (about 1.5 GB)? Run Start Emulator again when it finishes.',
      'Download in Terminal',
    );
    if (choice) {
      vscode.window.createTerminal({ name: 'Android SDK', shellPath: cmdlineTool(sdk, 'sdkmanager'), shellArgs: [pkg] }).show();
    }
    return undefined;
  }
  const image = await vscode.window.showQuickPick(
    images.map(i => ({ label: `API ${i.api}`, description: i.id.split(';').slice(2).join(' '), id: i.id, api: i.api })),
    { placeHolder: 'Choose a system image for the new emulator' },
  );
  if (!image) {
    return undefined;
  }
  const form = await vscode.window.showQuickPick(['Phone', 'Tablet'], { placeHolder: 'Choose the device type' });
  if (!form) {
    return undefined;
  }
  let name = `DroidBridge_${form}_API_${image.api}`;
  for (let n = 2; existing.includes(name); n++) {
    name = `DroidBridge_${form}_API_${image.api}_${n}`;
  }
  const chosen = await vscode.window.showInputBox({
    prompt: 'Emulator name',
    value: name,
    validateInput: v => (!/^[\w.-]+$/.test(v) ? 'Use letters, digits, dot, dash or underscore' : existing.includes(v) ? 'An emulator with this name exists' : undefined),
  });
  if (!chosen) {
    return undefined;
  }

  const avdmanager = cmdlineTool(sdk, 'avdmanager');
  const run = (args: string[]) => exec(WIN ? `"${avdmanager}"` : avdmanager, WIN ? args.map(a => `"${a}"`) : args, { shell: WIN, timeout: 120000 });
  return vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Creating emulator ${chosen}` }, async () => {
    try {
      const profiles = (await run(['list', 'device', '-c'])).stdout.split(/\r?\n/).map(l => l.trim());
      const profile = pickProfile(profiles, form === 'Tablet');
      const create = run(['create', 'avd', '-n', chosen, '-k', image.id, ...(profile ? ['-d', profile] : [])]);
      create.child.stdin?.end('no\n');
      await create;
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      if (/ENOENT|not recognized|not found/i.test(text) && !/JAVA/i.test(text)) {
        throw new Error('avdmanager was not found. Install Android SDK Command-line Tools from the Android Studio SDK Manager.');
      }
      throw new Error(`avdmanager failed: ${text.split('\n').find(l => /error|java/i.test(l))?.trim() ?? text}`);
    }
    return chosen;
  });
}

export async function startEmulator(adbPath: string): Promise<string | undefined> {
  const adopted = await adoptPending(adbPath);
  if (adopted !== 'none') {
    return adopted;
  }

  const sdk = findSdk(adbPath);
  const emulator = emulatorTool(sdk);
  const avds = await listAvds(emulator);
  if (!avds) {
    vscode.window.showErrorMessage('The Android Emulator was not found. Install it from the Android Studio SDK Manager and set ANDROID_HOME, or connect a device.');
    return undefined;
  }
  const picked = await vscode.window.showQuickPick([...avds, CREATE_ITEM], {
    placeHolder: avds.length ? 'Choose an emulator to start' : 'No emulator exists yet',
  });
  const avd = picked === CREATE_ITEM ? await createAvd(sdk, avds) : picked;
  if (!avd) {
    return undefined;
  }

  const headless = isHeadless();
  const serial = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Starting emulator ${avd}`, cancellable: true },
    (progress, token) => bootAvd(adbPath, emulator, avd, {
      headless,
      cancelled: () => token.isCancellationRequested,
      report: message => progress.report({ message }),
    }),
  );
  if (serial && headless) {
    headlessStarted.set(serial, adbPath);
  }
  return serial;
}

export function isHeadless(): boolean {
  return vscode.workspace.getConfiguration('droidbridge').get<boolean>('emulator.headless', true);
}

export async function stopEmulator(adbPath: string): Promise<void> {
  const running = (await emulators(adbPath)).map(e => e.serial);
  if (running.length === 0) {
    vscode.window.showInformationMessage('No emulator is running.');
    return;
  }
  const serial = running.length === 1 ? running[0] : await vscode.window.showQuickPick(running, { placeHolder: 'Choose the emulator to stop' });
  if (serial) {
    await killEmulators(adbPath, [serial]);
    headlessStarted.delete(serial);
  }
}

export async function stopHeadlessEmulators(): Promise<void> {
  await Promise.all([...headlessStarted].map(([serial, adbPath]) => killEmulators(adbPath, [serial])));
  headlessStarted.clear();
}
