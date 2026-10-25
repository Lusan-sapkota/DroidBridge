import { execFile } from 'child_process';
import * as os from 'os';
import * as vscode from 'vscode';
import { startRecording, stopRecording } from '../mcp/android';
import { isCancelled, MirrorInput, MirrorSession } from '../managers/mirrorSession';
import { BinaryManager } from '../managers/binaryManager';
import { startEmulator } from '../managers/emulator';
import { ConfigManager } from '../managers/configManager';
import { Logger } from '../managers/logger';
import { ProcessManager } from '../managers/processManager';

const toolButton = (action: string, icon: string, title: string, badge = '') =>
  `<button class="icon-button" data-mirror-action="${action}" title="${title}" aria-label="${title}"><span class="codicon codicon-${icon}"></span>${badge && `<span class="icon-badge" aria-hidden="true">${badge}</span>`}</button>`;

export function mirrorActions(placement: string, icon: string, title: string): string {
  return `
    <span class="mirror-when-live">${toolButton(placement, icon, title)}</span>
    ${toolButton('native', 'window', 'Open in native scrcpy window')}
    <span class="mirror-when-live">${toolButton('stop', 'debug-stop', 'Stop mirror')}</span>`;
}

export function getMirrorMarkup(inPanel: boolean): string {
  return `
    <div id="mirror" class="mirror" data-state="idle">
      <div class="mirror-toolbar">
        <span class="mirror-when-live mirror-tools">
          <span class="mirror-group">
            ${toolButton('back', 'arrow-left', 'Back')}
            ${toolButton('home', 'circle-large-outline', 'Home')}
            ${toolButton('recents', 'versions', 'Recent apps')}
          </span>
          <span class="mirror-group">
            ${toolButton('rotate', 'refresh', 'Rotate device')}
            ${toolButton('volumeDown', 'unmute', 'Volume down', '-')}
            ${toolButton('volumeUp', 'unmute', 'Volume up', '+')}
            ${toolButton('power', 'lock', 'Power: lock or wake the device')}
          </span>
          <span class="mirror-group">
            ${toolButton('notifications', 'bell', 'Open notifications')}
            ${toolButton('paste', 'clippy', 'Paste the computer clipboard on the device (Ctrl+V)')}
            ${toolButton('screenshot', 'device-camera', 'Save a screenshot')}
            ${toolButton('record', 'record', 'Record the screen')}
          </span>
        </span>
        ${inPanel ? `<span class="mirror-toolbar-end">${mirrorActions('dock', 'layout-sidebar-left', 'Move back to sidebar')}</span>` : ''}
      </div>
      <div class="mirror-stage">
        <canvas id="mirror-canvas" tabindex="0" aria-label="Device screen. Click to tap, drag to swipe, right click for back."></canvas>
        <div class="mirror-placeholder">
          <span class="codicon codicon-device-mobile"></span>
          <p id="mirror-message"></p>
          <button class="primary-button mirror-when-idle" data-mirror-action="start">
            <span class="codicon codicon-play"></span> Start Mirror
          </button>
          <button class="secondary-button mirror-when-elsewhere" data-mirror-action="dock">
            <span class="codicon codicon-layout-sidebar-left"></span> Show Here
          </button>
        </div>
      </div>
    </div>`;
}

