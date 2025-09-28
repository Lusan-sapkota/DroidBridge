"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/providers/sidebarProvider.ts
var sidebarProvider_exports = {};
__export(sidebarProvider_exports, {
  DroidBridgeSidebarProvider: () => DroidBridgeSidebarProvider
});
module.exports = __toCommonJS(sidebarProvider_exports);
var vscode2 = __toESM(require("vscode"));

// src/utils/themeManager.ts
var vscode = __toESM(require("vscode"));
var _ThemeManager = class _ThemeManager {
  currentTheme;
  themeChangeListeners = [];
  disposables = [];
  constructor() {
    this.currentTheme = this.detectCurrentTheme();
    this.setupThemeChangeListener();
  }
  /**
   * Get the singleton instance of ThemeManager
   */
  static getInstance() {
    if (!_ThemeManager.instance) {
      _ThemeManager.instance = new _ThemeManager();
    }
    return _ThemeManager.instance;
  }
  /**
   * Detect the current VSCode theme
   * Implements requirement 10.1, 10.2: Automatic theme detection
   */
  detectCurrentTheme() {
    const colorTheme = vscode.window.activeColorTheme;
    switch (colorTheme.kind) {
      case vscode.ColorThemeKind.Light:
        return 1 /* Light */;
      case vscode.ColorThemeKind.Dark:
        return 2 /* Dark */;
      case vscode.ColorThemeKind.HighContrast:
        return 3 /* HighContrast */;
      case vscode.ColorThemeKind.HighContrastLight:
        return 4 /* HighContrastLight */;
      default:
        return 2 /* Dark */;
    }
  }
  /**
   * Set up listener for theme changes
   * Implements requirement 10.3: Theme change listeners
   */
  setupThemeChangeListener() {
    const disposable = vscode.window.onDidChangeActiveColorTheme((colorTheme) => {
      const newTheme = this.mapColorThemeKindToThemeKind(colorTheme.kind);
      if (newTheme !== this.currentTheme) {
        const oldTheme = this.currentTheme;
        this.currentTheme = newTheme;
        this.themeChangeListeners.forEach((listener) => {
          try {
            listener(newTheme);
          } catch (error) {
            console.error("Error in theme change listener:", error);
          }
        });
      }
    });
    this.disposables.push(disposable);
  }
  /**
   * Map VSCode ColorThemeKind to our ThemeKind
   */
  mapColorThemeKindToThemeKind(kind) {
    switch (kind) {
      case vscode.ColorThemeKind.Light:
        return 1 /* Light */;
      case vscode.ColorThemeKind.Dark:
        return 2 /* Dark */;
      case vscode.ColorThemeKind.HighContrast:
        return 3 /* HighContrast */;
      case vscode.ColorThemeKind.HighContrastLight:
        return 4 /* HighContrastLight */;
      default:
        return 2 /* Dark */;
    }
  }
  /**
   * Get the current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  /**
   * Check if the current theme is dark
   */
  isDarkTheme() {
    return this.currentTheme === 2 /* Dark */ || this.currentTheme === 3 /* HighContrast */;
  }
  /**
   * Check if the current theme is light
   */
  isLightTheme() {
    return this.currentTheme === 1 /* Light */ || this.currentTheme === 4 /* HighContrastLight */;
  }
  /**
   * Get the appropriate icon path for the current theme
   * Implements requirement 10.4: Automatic icon switching
   */
  getThemeSpecificIcon(iconName, extensionUri) {
    const themeFolder = this.isDarkTheme() ? "dark" : "light";
    return vscode.Uri.joinPath(extensionUri, "media", "icons", themeFolder, `${iconName}.svg`);
  }
  /**
   * Get the theme-specific icon URI for webview usage
   */
  getWebviewIconUri(iconName, extensionUri, webview) {
    const iconPath = this.getThemeSpecificIcon(iconName, extensionUri);
    return webview.asWebviewUri(iconPath);
  }
  /**
   * Get CSS class name for current theme
   */
  getThemeCssClass() {
    switch (this.currentTheme) {
      case 1 /* Light */:
        return "vscode-light";
      case 2 /* Dark */:
        return "vscode-dark";
      case 3 /* HighContrast */:
        return "vscode-high-contrast";
      case 4 /* HighContrastLight */:
        return "vscode-high-contrast-light";
      default:
        return "vscode-dark";
    }
  }
  /**
   * Register a listener for theme changes
   * Implements requirement 10.3: Theme change listeners and UI updates
   */
  onThemeChanged(listener) {
    this.themeChangeListeners.push(listener);
    return {
      dispose: /* @__PURE__ */ __name(() => {
        const index = this.themeChangeListeners.indexOf(listener);
        if (index >= 0) {
          this.themeChangeListeners.splice(index, 1);
        }
      }, "dispose")
    };
  }
  /**
   * Get theme-specific CSS variables as a string
   * Implements requirement 10.5: CSS variable usage for consistent theming
   */
  getThemeVariables() {
    return `
      :root {
        --theme-kind: '${this.getThemeCssClass()}';
        --is-dark-theme: ${this.isDarkTheme() ? "true" : "false"};
        --is-light-theme: ${this.isLightTheme() ? "true" : "false"};
      }
    `;
  }
  /**
   * Refresh the current theme detection
   * Useful for manual theme refresh
   */
  refreshTheme() {
    const newTheme = this.detectCurrentTheme();
    if (newTheme !== this.currentTheme) {
      const oldTheme = this.currentTheme;
      this.currentTheme = newTheme;
      this.themeChangeListeners.forEach((listener) => {
        try {
          listener(newTheme);
        } catch (error) {
          console.error("Error in theme change listener during refresh:", error);
        }
      });
    }
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
    this.themeChangeListeners = [];
  }
  /**
   * Reset the singleton instance (for testing purposes)
   */
  static resetInstance() {
    if (_ThemeManager.instance) {
      _ThemeManager.instance.dispose();
      _ThemeManager.instance = void 0;
    }
  }
};
__name(_ThemeManager, "ThemeManager");
__publicField(_ThemeManager, "instance");
var ThemeManager = _ThemeManager;

