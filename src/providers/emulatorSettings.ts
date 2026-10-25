import * as os from 'os';
import * as vscode from 'vscode';
import { emulatorTool, findSdk, killEmulators, listAvds, readAvdConfig, wipeAvd, writeAvdConfig } from '../mcp/avd';
import { isHeadless, launchAvd, runningAvds } from '../managers/emulator';
import { BinaryManager } from '../managers/binaryManager';

interface Values {
  cores: number;
  ram: number;
  heap: number;
  storage: number;
  gpu: string;
  boot: string;
  orientation: string;
  keyboard: boolean;
  frame: boolean;
}

const GPU_MODES = ['auto', 'host', 'swiftshader_indirect'];

function toMb(value: string | undefined, fallback: number): number {
  const m = /^(\d+(?:\.\d+)?)\s*([KMGT]?)B?$/i.exec(value ?? '');
  if (!m) {
    return fallback;
  }
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  return Math.round(unit === 'G' ? n * 1024 : unit === 'T' ? n * 1024 * 1024 : unit === 'K' ? n / 1024 : unit === 'M' ? n : n > 1024 * 1024 ? n / 1024 / 1024 : n);
}

export function readValues(config: Record<string, string>): Values {
  const mode = config['hw.gpu.mode'] ?? 'auto';
  const software = config['hw.gpu.enabled'] === 'no' || /^(swiftshader|guest|off)/.test(mode);
  return {
    cores: parseInt(config['hw.cpu.ncore'] ?? '', 10) || 2,
    ram: toMb(config['hw.ramSize'], 2048),
    heap: toMb(config['vm.heapSize'], 256),
    storage: Math.round(toMb(config['disk.dataPartition.size'], 6144) / 1024),
    gpu: software ? 'swiftshader_indirect' : mode === 'host' ? 'host' : 'auto',
    boot: config['fastboot.forceColdBoot'] === 'yes' ? 'cold' : 'quick',
    orientation: config['hw.initialOrientation'] === 'landscape' ? 'landscape' : 'portrait',
    keyboard: config['hw.keyboard'] === 'yes',
    frame: config['showDeviceFrame'] !== 'no',
  };
}

export function validate(raw: Record<string, unknown>): Values {
  const int = (key: string, label: string, min: number, max: number) => {
    const v = Number(raw[key]);
    if (!Number.isInteger(v) || v < min || v > max) {
      throw new Error(`${label} must be a whole number from ${min} to ${max}`);
    }
    return v;
  };
  const pick = (key: string, options: string[]) => {
    if (!options.includes(String(raw[key]))) {
      throw new Error(`Invalid ${key}`);
    }
    return String(raw[key]);
  };
  return {
    cores: int('cores', 'CPU cores', 1, os.cpus().length || 1),
    ram: int('ram', 'Memory', 1024, Math.floor(os.totalmem() / 1024 / 1024)),
    heap: int('heap', 'VM heap', 16, 4096),
    storage: int('storage', 'Internal storage', 2, 1024),
    gpu: pick('gpu', GPU_MODES),
    boot: pick('boot', ['quick', 'cold']),
    orientation: pick('orientation', ['portrait', 'landscape']),
    keyboard: !!raw.keyboard,
    frame: !!raw.frame,
  };
}

function toConfig(v: Values): Record<string, string> {
  return {
    'hw.cpu.ncore': String(v.cores),
    'hw.ramSize': String(v.ram),
    'vm.heapSize': String(v.heap),
    'disk.dataPartition.size': `${v.storage}G`,
    'hw.gpu.enabled': 'yes',
    'hw.gpu.mode': v.gpu,
    'fastboot.forceColdBoot': v.boot === 'cold' ? 'yes' : 'no',
    'fastboot.forceFastBoot': v.boot === 'cold' ? 'no' : 'yes',
    'hw.initialOrientation': v.orientation,
    'hw.keyboard': v.keyboard ? 'yes' : 'no',
    'showDeviceFrame': v.frame ? 'yes' : 'no',
  };
}