export class MirrorController implements vscode.Disposable {
  private readonly session: MirrorSession;
  private sidebar?: vscode.Webview;
  private panel?: vscode.WebviewPanel;
  private starting = false;
  private startPromise?: Promise<void>;
  private serial?: string;
  private recording?: { adbPath: string; serial: string };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly processManager: ProcessManager,
    private readonly binaryManager: BinaryManager,
    private readonly configManager: ConfigManager,
    private readonly logger: Logger,
  ) {
    this.session = new MirrorSession(logger, reason => {
      this.setContext(false);
      if (this.recording) {
        this.toggleRecording();
      }
      if (reason) {
        vscode.window.showWarningMessage(`DroidBridge mirror stopped: ${reason}`);
      }
      this.broadcastState();
    });
  }

  registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand('droidbridge.startMirror', (serial?: unknown) => this.start(typeof serial === 'string' ? serial : undefined)),
      vscode.commands.registerCommand('droidbridge.stopMirror', (serial?: unknown) => {
        if (typeof serial !== 'string' || serial === this.serial) {
          return this.session.stop();
        }
      }),
      vscode.commands.registerCommand('droidbridge.mirrorScreenshot', () => this.screenshot()),
      vscode.commands.registerCommand('droidbridge.mirrorRecord', () => this.toggleRecording()),
      vscode.commands.registerCommand('droidbridge.openMirrorInEditor', () => this.openPanel()),
      vscode.commands.registerCommand('droidbridge.openMirrorNative', () => this.openNative()),
      this,
    );
  }

  get running(): boolean {
    return this.session.running;
  }

  attachSidebar(webview: vscode.Webview | undefined): void {
    this.sidebar = webview;
    if (!this.panel) {
      this.session.setTarget(webview);
    }
  }

  handleMessage(message: { type: string; action?: string; input?: MirrorInput; width?: number; height?: number }, from: vscode.Webview): boolean {
    switch (message.type) {
      case 'mirrorReady':
        if (from === this.sidebar || from === this.panel?.webview) {
          this.sendState(from);
          if (this.activeTarget() === from) {
            this.session.resync();
          }
        }
        return true;
      case 'mirrorDecoded':
        this.logger.debug(`Mirror decoding ${message.width}x${message.height}`);
        return true;
      case 'mirrorResync':
        this.session.resync();
        return true;
      case 'mirrorInput':
        if (message.input) {
          this.session.sendInput(message.input);
        }
        return true;
      case 'mirrorAction':
        this.runAction(message.action);
        return true;
    }
    return false;
  }

  async start(serial?: string): Promise<void> {
    if (serial && serial !== this.serial) {
      await this.startPromise;
      await this.session.stop();
    }
    if (!this.startPromise && !this.session.running) {
      this.startPromise = this.doStart(serial).finally(() => { this.startPromise = undefined; });
    }
    return this.startPromise;
  }

  private async doStart(requested?: string): Promise<void> {
    this.starting = true;
    this.broadcastState();
    try {
      const adbPath = await this.binaryManager.getAdbPath();
      const serials = await this.processManager.getDeviceSerials();
      let serial = requested;
      if (!serial && serials.length === 0) {
        serial = await startEmulator(adbPath);
      } else if (!serial && await this.processManager.chooseDevice()) {
        serial = (await this.processManager.getDeviceSelectionArgs())[1] ?? serials[0];
      }
      if (!serial) {
        return;
      }
      const options = this.configManager.getScrcpyOptions();
      await this.session.start({
        adbPath,
        serverPath: vscode.Uri.joinPath(this.extensionUri, 'resources', 'scrcpy-server').fsPath,
        serial,
        maxSize: options.maxSize,
        bitrate: options.bitrate,
      });
      this.session.setTarget(this.activeTarget());
      this.serial = serial;
      this.setContext(true);
      this.logger.info('Embedded mirror started');
    } catch (error) {
      if (isCancelled(error)) {
        return;
      }
      const text = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to start embedded mirror', error instanceof Error ? error : undefined);
      vscode.window.showErrorMessage(`DroidBridge mirror: ${text}`);
    } finally {
      this.starting = false;
      this.broadcastState();
    }
  }

  openPanel(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel('droidbridge.mirror', 'Device Mirror', vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.extensionUri],
    });
    panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'icons', 'droidbridge-icon.png');
    panel.webview.html = this.panelHtml(panel.webview);
    panel.webview.onDidReceiveMessage(m => this.handleMessage(m, panel.webview));
    panel.onDidDispose(() => {
      this.panel = undefined;
      this.session.setTarget(this.sidebar);
      this.broadcastState();
    });
    this.panel = panel;
    this.session.setTarget(panel.webview);
    this.broadcastState();
    if (!this.session.running) {
      this.start();
    }
  }

  dispose(): void {
    this.panel?.dispose();
    this.session.stop();
  }

  private runAction(action?: string): void {
    switch (action) {
      case 'start': this.start(); break;
      case 'stop': this.session.stop(); break;
      case 'popout': this.openPanel(); break;
      case 'dock': this.panel?.dispose(); break;
      case 'native': this.openNative(); break;
      case 'screenshot': this.screenshot(); break;
      case 'record': this.toggleRecording(); break;
      case 'paste': this.paste(); break;
    }
  }

  private async paste(): Promise<void> {
    const text = await vscode.env.clipboard.readText();
    if (text) {
      this.session.sendInput({ kind: 'paste', text });
    }
  }

  private async target(): Promise<{ adbPath: string; serial: string } | undefined> {
    const adbPath = await this.binaryManager.getAdbPath();
    const serial = this.session.running ? this.serial : (await this.processManager.getDeviceSerials())[0];
    if (!serial) {
      vscode.window.showWarningMessage('Connect a device or start the mirror first.');
    }
    return serial ? { adbPath, serial } : undefined;
  }

  private async saveUri(serial: string, ext: string, filter: string): Promise<vscode.Uri | undefined> {
    const stamp = new Date().toISOString().replace(/\..*/, '').replace(/[-:]/g, '').replace('T', '-');
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(os.homedir());
    return vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.joinPath(folder, `${serial.replace(/[^\w.-]/g, '_')}-${stamp}.${ext}`),
      filters: { [filter]: [ext] },
    });
  }

  private async screenshot(): Promise<void> {
    const t = await this.target();
    if (!t) {
      return;
    }
    try {
      const png = await new Promise<Buffer>((resolve, reject) => execFile(t.adbPath, ['-s', t.serial, 'exec-out', 'screencap', '-p'],
        { encoding: 'buffer', maxBuffer: 128 * 1024 * 1024, timeout: 30000 }, (e, out, err) => (e ? reject(new Error(err.toString().trim() || e.message)) : resolve(out))));
      if (png.subarray(1, 4).toString() !== 'PNG') {
        throw new Error('The device did not return an image');
      }
      const uri = await this.saveUri(t.serial, 'png', 'PNG image');
      if (uri) {
        await vscode.workspace.fs.writeFile(uri, png);
        this.offerOpen(uri, 'Screenshot saved');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`DroidBridge screenshot: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async toggleRecording(): Promise<void> {
    const t = this.recording ?? await this.target();
    if (!t) {
      return;
    }
    try {
      if (!this.recording) {
        await startRecording(t.adbPath, t.serial);
        this.recording = t;
        this.broadcastState();
        return;
      }
      this.recording = undefined;
      this.broadcastState();
      const tmp = vscode.Uri.joinPath(vscode.Uri.file(os.tmpdir()), `droidbridge-${Date.now()}.mp4`);
      await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Saving the screen recording' },
        () => stopRecording(t.adbPath, t.serial, tmp.fsPath));
      const uri = await this.saveUri(t.serial, 'mp4', 'MP4 video');
      if (uri) {
        await vscode.workspace.fs.copy(tmp, uri, { overwrite: true });
        this.offerOpen(uri, 'Recording saved');
      }
      await vscode.workspace.fs.delete(tmp).then(undefined, () => undefined);
    } catch (error) {
      this.recording = undefined;
      this.broadcastState();
      vscode.window.showErrorMessage(`DroidBridge recording: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async offerOpen(uri: vscode.Uri, message: string): Promise<void> {
    const choice = await vscode.window.showInformationMessage(`${message}: ${uri.fsPath}`, 'Open', 'Reveal');
    if (choice === 'Open') {
      vscode.commands.executeCommand('vscode.open', uri);
    } else if (choice === 'Reveal') {
      vscode.commands.executeCommand('revealFileInOS', uri);
    }
  }

  private async openNative(): Promise<void> {
    await this.startPromise;
    await this.session.stop();
    this.panel?.dispose();
    await vscode.commands.executeCommand('droidbridge.launchScrcpy');
  }

  private activeTarget(): vscode.Webview | undefined {
    return this.panel?.webview ?? this.sidebar;
  }

  private sendState(webview: vscode.Webview): void {
    let state = 'idle';
    let text = 'Mirror your device here. Click to tap, drag to swipe, scroll to scroll, type to send keys.';
    if (this.starting) {
      state = 'starting';
      text = 'Starting mirror...';
    } else if (this.panel && webview === this.sidebar) {
      state = 'elsewhere';
      text = 'The mirror is open in an editor tab.';
    } else if (this.session.running) {
      state = 'running';
      text = '';
    }
    webview.postMessage({ type: 'mirrorState', state, text, recording: !!this.recording });
  }

  private broadcastState(): void {
    for (const webview of [this.sidebar, this.panel?.webview]) {
      if (webview) {
        this.sendState(webview);
      }
    }
  }

  private setContext(running: boolean): void {
    vscode.commands.executeCommand('setContext', 'droidbridge.mirrorRunning', running);
  }

  private panelHtml(webview: vscode.Webview): string {
    const uri = (...p: string[]) => webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', ...p));
    const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${uri('codicons', 'codicon.css')}" rel="stylesheet">
        <link href="${uri('reset.css')}" rel="stylesheet">
        <link href="${uri('vscode.css')}" rel="stylesheet">
        <link href="${uri('main.css')}" rel="stylesheet">
        <title>Device Mirror</title>
      </head>
      <body class="mirror-panel">
        ${getMirrorMarkup(true)}
        <script nonce="${nonce}" src="${uri('mirror.js')}"></script>
      </body>
      </html>`;
  }
}