// src/managers/connectionHistory.ts
var _ConnectionHistoryManager = class _ConnectionHistoryManager {
  context;
  history = [];
  constructor(context) {
    this.context = context;
    this.loadHistory();
  }
  /**
   * Load connection history from storage
   */
  loadHistory() {
    const stored = this.context.globalState.get(_ConnectionHistoryManager.STORAGE_KEY, []);
    this.history = stored.map((entry) => ({
      ...entry,
      lastConnected: new Date(entry.lastConnected)
    }));
  }
  /**
   * Save connection history to storage
   */
  async saveHistory() {
    await this.context.globalState.update(_ConnectionHistoryManager.STORAGE_KEY, this.history);
  }
  /**
   * Add or update a connection in history
   */
  async addConnection(ip, port, name) {
    const id = `${ip}:${port}`;
    const existingIndex = this.history.findIndex((entry) => entry.id === id);
    if (existingIndex >= 0) {
      this.history[existingIndex].lastConnected = /* @__PURE__ */ new Date();
      this.history[existingIndex].connectionCount++;
      if (name) {
        this.history[existingIndex].name = name;
      }
      const entry = this.history.splice(existingIndex, 1)[0];
      this.history.unshift(entry);
    } else {
      const newEntry = {
        id,
        ip,
        port,
        name,
        lastConnected: /* @__PURE__ */ new Date(),
        connectionCount: 1
      };
      this.history.unshift(newEntry);
      if (this.history.length > _ConnectionHistoryManager.MAX_HISTORY_ENTRIES) {
        this.history = this.history.slice(0, _ConnectionHistoryManager.MAX_HISTORY_ENTRIES);
      }
    }
    await this.saveHistory();
  }
  /**
   * Remove a connection from history
   */
  async removeConnection(id) {
    this.history = this.history.filter((entry) => entry.id !== id);
    await this.saveHistory();
  }
  /**
   * Clear all connection history
   */
  async clearHistory() {
    this.history = [];
    await this.saveHistory();
  }
  /**
   * Get all connection history entries
   */
  getHistory() {
    return [...this.history];
  }
  /**
   * Get a specific connection by ID
   */
  getConnection(id) {
    return this.history.find((entry) => entry.id === id);
  }
  /**
   * Update the name of a connection
   */
  async updateConnectionName(id, name) {
    const entry = this.history.find((e) => e.id === id);
    if (entry) {
      entry.name = name;
      await this.saveHistory();
    }
  }
  /**
   * Get recent connections (last 5)
   */
  getRecentConnections() {
    return this.history.slice(0, 5);
  }
};
__name(_ConnectionHistoryManager, "ConnectionHistoryManager");
__publicField(_ConnectionHistoryManager, "STORAGE_KEY", "droidbridge.connectionHistory");
__publicField(_ConnectionHistoryManager, "MAX_HISTORY_ENTRIES", 10);
var ConnectionHistoryManager = _ConnectionHistoryManager;

