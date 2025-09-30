import * as vscode from 'vscode';
import { ConfigManager } from '../managers/configManager';
import { ThemeManager, ThemeKind } from '../utils/themeManager';
import { ConnectionHistoryManager, ConnectionHistoryEntry } from '../managers/connectionHistory';

interface ScrcpySidebarState {
  isRunning: boolean;
  processId?: number;
  windowId?: string;
}

/**
 * Provides the webview content for the DroidBridge sidebar view
 */
export class DroidBridgeSidebarProvider implements vscode.WebviewViewProvider {
  // Must match the view id in package.json (contributes.views["droidbridge"][0].id)
  public static readonly viewType = 'droidbridge-sidebar';

  private _view?: vscode.WebviewView;
  private connectionStatus: boolean = false;
  private scrcpyStatus: boolean = false;
  private currentIp: string = '';
  private currentPort: string = '';
  private configManager: ConfigManager;
  private configChangeListener?: vscode.Disposable;
  private themeManager: ThemeManager;
  private themeChangeListener?: vscode.Disposable;
  private connectionHistory: ConnectionHistoryManager;
  private scrcpySidebarState: ScrcpySidebarState = { isRunning: false };

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    configManager: ConfigManager
  ) {
    this.configManager = configManager;
    this.themeManager = ThemeManager.getInstance();
    this.connectionHistory = new ConnectionHistoryManager(_context);
    
    // Load default values from configuration
    this.loadDefaultValues();
    
    // Listen for configuration changes
    this.setupConfigurationWatcher();
    
    // Listen for theme changes
    this.setupThemeChangeListener();
  }

  /**
   * Load default IP and port values from configuration
   */
  private loadDefaultValues(): void {
    const config = this.configManager.getConfigWithDefaults();
    this.currentIp = config.ip;
    this.currentPort = config.port;
  }

  /**
   * Set up configuration change watcher to update defaults
   */
  private setupConfigurationWatcher(): void {
    this.configChangeListener = this.configManager.onConfigurationChanged(() => {
      this.loadDefaultValues();
      this._updateWebviewState();
    });
    
    // Add to context subscriptions for proper cleanup
    this._context.subscriptions.push(this.configChangeListener);
  }

  /**
   * Set up theme change listener to refresh webview on theme changes
   * Implements requirements 10.3: Theme change listeners and UI updates
   */
  private setupThemeChangeListener(): void {
    this.themeChangeListener = this.themeManager.onThemeChanged((theme: ThemeKind) => {
      // Refresh the webview when theme changes to update icons and styling
      if (this._view) {
        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        
        // Also notify the webview about the theme change
        this._view.webview.postMessage({
          type: 'themeChanged',
          theme: theme,
          isDark: this.themeManager.isDarkTheme(),
          isLight: this.themeManager.isLightTheme(),
          themeCssClass: this.themeManager.getThemeCssClass()
        });
      }
    });
    
    // Add to context subscriptions for proper cleanup
    this._context.subscriptions.push(this.themeChangeListener);
  }

  /**
   * Resolves the webview view and sets up the content
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    console.log('DroidBridge: Resolving webview view');
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    try {
      webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
      console.log('DroidBridge: Webview HTML set successfully');
    } catch (error) {
      console.error('DroidBridge: Error setting webview HTML:', error);
      // Fallback to simple HTML
      webviewView.webview.html = this._getSimpleHtmlForWebview(webviewView.webview);
    }

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.type) {
          case 'connectDevice':
            vscode.commands.executeCommand('droidbridge.connectDevice', message.ip, message.port);
            break;
          case 'disconnectDevice':
            vscode.commands.executeCommand('droidbridge.disconnectDevice');
            break;
          case 'launchScrcpy':
            vscode.commands.executeCommand('droidbridge.launchScrcpy');
            break;
          case 'launchScrcpyScreenOff':
            vscode.commands.executeCommand('droidbridge.launchScrcpyScreenOff');
            break;
          case 'stopScrcpy':
            vscode.commands.executeCommand('droidbridge.stopScrcpy');
            break;
          case 'showLogs':
            vscode.commands.executeCommand('droidbridge.showLogs');
            break;
          case 'ipChanged':
            this.currentIp = message.value;
            break;
          case 'portChanged':
            this.currentPort = message.value;
            break;
          case 'connectFromHistory':
            vscode.commands.executeCommand('droidbridge.connectDevice', message.ip, message.port);
            break;
          case 'removeFromHistory':
            this.connectionHistory.removeConnection(message.id);
            this._updateWebviewState();
            break;
          case 'clearHistory':
            this.connectionHistory.clearHistory();
            this._updateWebviewState();
            break;
          case 'pairManual':
            if (message.host && message.port && message.code) {
              const hostPort = `${message.host}:${message.port}`;
              vscode.commands.executeCommand('droidbridge.pairDevice', hostPort, message.code);
            }
            break;
          case 'ejectScrcpySidebar':
            vscode.commands.executeCommand('droidbridge.ejectScrcpySidebar');
            break;
          case 'embedScrcpySidebar':
            vscode.commands.executeCommand('droidbridge.embedScrcpySidebar');
            break;
        }
      },
      undefined,
      this._context.subscriptions
    );
  }

  /**
   * Generate the HTML content for the webview
   * Implements requirements 10.4: Theme-specific icon usage
   */
  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

    // Get theme-specific icons (with fallback)
    let plugIconUri, deviceIconUri;
    try {
      plugIconUri = this.themeManager.getWebviewIconUri('plug', this._extensionUri, webview);
      deviceIconUri = this.themeManager.getWebviewIconUri('device-mobile', this._extensionUri, webview);
    } catch (error) {
      console.error('DroidBridge: Error getting theme icons:', error);
      // Fallback to simple data URIs or codicons
      plugIconUri = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMkM2LjkgMiA2IDIuOSA2IDRWNkg0VjhIMTJWNkgxMFY0QzEwIDIuOSA5LjEgMiA4IDJaTTggNEM4LjYgNCA5IDQuNCA5IDVWNkg3VjVDNyA0LjQgNy40IDQgOCA0WiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPgo=';
      deviceIconUri = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMkMzLjQ0NzcyIDIgMyAyLjQ0NzcyIDMgM1YxM0MzIDEzLjU1MjMgMy40NDc3MiAxNCA0IDE0SDEyQzEyLjU1MjMgMTQgMTMgMTMuNTUyMyAxMyAxM1YzQzEzIDIuNDQ3NzIgMTIuNTUyMyAyIDEyIDJINFpNNSA0SDExVjEwSDVWNFoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8L3N2Zz4K';
    }

    // Get current theme information (with fallback)
    let themeCssClass, themeVariables;
    try {
      themeCssClass = this.themeManager.getThemeCssClass();
      themeVariables = this.themeManager.getThemeVariables();
    } catch (error) {
      console.error('DroidBridge: Error getting theme info:', error);
      themeCssClass = 'vscode-dark'; // Default fallback
      themeVariables = ''; // Empty fallback
    }

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <style>
          ${themeVariables}
        </style>
        <title>DroidBridge</title>
      </head>
      <body class="${themeCssClass}">
        <div class="container ${themeCssClass}">
          <!-- Connect Section -->
          <div class="section">
            <div class="section-header">
              <img src="${plugIconUri}" alt="Connect" width="16" height="16" class="section-icon" />
              <h3>Connect</h3>
            </div>
            <div class="section-content">
              <div class="status-indicator" id="connection-status">
                <span class="codicon codicon-x status-icon"></span>
                <span class="status-text">Disconnected</span>
              </div>
              
              <div class="input-group">
                <label for="ip-input">IP Address:</label>
                <input type="text" id="ip-input" placeholder="192.168.1.100" value="${this.currentIp}">
              </div>
              
              <div class="input-group">
                <label for="port-input">Port:</label>
                <input type="text" id="port-input" placeholder="5555" value="${this.currentPort}">
              </div>
              
              <div class="button-group">
                <button id="connect-btn" class="primary-button" ${!this.connectionStatus && this.currentIp && this.currentPort ? '' : 'disabled'}>
                  <span class="codicon codicon-plug"></span>
                  Connect Device
                </button>
                <button id="disconnect-btn" class="secondary-button" ${this.connectionStatus ? '' : 'disabled'}>
                  <span class="codicon codicon-debug-disconnect"></span>
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          <!-- Scrcpy Section -->
          <div class="section">
            <div class="section-header">
              <img src="${deviceIconUri}" alt="Device" width="16" height="16" class="section-icon" />
              <h3>Scrcpy</h3>
            </div>
            <div class="section-content">
              <div class="status-indicator" id="scrcpy-status">
                <span class="codicon codicon-stop status-icon"></span>
                <span class="status-text">Stopped</span>
              </div>
              
              <div class="button-group">
                <button id="launch-scrcpy-btn" class="primary-button" ${!this.scrcpyStatus && this.connectionStatus ? '' : 'disabled'}>
                  <span class="codicon codicon-play"></span>
                  Launch Scrcpy
                </button>
                <button id="launch-scrcpy-screen-off-btn" class="secondary-button" ${!this.scrcpyStatus && this.connectionStatus ? '' : 'disabled'}>
                  <span class="codicon codicon-play-circle"></span>
                  Launch (Screen Off)
                </button>
                <button id="stop-scrcpy-btn" class="secondary-button" ${this.scrcpyStatus ? '' : 'disabled'}>
                  <span class="codicon codicon-stop"></span>
                  Stop Scrcpy
                </button>
              </div>
            </div>
          </div>

          <!-- Scrcpy Sidebar Mirror Section -->
          <div class="section" id="scrcpy-sidebar-section">
            <div class="section-header">
              <span class="codicon codicon-device-mobile section-icon"></span>
              <h3>Screen Mirror</h3>
              <div class="section-actions">
                <button id="eject-scrcpy-btn" class="icon-button" title="Eject to External Window" ${this.scrcpySidebarState.isRunning ? '' : 'disabled'}>
                  <span class="codicon codicon-window"></span>
                </button>
                <button id="close-scrcpy-btn" class="icon-button" title="Close Scrcpy" ${this.scrcpySidebarState.isRunning ? '' : 'disabled'}>
                  <span class="codicon codicon-close"></span>
                </button>
              </div>
            </div>
            <div class="section-content">
              <div id="scrcpy-container" class="scrcpy-mirror-container">
                <div id="scrcpy-placeholder" class="scrcpy-placeholder" ${this.scrcpySidebarState.isRunning ? 'style="display: none;"' : ''}>
                  <span class="codicon codicon-device-mobile"></span>
                  <p>Screen mirroring appears here when launched</p>
                  <p class="help-text">Click "Launch Scrcpy" above to start mirroring</p>
                </div>
                <div id="scrcpy-active" class="scrcpy-active" ${this.scrcpySidebarState.isRunning ? '' : 'style="display: none;"'}>
                  <div class="scrcpy-status">
                    <span class="codicon codicon-eye"></span>
                    <span>Screen mirroring active</span>
                  </div>
                  <p class="help-text">Scrcpy window should appear positioned near the sidebar. Use the buttons above to eject or close.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pairing Section -->
          <div class="section">
            <div class="section-header">
              <span class="codicon codicon-link section-icon"></span>
              <h3>Wireless Pairing</h3>
            </div>
            <div class="section-content">
              <p class="help-text">
                <strong>Quick Steps:</strong>
                <br />1. On Android: <em>Developer options → Wireless debugging → Pair device with pairing code</em>
                <br />2. Enter the <strong>IP address</strong>, <strong>Port</strong>, and <strong>6-digit code</strong> shown on device
                <br />3. Click <strong>Pair (Manual)</strong> - pairing expires in ~60 seconds
                <br />4. After pairing, use <strong>Connect</strong> section with device's ADB port (usually 5555)
              </p>
              <div class="input-row">
                <div class="input-group small">
                  <label for="pair-host-input">Host:</label>
                  <input type="text" id="pair-host-input" placeholder="192.168.1.50" />
                </div>
                <div class="input-group small">
                  <label for="pair-port-input">Port:</label>
                  <input type="text" id="pair-port-input" placeholder="37123" />
                </div>
                <div class="input-group small">
                  <label for="pair-code-input">Code:</label>
                  <input type="text" id="pair-code-input" placeholder="6 digits" maxlength="6" />
                </div>
              </div>
              <div class="button-group">
                <button id="pair-manual-btn" class="secondary-button">
                  <span class="codicon codicon-link"></span>
                  Pair (Manual)
                </button>
              </div>
            </div>
          </div>

          <!-- Connection History Section -->
          <div class="section">
            <div class="section-header">
              <span class="codicon codicon-history section-icon"></span>
              <h3>Recent Connections</h3>
            </div>
            <div class="section-content">
              <div id="connection-history">
                ${this.generateHistoryHtml()}
              </div>
            </div>
          </div>

          <!-- Logs Section -->
          <div class="section">
            <div class="section-content">
              <button id="show-logs-btn" class="secondary-button">
                <span class="codicon codicon-output"></span>
                Show Logs
              </button>
            </div>
          </div>
        </div>

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  /**
   * Refresh the webview content
   */
  refresh(): void {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  /**
   * Update the webview state without full refresh
   */
  private _updateWebviewState(): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateState',
        connectionStatus: this.connectionStatus,
        scrcpyStatus: this.scrcpyStatus,
        currentIp: this.currentIp,
        currentPort: this.currentPort,
        connectionHistory: this.connectionHistory.getRecentConnections(),
        scrcpySidebar: this.scrcpySidebarState
      });
    }
  }

  showScrcpySidebar(isRunning: boolean, processId?: number, windowId?: string): void {
    this.scrcpySidebarState = {
      isRunning,
      processId,
      windowId
    };

    if (this._view) {
      this._view.webview.postMessage({
        type: 'scrcpySidebarUpdate',
        state: this.scrcpySidebarState
      });
      this._updateWebviewState();
    }
  }



  /**
   * Generate simple HTML for webview (fallback)
   */
  private _getSimpleHtmlForWebview(webview: vscode.Webview) {
    const nonce = getNonce();
    
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DroidBridge</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section h3 {
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
          }
          input {
            width: 100%;
            padding: 6px 8px;
            margin-bottom: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
          }
          button {
            width: 100%;
            padding: 8px 12px;
            margin-bottom: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .status {
            padding: 8px;
            margin-bottom: 12px;
            border-radius: 4px;
            font-size: 13px;
          }
          .status.connected {
            background-color: var(--vscode-charts-green, #4CAF50);
            color: white;
          }
          .status.disconnected {
            background-color: var(--vscode-charts-red, #F44336);
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <h3>🔌 Connect</h3>
          <div class="status disconnected" id="connection-status">Disconnected</div>
          <input type="text" id="ip-input" placeholder="IP Address (e.g., 192.168.1.100)" value="${this.currentIp}">
          <input type="text" id="port-input" placeholder="Port (e.g., 5555)" value="${this.currentPort}">
          <button id="connect-btn">Connect Device</button>
          <button id="disconnect-btn" disabled>Disconnect</button>
        </div>
        
        <div class="section">
          <h3>📱 Scrcpy</h3>
          <div class="status disconnected" id="scrcpy-status">Stopped</div>
          <button id="launch-scrcpy-btn" disabled>Launch Scrcpy</button>
          <button id="launch-scrcpy-screen-off-btn" disabled>Launch (Screen Off)</button>
          <button id="stop-scrcpy-btn" disabled>Stop Scrcpy</button>
        </div>
        
        <div class="section">
          <button id="show-logs-btn">Show Logs</button>
        </div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          
          // Get elements
          const ipInput = document.getElementById('ip-input');
          const portInput = document.getElementById('port-input');
          const connectBtn = document.getElementById('connect-btn');
          const disconnectBtn = document.getElementById('disconnect-btn');
          const launchScrcpyBtn = document.getElementById('launch-scrcpy-btn');
          const launchScrcpyScreenOffBtn = document.getElementById('launch-scrcpy-screen-off-btn');
          const stopScrcpyBtn = document.getElementById('stop-scrcpy-btn');
          const showLogsBtn = document.getElementById('show-logs-btn');
          const connectionStatus = document.getElementById('connection-status');
          const scrcpyStatus = document.getElementById('scrcpy-status');
          
          // Event listeners
          connectBtn.addEventListener('click', () => {
            const ip = ipInput.value.trim();
            const port = portInput.value.trim();
            if (ip && port) {
              vscode.postMessage({ type: 'connectDevice', ip, port });
            }
          });
          
          disconnectBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'disconnectDevice' });
          });
          
          launchScrcpyBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'launchScrcpy' });
          });
          
          launchScrcpyScreenOffBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'launchScrcpyScreenOff' });
          });
          
          stopScrcpyBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'stopScrcpy' });
          });
          
          showLogsBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'showLogs' });
          });
          
          // Input change handlers
          ipInput.addEventListener('input', (e) => {
            vscode.postMessage({ type: 'ipChanged', value: e.target.value });
          });
          
          portInput.addEventListener('input', (e) => {
            vscode.postMessage({ type: 'portChanged', value: e.target.value });
          });
          
          // Listen for state updates
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateState') {
              updateUI(message);
            }
          });
          
          function updateUI(state) {
            // Update connection status
            if (state.connectionStatus) {
              connectionStatus.textContent = 'Connected';
              connectionStatus.className = 'status connected';
              connectBtn.disabled = true;
              disconnectBtn.disabled = false;
            } else {
              connectionStatus.textContent = 'Disconnected';
              connectionStatus.className = 'status disconnected';
              connectBtn.disabled = false;
              disconnectBtn.disabled = true;
            }
            
            // Update scrcpy status
            if (state.scrcpyStatus) {
              scrcpyStatus.textContent = 'Running';
              scrcpyStatus.className = 'status connected';
              launchScrcpyBtn.disabled = true;
              launchScrcpyScreenOffBtn.disabled = true;
              stopScrcpyBtn.disabled = false;
            } else {
              scrcpyStatus.textContent = 'Stopped';
              scrcpyStatus.className = 'status disconnected';
              launchScrcpyBtn.disabled = !state.connectionStatus;
              launchScrcpyScreenOffBtn.disabled = !state.connectionStatus;
              stopScrcpyBtn.disabled = true;
            }
            
            // Update input values
            if (state.currentIp !== undefined) {
              ipInput.value = state.currentIp;
            }
            if (state.currentPort !== undefined) {
              portInput.value = state.currentPort;
            }
          }
        </script>
      </body>
      </html>`;
  }

  /**
   * Generate HTML for connection history
   */
  private generateHistoryHtml(): string {
    const history = this.connectionHistory.getRecentConnections();
    
    if (history.length === 0) {
      return '<div class="history-empty">No recent connections</div>';
    }

    return history.map(entry => {
      const displayName = entry.name || `${entry.ip}:${entry.port}`;
      const lastConnected = entry.lastConnected.toLocaleDateString();
      
      return `
        <div class="history-item" data-id="${entry.id}">
          <div class="history-info">
            <div class="history-name">${displayName}</div>
            <div class="history-details">${entry.ip}:${entry.port}</div>
            <div class="history-meta">Last: ${lastConnected} (${entry.connectionCount}x)</div>
          </div>
          <div class="history-actions">
            <button class="history-connect-btn" data-ip="${entry.ip}" data-port="${entry.port}" title="Connect">
              <span class="codicon codicon-plug"></span>
            </button>
            <button class="history-remove-btn" data-id="${entry.id}" title="Remove">
              <span class="codicon codicon-trash"></span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update the connection status and refresh the view
   */
  updateConnectionStatus(connected: boolean, ip?: string, port?: string): void {
    this.connectionStatus = connected;
    if (ip) {
      this.currentIp = ip;
    }
    if (port) {
      this.currentPort = port;
    }
    
    // Add to history if successfully connected
    if (connected && ip && port) {
      this.connectionHistory.addConnection(ip, port);
    }
    
    this._updateWebviewState();
  }

  /**
   * Update the scrcpy status and refresh the view
   */
  updateScrcpyStatus(running: boolean): void {
    this.scrcpyStatus = running;
    this._updateWebviewState();
  }

  /**
   * Update the IP address and refresh the view
   */
  updateIpAddress(ip: string): void {
    this.currentIp = ip;
    this._updateWebviewState();
  }

  /**
   * Update the port and refresh the view
   */
  updatePort(port: string): void {
    this.currentPort = port;
    this._updateWebviewState();
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): boolean {
    return this.connectionStatus;
  }

  /**
   * Get the current scrcpy status
   */
  getScrcpyStatus(): boolean {
    return this.scrcpyStatus;
  }

  /**
   * Get the current IP address
   */
  getCurrentIp(): string {
    return this.currentIp;
  }

  /**
   * Get the current port
   */
  getCurrentPort(): string {
    return this.currentPort;
  }

  /**
   * Reset all status to initial state
   */
  reset(): void {
    this.connectionStatus = false;
    this.scrcpyStatus = false;
    this.loadDefaultValues(); // Reload defaults instead of clearing
    this.scrcpySidebarState = { isRunning: false };
    this._updateWebviewState();
  }

  /**
   * Synchronize sidebar state with actual process states
   * This method should be called periodically or when state changes are detected
   */
  synchronizeState(connectionState: any, scrcpyState: any): void {
    let stateChanged = false;

    // Update connection status
    if (this.connectionStatus !== connectionState.connected) {
      this.connectionStatus = connectionState.connected;
      stateChanged = true;
    }

    // Update connection details if connected
    if (connectionState.connected && connectionState.deviceIp && connectionState.devicePort) {
      if (this.currentIp !== connectionState.deviceIp || this.currentPort !== connectionState.devicePort) {
        this.currentIp = connectionState.deviceIp;
        this.currentPort = connectionState.devicePort;
        stateChanged = true;
      }
    }

    // Update scrcpy status
    if (this.scrcpyStatus !== scrcpyState.running) {
      this.scrcpyStatus = scrcpyState.running;
      stateChanged = true;
    }

    // Only update webview if state actually changed
    if (stateChanged) {
      this._updateWebviewState();
    }
  }

  /**
   * Force refresh the sidebar state from configuration and process managers
   */
  forceRefresh(): void {
    this.loadDefaultValues();
    this.refresh();
  }

  /**
   * Get current sidebar state for external synchronization
   */
  getCurrentState(): { connectionStatus: boolean; scrcpyStatus: boolean; currentIp: string; currentPort: string; scrcpySidebar: ScrcpySidebarState } {
    return {
      connectionStatus: this.connectionStatus,
      scrcpyStatus: this.scrcpyStatus,
      currentIp: this.currentIp,
      currentPort: this.currentPort,
      scrcpySidebar: this.scrcpySidebarState
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.configChangeListener) {
      this.configChangeListener.dispose();
    }
    if (this.themeChangeListener) {
      this.themeChangeListener.dispose();
    }
  }
}

/**
 * Generate a nonce for Content Security Policy
 */
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}