export class EmulatorSettingsPanel {
  private static current?: EmulatorSettingsPanel;
  private readonly panel: vscode.WebviewPanel;

  static show(extensionUri: vscode.Uri, binaryManager: BinaryManager): void {
    if (this.current) {
      this.current.panel.reveal();
      return;
    }
    this.current = new EmulatorSettingsPanel(extensionUri, binaryManager);
  }

  private constructor(private readonly extensionUri: vscode.Uri, private readonly binaryManager: BinaryManager) {
    this.panel = vscode.window.createWebviewPanel('droidbridge.emulatorSettings', 'Emulator Settings', vscode.ViewColumn.Active, {
      enableScripts: true,
      localResourceRoots: [extensionUri],
    });
    this.panel.iconPath = vscode.Uri.joinPath(extensionUri, 'media', 'icons', 'droidbridge-icon.png');
    this.panel.webview.html = this.html();
    this.panel.onDidDispose(() => { EmulatorSettingsPanel.current = undefined; });
    this.panel.webview.onDidReceiveMessage(m => this.onMessage(m).catch(error => {
      this.post({ type: 'status', error: true, text: error instanceof Error ? error.message : String(error) });
    }));
  }

  private post(message: object): void {
    this.panel.webview.postMessage(message);
  }

  private async onMessage(m: { type: string; avd?: string; values?: Record<string, unknown>; restart?: boolean; keepData?: boolean }): Promise<void> {
    const adbPath = await this.binaryManager.getAdbPath();
    if (m.type === 'ready') {
      const avds = await listAvds(emulatorTool(findSdk(adbPath)));
      this.post({ type: 'avds', avds: avds ?? [], host: { cores: os.cpus().length, ram: Math.floor(os.totalmem() / 1024 / 1024) } });
      return;
    }
    const avd = String(m.avd ?? '');
    const avds = await listAvds(emulatorTool(findSdk(adbPath))) ?? [];
    if (!avds.includes(avd)) {
      throw new Error(`Unknown emulator ${avd}`);
    }
    const serial = (await runningAvds(adbPath)).get(avd);
    switch (m.type) {
      case 'load': {
        const config = readAvdConfig(avd);
        const image = (config['image.sysdir.1'] ?? '').replace(/\/$/, '').split('/').slice(1).join(' ');
        const screen = config['hw.lcd.width'] ? `${config['hw.lcd.width']}x${config['hw.lcd.height']}, ${config['hw.lcd.density']} dpi` : '';
        this.post({ type: 'config', avd, values: readValues(config), serial, info: [image, screen].filter(Boolean).join(' | ') });
        return;
      }
      case 'save': {
        writeAvdConfig(avd, toConfig(validate(m.values ?? {})));
        if (serial && m.restart) {
          this.post({ type: 'status', text: `Saved. Restarting ${avd}...` });
          await vscode.commands.executeCommand('droidbridge.stopMirror', serial);
          await killEmulators(adbPath, [serial]);
          const started = await launchAvd(adbPath, avd);
          if (started && isHeadless()) {
            await vscode.commands.executeCommand('droidbridge.startMirror', started);
          }
          this.post({ type: 'status', text: started ? `Saved and restarted ${avd}.` : `Saved. ${avd} did not start again.` });
        } else {
          this.post({ type: 'status', text: serial ? `Saved. Restart ${avd} to apply the changes.` : 'Saved. The changes apply the next time it starts.' });
        }
        return this.onMessage({ type: 'load', avd }).then(() => undefined);
      }
      case 'wipe': {
        if (serial) {
          throw new Error(`Stop ${avd} first.`);
        }
        const what = m.keepData ? 'delete the saved Quick Boot state of' : 'erase all apps and data on';
        const ok = await vscode.window.showWarningMessage(`This will ${what} ${avd}. Continue?`, { modal: true }, m.keepData ? 'Delete Saved State' : 'Wipe Data');
        if (ok) {
          wipeAvd(avd, !!m.keepData);
          this.post({ type: 'status', text: m.keepData ? 'Saved state deleted. The next start is a cold boot.' : 'Data wiped. The next start is like a new device.' });
        }
        return;
      }
    }
  }

