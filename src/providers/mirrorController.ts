import * as vscode from 'vscode';
import { MirrorInput, MirrorSession } from '../managers/mirrorSession';
import { BinaryManager } from '../managers/binaryManager';
import { ConfigManager } from '../managers/configManager';
import { Logger } from '../managers/logger';
import { ProcessManager } from '../managers/processManager';

const toolButton = (action: string, icon: string, title: string) =>
  `<button class="icon-button" data-mirror-action="${action}" title="${title}" aria-label="${title}"><span class="codicon codicon-${icon}"></span></button>`;

/** Markup shared by the sidebar section and the editor tab. */
export function getMirrorMarkup(inPanel: boolean): string {
  const placement = inPanel
    ? toolButton('dock', 'layout-sidebar-left', 'Move back to sidebar')
    : toolButton('popout', 'link-external', 'Open in editor tab');
  return `
    <div id="mirror" class="mirror" data-state="idle">
      <div class="mirror-toolbar">
        <span class="mirror-when-live">
          ${toolButton('back', 'arrow-left', 'Back')}
          ${toolButton('home', 'circle-large-outline', 'Home')}
          ${toolButton('recents', 'versions', 'Recent apps')}
          ${toolButton('rotate', 'refresh', 'Rotate device')}
        </span>
        <span class="mirror-toolbar-end">
          <span class="mirror-when-live">${placement}</span>
          ${toolButton('native', 'window', 'Open in native scrcpy window')}
          <span class="mirror-when-live">${toolButton('stop', 'debug-stop', 'Stop mirror')}</span>
        </span>
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

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly processManager: ProcessManager,
    private readonly binaryManager: BinaryManager,
    private readonly configManager: ConfigManager,
    private readonly logger: Logger,
  ) {
    this.session = new MirrorSession(logger, reason => {
      this.setContext(false);
      if (reason) {
        vscode.window.showWarningMessage(`DroidBridge mirror stopped: ${reason}`);
      }
      this.broadcastState();
    });
  }

  registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand('droidbridge.startMirror', () => this.start()),
      vscode.commands.registerCommand('droidbridge.stopMirror', () => this.session.stop()),
      vscode.commands.registerCommand('droidbridge.openMirrorInEditor', () => this.openPanel()),
      vscode.commands.registerCommand('droidbridge.openMirrorNative', () => this.openNative()),
      this,
    );
  }

  get running(): boolean {
    return this.session.running;
  }

  /** Called by the sidebar provider whenever its webview (re)loads or receives a mirror message. */
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

  async start(): Promise<void> {
    if (this.session.running || this.starting) {
      return;
    }
    this.starting = true;
    this.broadcastState();
    try {
      const serials = await this.processManager.getDeviceSerials();
      if (serials.length === 0) {
        throw new Error('No device connected. Connect a device first.');
      }
      const [adbPath, selection] = await Promise.all([
        this.binaryManager.getAdbPath(),
        this.processManager.getDeviceSelectionArgs(),
      ]);
      const options = this.configManager.getScrcpyOptions();
      await this.session.start({
        adbPath,
        serverPath: vscode.Uri.joinPath(this.extensionUri, 'resources', 'scrcpy-server').fsPath,
        serial: selection[1] ?? serials[0],
        maxSize: options.maxSize,
        bitrate: options.bitrate,
      });
      this.session.setTarget(this.activeTarget());
      this.setContext(true);
      this.logger.info('Embedded mirror started');
    } catch (error) {
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
    }
  }

  private async openNative(): Promise<void> {
    if (this.session.running) {
      await this.session.stop();
    }
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
    webview.postMessage({ type: 'mirrorState', state, text });
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
