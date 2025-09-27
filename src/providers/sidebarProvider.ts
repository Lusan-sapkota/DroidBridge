import * as vscode from 'vscode';
import { ConfigManager } from '../managers/configManager';
import { ThemeManager, ThemeKind } from '../utils/themeManager';

/**
 * Provides the webview content for the DroidBridge sidebar view
 */
export class DroidBridgeSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'droidbridge.sidebar';

  private _view?: vscode.WebviewView;
  private connectionStatus: boolean = false;
  private scrcpyStatus: boolean = false;
  private currentIp: string = '';
  private currentPort: string = '';
  private configManager: ConfigManager;
  private configChangeListener?: vscode.Disposable;
  private themeManager: ThemeManager;
  private themeChangeListener?: vscode.Disposable;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    configManager: ConfigManager
  ) {
    this.configManager = configManager;
    this.themeManager = ThemeManager.getInstance();
    
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
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

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

    // Get theme-specific icons
    const plugIconUri = this.themeManager.getWebviewIconUri('plug', this._extensionUri, webview);
    const deviceIconUri = this.themeManager.getWebviewIconUri('device-mobile', this._extensionUri, webview);

    // Get current theme information
    const themeCssClass = this.themeManager.getThemeCssClass();
    const themeVariables = this.themeManager.getThemeVariables();

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
        currentPort: this.currentPort
      });
    }
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
  getCurrentState(): { connectionStatus: boolean; scrcpyStatus: boolean; currentIp: string; currentPort: string } {
    return {
      connectionStatus: this.connectionStatus,
      scrcpyStatus: this.scrcpyStatus,
      currentIp: this.currentIp,
      currentPort: this.currentPort
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