  private html(): string {
    const webview = this.panel.webview;
    const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const codicons = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'codicons', 'codicon.css'));
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="${codicons}" rel="stylesheet">
<title>Emulator Settings</title>
<style nonce="${nonce}">
  body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px 20px; max-width: 640px; }
  h1 { font-size: 1.4em; font-weight: 600; margin: 0 0 4px; }
  p.lead { color: var(--vscode-descriptionForeground); margin: 0 0 16px; }
  fieldset { border: 1px solid var(--vscode-widget-border, rgba(128,128,128,.35)); border-radius: 4px; padding: 12px 14px; margin: 0 0 16px; }
  legend { padding: 0 6px; font-weight: 600; }
  .row { display: grid; grid-template-columns: minmax(120px, 180px) 1fr; gap: 6px 12px; align-items: center; margin: 8px 0; }
  .row small, .hint { grid-column: 2; color: var(--vscode-descriptionForeground); font-size: 0.9em; }
  input, select { font: inherit; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, transparent); border-radius: 2px; padding: 4px 6px; width: 100%; box-sizing: border-box; }
  input[type=checkbox] { width: auto; }
  input:focus, select:focus { outline: 1px solid var(--vscode-focusBorder); outline-offset: -1px; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  button { font: inherit; border: none; border-radius: 2px; padding: 6px 14px; cursor: pointer; color: var(--vscode-button-foreground); background: var(--vscode-button-background); display: inline-flex; gap: 6px; align-items: center; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
  button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  button:disabled { opacity: .5; cursor: not-allowed; }
  #status { min-height: 1.4em; margin: 12px 0; }
  #status.error { color: var(--vscode-errorForeground); }
  #running { color: var(--vscode-charts-green, #89d185); }
  @media (max-width: 420px) { .row { grid-template-columns: 1fr; } .row small, .hint { grid-column: 1; } }
</style>
</head>
<body>
<h1>Emulator Settings</h1>
<p class="lead">Hardware for an existing emulator (AVD). Create emulators from Start Emulator or Android Studio.</p>
<div class="row"><label for="avd">Emulator</label><select id="avd"></select><small id="info"></small><small id="running"></small></div>
<form id="form">
<fieldset><legend>Performance</legend>
  <div class="row"><label for="cores">CPU cores</label><input id="cores" type="number" min="1" step="1" required><small id="cores-hint"></small></div>
  <div class="row"><label for="ram">Memory (RAM, MB)</label><input id="ram" type="number" min="1024" step="512" required><small id="ram-hint"></small></div>
  <div class="row"><label for="heap">VM heap (MB)</label><input id="heap" type="number" min="16" max="4096" step="16" required><small>Memory each app may use</small></div>
  <div class="row"><label for="storage">Internal storage (GB)</label><input id="storage" type="number" min="2" max="1024" step="1" required><small>Growing keeps your data; shrinking needs Wipe Data</small></div>
  <div class="row"><label for="gpu">Graphics</label><select id="gpu">
    <option value="auto">Automatic</option>
    <option value="host">Hardware (host GPU)</option>
    <option value="swiftshader_indirect">Software (SwiftShader)</option>
  </select><small>Try Software if the screen stays black or flickers</small></div>
</fieldset>
<fieldset><legend>Startup</legend>
  <div class="row"><label for="boot">Boot</label><select id="boot">
    <option value="quick">Quick boot (resume saved state)</option>
    <option value="cold">Cold boot every time</option>
  </select></div>
  <div class="row"><label for="orientation">Orientation</label><select id="orientation">
    <option value="portrait">Portrait</option>
    <option value="landscape">Landscape</option>
  </select></div>
  <div class="row"><span></span><label><input id="keyboard" type="checkbox"> Type with the computer keyboard in the emulator window</label></div>
  <div class="row"><span></span><label><input id="frame" type="checkbox"> Show the device frame in the emulator window</label></div>
</fieldset>
<div class="actions">
  <button type="submit" id="save"><span class="codicon codicon-save"></span>Save</button>
  <button type="button" id="restart" class="secondary" hidden><span class="codicon codicon-debug-restart"></span>Save and Restart</button>
</div>
</form>
<div id="status" role="status"></div>
<fieldset><legend>Troubleshooting</legend>
  <p class="hint">Stop the emulator first. Delete Saved State fixes a black screen or "System UI isn't responding" after switching graphics or headless mode.</p>
  <div class="actions">
    <button type="button" class="secondary" id="snapshot"><span class="codicon codicon-history"></span>Delete Saved State</button>
    <button type="button" class="secondary" id="wipe"><span class="codicon codicon-trash"></span>Wipe Data</button>
  </div>
</fieldset>
<script nonce="${nonce}">
(function () {
  const vscode = acquireVsCodeApi();
  const $ = id => document.getElementById(id);
  const fields = ['cores', 'ram', 'heap', 'storage', 'gpu', 'boot', 'orientation', 'keyboard', 'frame'];
  const status = (text, error) => { $('status').textContent = text || ''; $('status').className = error ? 'error' : ''; };
  const values = () => Object.fromEntries(fields.map(f => [f, $(f).type === 'checkbox' ? $(f).checked : $(f).type === 'number' ? Number($(f).value) : $(f).value]));
  const save = restart => {
    if (!$('form').reportValidity()) { return; }
    status('Saving...');
    vscode.postMessage({ type: 'save', avd: $('avd').value, values: values(), restart });
  };
  $('avd').addEventListener('change', () => { status(''); vscode.postMessage({ type: 'load', avd: $('avd').value }); });
  $('form').addEventListener('submit', e => { e.preventDefault(); save(false); });
  $('restart').addEventListener('click', () => save(true));
  $('snapshot').addEventListener('click', () => vscode.postMessage({ type: 'wipe', avd: $('avd').value, keepData: true }));
  $('wipe').addEventListener('click', () => vscode.postMessage({ type: 'wipe', avd: $('avd').value, keepData: false }));
  window.addEventListener('message', ({ data }) => {
    if (data.type === 'avds') {
      $('avd').replaceChildren(...data.avds.map(a => new Option(a.replace(/_/g, ' '), a)));
      $('cores').max = data.host.cores;
      $('ram').max = data.host.ram;
      $('cores-hint').textContent = 'This computer has ' + data.host.cores;
      $('ram-hint').textContent = 'This computer has ' + Math.round(data.host.ram / 1024) + ' GB';
      if (data.avds.length) {
        vscode.postMessage({ type: 'load', avd: data.avds[0] });
      } else {
        $('form').hidden = true;
        status('No emulator exists yet. Create one with Start Emulator.');
      }
    } else if (data.type === 'config') {
      for (const f of fields) {
        if ($(f).type === 'checkbox') { $(f).checked = data.values[f]; } else { $(f).value = data.values[f]; }
      }
      $('info').textContent = data.info;
      $('running').textContent = data.serial ? 'Running as ' + data.serial + '. Changes apply after a restart.' : '';
      $('restart').hidden = !data.serial;
      $('snapshot').disabled = $('wipe').disabled = !!data.serial;
    } else if (data.type === 'status') {
      status(data.text, data.error);
    }
  });
  vscode.postMessage({ type: 'ready' });
})();
</script>
</body>
</html>`;
  }
}