// src/providers/sidebarProvider.ts
var _DroidBridgeSidebarProvider = class _DroidBridgeSidebarProvider {
  constructor(_extensionUri, _context, configManager) {
    this._extensionUri = _extensionUri;
    this._context = _context;
    this.configManager = configManager;
    this.themeManager = ThemeManager.getInstance();
    this.connectionHistory = new ConnectionHistoryManager(_context);
    this.loadDefaultValues();
    this.setupConfigurationWatcher();
    this.setupThemeChangeListener();
  }
  _view;
  connectionStatus = false;
  scrcpyStatus = false;
  currentIp = "";
  currentPort = "";
  configManager;
  configChangeListener;
  themeManager;
  themeChangeListener;
  connectionHistory;
  /**
   * Load default IP and port values from configuration
   */
  loadDefaultValues() {
    const config = this.configManager.getConfigWithDefaults();
    this.currentIp = config.ip;
    this.currentPort = config.port;
  }
  /**
   * Set up configuration change watcher to update defaults
   */
  setupConfigurationWatcher() {
    this.configChangeListener = this.configManager.onConfigurationChanged(() => {
      this.loadDefaultValues();
      this._updateWebviewState();
    });
    this._context.subscriptions.push(this.configChangeListener);
  }
  /**
   * Set up theme change listener to refresh webview on theme changes
   * Implements requirements 10.3: Theme change listeners and UI updates
   */
  setupThemeChangeListener() {
    this.themeChangeListener = this.themeManager.onThemeChanged((theme) => {
      if (this._view) {
        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        this._view.webview.postMessage({
          type: "themeChanged",
          theme,
          isDark: this.themeManager.isDarkTheme(),
          isLight: this.themeManager.isLightTheme(),
          themeCssClass: this.themeManager.getThemeCssClass()
        });
      }
    });
    this._context.subscriptions.push(this.themeChangeListener);
  }
  /**
   * Resolves the webview view and sets up the content
   */
  resolveWebviewView(webviewView, context, _token) {
    console.log("DroidBridge: Resolving webview view");
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    try {
      webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
      console.log("DroidBridge: Webview HTML set successfully");
    } catch (error) {
      console.error("DroidBridge: Error setting webview HTML:", error);
      webviewView.webview.html = this._getSimpleHtmlForWebview(webviewView.webview);
    }
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case "connectDevice":
            vscode2.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "disconnectDevice":
            vscode2.commands.executeCommand("droidbridge.disconnectDevice");
            break;
          case "launchScrcpy":
            vscode2.commands.executeCommand("droidbridge.launchScrcpy");
            break;
          case "launchScrcpyScreenOff":
            vscode2.commands.executeCommand("droidbridge.launchScrcpyScreenOff");
            break;
          case "stopScrcpy":
            vscode2.commands.executeCommand("droidbridge.stopScrcpy");
            break;
          case "showLogs":
            vscode2.commands.executeCommand("droidbridge.showLogs");
            break;
          case "ipChanged":
            this.currentIp = message.value;
            break;
          case "portChanged":
            this.currentPort = message.value;
            break;
          case "connectFromHistory":
            vscode2.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "removeFromHistory":
            this.connectionHistory.removeConnection(message.id);
            this._updateWebviewState();
            break;
          case "clearHistory":
            this.connectionHistory.clearHistory();
            this._updateWebviewState();
            break;
        }
      },
      void 0,
      this._context.subscriptions
    );
  }
  /**
   * Generate the HTML content for the webview
   * Implements requirements 10.4: Theme-specific icon usage
   */
  _getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(vscode2.Uri.joinPath(this._extensionUri, "media", "main.js"));
    const styleResetUri = webview.asWebviewUri(vscode2.Uri.joinPath(this._extensionUri, "media", "reset.css"));
    const styleVSCodeUri = webview.asWebviewUri(vscode2.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
    const styleMainUri = webview.asWebviewUri(vscode2.Uri.joinPath(this._extensionUri, "media", "main.css"));
    let plugIconUri, deviceIconUri;
    try {
      plugIconUri = this.themeManager.getWebviewIconUri("plug", this._extensionUri, webview);
      deviceIconUri = this.themeManager.getWebviewIconUri("device-mobile", this._extensionUri, webview);
    } catch (error) {
      console.error("DroidBridge: Error getting theme icons:", error);
      plugIconUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMkM2LjkgMiA2IDIuOSA2IDRWNkg0VjhIMTJWNkgxMFY0QzEwIDIuOSA5LjEgMiA4IDJaTTggNEM4LjYgNCA5IDQuNCA5IDVWNkg3VjVDNyA0LjQgNy40IDQgOCA0WiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPgo=";
      deviceIconUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMkMzLjQ0NzcyIDIgMyAyLjQ0NzcyIDMgM1YxM0MzIDEzLjU1MjMgMy40NDc3MiAxNCA0IDE0SDEyQzEyLjU1MjMgMTQgMTMgMTMuNTUyMyAxMyAxM1YzQzEzIDIuNDQ3NzIgMTIuNTUyMyAyIDEyIDJINFpNNSA0SDExVjEwSDVWNFoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8L3N2Zz4K";
    }
    let themeCssClass, themeVariables;
    try {
      themeCssClass = this.themeManager.getThemeCssClass();
      themeVariables = this.themeManager.getThemeVariables();
    } catch (error) {
      console.error("DroidBridge: Error getting theme info:", error);
      themeCssClass = "vscode-dark";
      themeVariables = "";
    }
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
                <button id="connect-btn" class="primary-button" ${!this.connectionStatus && this.currentIp && this.currentPort ? "" : "disabled"}>
                  <span class="codicon codicon-plug"></span>
                  Connect Device
                </button>
                <button id="disconnect-btn" class="secondary-button" ${this.connectionStatus ? "" : "disabled"}>
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
                <button id="launch-scrcpy-btn" class="primary-button" ${!this.scrcpyStatus && this.connectionStatus ? "" : "disabled"}>
                  <span class="codicon codicon-play"></span>
                  Launch Scrcpy
                </button>
                <button id="launch-scrcpy-screen-off-btn" class="secondary-button" ${!this.scrcpyStatus && this.connectionStatus ? "" : "disabled"}>
                  <span class="codicon codicon-play-circle"></span>
                  Launch (Screen Off)
                </button>
                <button id="stop-scrcpy-btn" class="secondary-button" ${this.scrcpyStatus ? "" : "disabled"}>
                  <span class="codicon codicon-stop"></span>
                  Stop Scrcpy
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
  refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }
  /**
   * Update the webview state without full refresh
   */
  _updateWebviewState() {
    if (this._view) {
      this._view.webview.postMessage({
        type: "updateState",
        connectionStatus: this.connectionStatus,
        scrcpyStatus: this.scrcpyStatus,
        currentIp: this.currentIp,
        currentPort: this.currentPort,
        connectionHistory: this.connectionHistory.getRecentConnections()
      });
    }
  }
  /**
   * Generate simple HTML for webview (fallback)
   */
  _getSimpleHtmlForWebview(webview) {
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
          <h3>\u{1F50C} Connect</h3>
          <div class="status disconnected" id="connection-status">Disconnected</div>
          <input type="text" id="ip-input" placeholder="IP Address (e.g., 192.168.1.100)" value="${this.currentIp}">
          <input type="text" id="port-input" placeholder="Port (e.g., 5555)" value="${this.currentPort}">
          <button id="connect-btn">Connect Device</button>
          <button id="disconnect-btn" disabled>Disconnect</button>
        </div>
        
        <div class="section">
          <h3>\u{1F4F1} Scrcpy</h3>
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
  generateHistoryHtml() {
    const history = this.connectionHistory.getRecentConnections();
    if (history.length === 0) {
      return '<div class="history-empty">No recent connections</div>';
    }
    return history.map((entry) => {
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
    }).join("");
  }
  /**
   * Update the connection status and refresh the view
   */
  updateConnectionStatus(connected, ip, port) {
    this.connectionStatus = connected;
    if (ip) {
      this.currentIp = ip;
    }
    if (port) {
      this.currentPort = port;
    }
    if (connected && ip && port) {
      this.connectionHistory.addConnection(ip, port);
    }
    this._updateWebviewState();
  }
  /**
   * Update the scrcpy status and refresh the view
   */
  updateScrcpyStatus(running) {
    this.scrcpyStatus = running;
    this._updateWebviewState();
  }
  /**
   * Update the IP address and refresh the view
   */
  updateIpAddress(ip) {
    this.currentIp = ip;
    this._updateWebviewState();
  }
  /**
   * Update the port and refresh the view
   */
  updatePort(port) {
    this.currentPort = port;
    this._updateWebviewState();
  }
  /**
   * Get the current connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }
  /**
   * Get the current scrcpy status
   */
  getScrcpyStatus() {
    return this.scrcpyStatus;
  }
  /**
   * Get the current IP address
   */
  getCurrentIp() {
    return this.currentIp;
  }
  /**
   * Get the current port
   */
  getCurrentPort() {
    return this.currentPort;
  }
  /**
   * Reset all status to initial state
   */
  reset() {
    this.connectionStatus = false;
    this.scrcpyStatus = false;
    this.loadDefaultValues();
    this._updateWebviewState();
  }
  /**
   * Synchronize sidebar state with actual process states
   * This method should be called periodically or when state changes are detected
   */
  synchronizeState(connectionState, scrcpyState) {
    let stateChanged = false;
    if (this.connectionStatus !== connectionState.connected) {
      this.connectionStatus = connectionState.connected;
      stateChanged = true;
    }
    if (connectionState.connected && connectionState.deviceIp && connectionState.devicePort) {
      if (this.currentIp !== connectionState.deviceIp || this.currentPort !== connectionState.devicePort) {
        this.currentIp = connectionState.deviceIp;
        this.currentPort = connectionState.devicePort;
        stateChanged = true;
      }
    }
    if (this.scrcpyStatus !== scrcpyState.running) {
      this.scrcpyStatus = scrcpyState.running;
      stateChanged = true;
    }
    if (stateChanged) {
      this._updateWebviewState();
    }
  }
  /**
   * Force refresh the sidebar state from configuration and process managers
   */
  forceRefresh() {
    this.loadDefaultValues();
    this.refresh();
  }
  /**
   * Get current sidebar state for external synchronization
   */
  getCurrentState() {
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
  dispose() {
    if (this.configChangeListener) {
      this.configChangeListener.dispose();
    }
    if (this.themeChangeListener) {
      this.themeChangeListener.dispose();
    }
  }
};
__name(_DroidBridgeSidebarProvider, "DroidBridgeSidebarProvider");
// Must match the view id in package.json (contributes.views["droidbridge"][0].id)
__publicField(_DroidBridgeSidebarProvider, "viewType", "droidbridge-sidebar");
var DroidBridgeSidebarProvider = _DroidBridgeSidebarProvider;
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
__name(getNonce, "getNonce");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DroidBridgeSidebarProvider
});
//# sourceMappingURL=sidebarProvider.js.map
