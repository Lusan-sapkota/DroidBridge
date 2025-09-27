"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));

// src/managers/commandManager.ts
var CommandManager = class {
  /**
   * Register all DroidBridge commands with VSCode
   */
  registerCommands(context) {
  }
  /**
   * Connect to an Android device via ADB
   */
  async connectDevice(ip, port) {
    return false;
  }
  /**
   * Disconnect from the current Android device
   */
  async disconnectDevice() {
    return false;
  }
  /**
   * Launch scrcpy screen mirroring
   */
  async launchScrcpy() {
    return false;
  }
  /**
   * Stop the current scrcpy session
   */
  async stopScrcpy() {
    return false;
  }
  /**
   * Show the DroidBridge logs output channel
   */
  showLogs() {
  }
};

// src/managers/processManager.ts
var ProcessManager = class {
  /**
   * Execute an ADB command with the given arguments
   */
  async executeAdbCommand(args) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      exitCode: -1
    };
  }
  /**
   * Launch scrcpy with optional configuration
   */
  async launchScrcpy(options) {
    throw new Error("Not implemented");
  }
  /**
   * Stop the current scrcpy process
   */
  async stopScrcpy() {
    return false;
  }
  /**
   * Check if scrcpy is currently running
   */
  isScrcpyRunning() {
    return false;
  }
  /**
   * Clean up all managed processes
   */
  async cleanup() {
  }
};

// src/managers/configManager.ts
var vscode = __toESM(require("vscode"));
var ConfigManager = class _ConfigManager {
  static CONFIG_SECTION = "droidbridge";
  static DEFAULT_IP = "192.168.1.100";
  static DEFAULT_PORT = "5555";
  /**
   * Get the default IP address for ADB connections
   */
  getDefaultIp() {
    const config = vscode.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const ip = config.get("defaultIp", _ConfigManager.DEFAULT_IP);
    return ip.trim() || _ConfigManager.DEFAULT_IP;
  }
  /**
   * Get the default port for ADB connections
   */
  getDefaultPort() {
    const config = vscode.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const port = config.get("defaultPort", _ConfigManager.DEFAULT_PORT);
    return port.trim() || _ConfigManager.DEFAULT_PORT;
  }
  /**
   * Get custom ADB binary path if configured
   */
  getCustomAdbPath() {
    const config = vscode.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const path2 = config.get("adbPath", "");
    return path2.trim() || void 0;
  }
  /**
   * Get custom scrcpy binary path if configured
   */
  getCustomScrcpyPath() {
    const config = vscode.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const path2 = config.get("scrcpyPath", "");
    return path2.trim() || void 0;
  }
  /**
   * Get all configuration values with validation
   */
  getValidatedConfig() {
    const defaultIp = this.getDefaultIp();
    const defaultPort = this.getDefaultPort();
    const customAdbPath = this.getCustomAdbPath();
    const customScrcpyPath = this.getCustomScrcpyPath();
    const errors = [];
    if (!this.validateIpAddress(defaultIp)) {
      errors.push(`Invalid IP address: ${defaultIp}`);
    }
    if (!this.validatePort(defaultPort)) {
      errors.push(`Invalid port: ${defaultPort}`);
    }
    return {
      defaultIp,
      defaultPort,
      customAdbPath,
      customScrcpyPath,
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Validate an IP address format
   * Supports IPv4 addresses including localhost and private network ranges
   */
  validateIpAddress(ip) {
    if (!ip || typeof ip !== "string") {
      return false;
    }
    const trimmedIp = ip.trim();
    if (trimmedIp === "localhost" || trimmedIp === "127.0.0.1") {
      return true;
    }
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
    if (!ipv4Regex.test(trimmedIp)) {
      return false;
    }
    const parts = trimmedIp.split(".");
    return parts.every((part) => {
      if (part.length > 1 && part.startsWith("0")) {
        return false;
      }
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  /**
   * Validate a port number
   * Must be between 1 and 65535 (inclusive)
   */
  validatePort(port) {
    if (port === null || port === void 0) {
      return false;
    }
    let portNum;
    if (typeof port === "string") {
      const trimmedPort = port.trim();
      if (trimmedPort === "") {
        return false;
      }
      if (trimmedPort.includes(".")) {
        return false;
      }
      if (!/^\d+$/.test(trimmedPort)) {
        return false;
      }
      if (trimmedPort.length > 1 && trimmedPort.startsWith("0")) {
        return false;
      }
      portNum = parseInt(trimmedPort, 10);
    } else {
      portNum = port;
    }
    return !isNaN(portNum) && Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;
  }
  /**
   * Validate IP and port combination
   */
  validateConnection(ip, port) {
    const errors = [];
    if (!this.validateIpAddress(ip)) {
      errors.push(`Invalid IP address: ${ip}. Must be a valid IPv4 address or 'localhost'.`);
    }
    if (!this.validatePort(port)) {
      errors.push(`Invalid port: ${port}. Must be a number between 1 and 65535.`);
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Get configuration with fallback to defaults
   */
  getConfigWithDefaults() {
    const ip = this.getDefaultIp();
    const port = this.getDefaultPort();
    return {
      ip: this.validateIpAddress(ip) ? ip : _ConfigManager.DEFAULT_IP,
      port: this.validatePort(port) ? port : _ConfigManager.DEFAULT_PORT
    };
  }
  /**
   * Register a callback for configuration changes
   */
  onConfigurationChanged(callback) {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(_ConfigManager.CONFIG_SECTION)) {
        callback();
      }
    });
  }
  /**
   * Update configuration value
   */
  async updateConfig(key, value, target = vscode.ConfigurationTarget.Workspace) {
    const config = vscode.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    await config.update(key, value, target);
  }
  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    const config = vscode.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    await Promise.all([
      config.update("defaultIp", void 0, vscode.ConfigurationTarget.Workspace),
      config.update("defaultPort", void 0, vscode.ConfigurationTarget.Workspace),
      config.update("adbPath", void 0, vscode.ConfigurationTarget.Workspace),
      config.update("scrcpyPath", void 0, vscode.ConfigurationTarget.Workspace)
    ]);
  }
};

// src/managers/binaryManager.ts
var path = __toESM(require("path"));
var fs = __toESM(require("fs/promises"));

// src/utils/platformUtils.ts
var os = __toESM(require("os"));
var PlatformUtils = class {
  /**
   * Get the binary file extension for the current platform
   */
  static getBinaryExtension() {
    return os.platform() === "win32" ? ".exe" : "";
  }
  /**
   * Get the binary path with platform-appropriate extension
   */
  static getBinaryPath(name) {
    return `${name}${this.getBinaryExtension()}`;
  }
  /**
   * Make a file executable (Unix systems only)
   */
  static async makeExecutable(path2) {
    if (os.platform() !== "win32") {
      const fs2 = await import("fs/promises");
      try {
        await fs2.chmod(path2, 493);
      } catch (error) {
        throw new Error(`Failed to make ${path2} executable: ${error}`);
      }
    }
  }
  /**
   * Get platform-specific spawn options
   */
  static getPlatformSpecificOptions() {
    const options = {
      stdio: ["pipe", "pipe", "pipe"]
    };
    if (os.platform() === "win32") {
      options.shell = true;
    }
    return options;
  }
  /**
   * Get the current platform identifier
   */
  static getCurrentPlatform() {
    const platform2 = os.platform();
    switch (platform2) {
      case "win32":
        return "win32";
      case "darwin":
        return "darwin";
      case "linux":
        return "linux";
      default:
        throw new Error(`Unsupported platform: ${platform2}`);
    }
  }
};

// src/managers/binaryManager.ts
var BinaryManager = class {
  extensionPath;
  configManager;
  constructor(extensionPath, configManager2) {
    this.extensionPath = extensionPath;
    this.configManager = configManager2;
  }
  /**
   * Get the path to the ADB binary (bundled or custom)
   */
  getAdbPath() {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath("adb");
  }
  /**
   * Get the path to the scrcpy binary (bundled or custom)
   */
  getScrcpyPath() {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath("scrcpy");
  }
  /**
   * Validate that required binaries exist and are executable
   */
  async validateBinaries() {
    const errors = [];
    let adbValid = false;
    let scrcpyValid = false;
    try {
      const adbPath = this.getAdbPath();
      adbValid = await this.validateBinary(adbPath, "adb");
      if (!adbValid) {
        errors.push(`ADB binary not found or not executable: ${adbPath}`);
      }
    } catch (error) {
      errors.push(`Error validating ADB binary: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
      const scrcpyPath = this.getScrcpyPath();
      scrcpyValid = await this.validateBinary(scrcpyPath, "scrcpy");
      if (!scrcpyValid) {
        errors.push(`Scrcpy binary not found or not executable: ${scrcpyPath}`);
      }
    } catch (error) {
      errors.push(`Error validating scrcpy binary: ${error instanceof Error ? error.message : String(error)}`);
    }
    return {
      adbValid,
      scrcpyValid,
      errors
    };
  }
  /**
   * Extract bundled binaries if needed (placeholder for future implementation)
   */
  async extractBinaries() {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const binariesDir = path.join(this.extensionPath, "binaries", platform2);
    try {
      await fs.access(binariesDir);
    } catch {
      await fs.mkdir(binariesDir, { recursive: true });
    }
  }
  /**
   * Get information about binary paths and their sources
   */
  getBinaryInfo() {
    const customAdbPath = this.configManager.getCustomAdbPath();
    const customScrcpyPath = this.configManager.getCustomScrcpyPath();
    return {
      adb: {
        path: this.getAdbPath(),
        isCustom: !!customAdbPath,
        bundledPath: this.getBundledBinaryPath("adb")
      },
      scrcpy: {
        path: this.getScrcpyPath(),
        isCustom: !!customScrcpyPath,
        bundledPath: this.getBundledBinaryPath("scrcpy")
      }
    };
  }
  /**
   * Check if bundled binaries directory exists for current platform
   */
  async hasBundledBinaries() {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const binariesDir = path.join(this.extensionPath, "binaries", platform2);
    try {
      const stats = await fs.stat(binariesDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
  /**
   * Get the path to a bundled binary
   */
  getBundledBinaryPath(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path.join(
      this.extensionPath,
      "binaries",
      platform2,
      `${binaryName}${extension}`
    );
  }
  /**
   * Validate that a binary exists and is executable
   */
  async validateBinary(binaryPath, binaryName) {
    try {
      const stats = await fs.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }
      if (PlatformUtils.getCurrentPlatform() !== "win32") {
        try {
          await fs.access(binaryPath, fs.constants.X_OK);
        } catch {
          try {
            await PlatformUtils.makeExecutable(binaryPath);
          } catch {
            return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }
};

// src/managers/logger.ts
var vscode2 = __toESM(require("vscode"));
var Logger = class {
  outputChannel;
  logLevel = 1 /* INFO */;
  constructor() {
    this.outputChannel = vscode2.window.createOutputChannel("DroidBridge Logs");
  }
  /**
   * Set the minimum log level for output
   */
  setLogLevel(level) {
    this.logLevel = level;
  }
  /**
   * Get current log level
   */
  getLogLevel() {
    return this.logLevel;
  }
  /**
   * Format timestamp for consistent logging
   */
  formatTimestamp() {
    const now = /* @__PURE__ */ new Date();
    return now.toISOString().replace("T", " ").replace("Z", "");
  }
  /**
   * Log a debug message
   * Only shown when log level is DEBUG
   */
  debug(message) {
    if (this.logLevel <= 0 /* DEBUG */) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] DEBUG: ${message}`);
    }
  }
  /**
   * Log an informational message
   * Requirement 6.5: Log with timestamps
   */
  info(message) {
    if (this.logLevel <= 1 /* INFO */) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }
  }
  /**
   * Log an error message
   * Requirement 6.5: Log detailed error information with timestamps
   */
  error(message, error) {
    const timestamp = this.formatTimestamp();
    let logMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      logMessage += `
Error Details: ${error.message}`;
      if (error.stack) {
        logMessage += `
Stack Trace:
${error.stack}`;
      }
    }
    this.outputChannel.appendLine(logMessage);
  }
  /**
   * Log process output
   * Requirements 6.2, 6.3: Capture and display stdout/stderr in OutputChannel
   */
  logProcessOutput(command, output, isError = false) {
    const timestamp = this.formatTimestamp();
    const level = isError ? "STDERR" : "STDOUT";
    this.outputChannel.appendLine(`[${timestamp}] PROCESS ${level}: ${command}`);
    if (output.trim()) {
      const lines = output.trim().split("\n");
      lines.forEach((line) => {
        this.outputChannel.appendLine(`  ${line}`);
      });
    }
    this.outputChannel.appendLine("");
  }
  /**
   * Show a progress notification
   * Requirement 8.1: Show appropriate progress indicators
   */
  showProgress(message) {
    this.info(`Progress: ${message}`);
    return vscode2.window.withProgress(
      {
        location: vscode2.ProgressLocation.Notification,
        title: message,
        cancellable: false
      },
      async () => {
      }
    );
  }
  /**
   * Show a progress notification with cancellation support
   * Requirement 8.1: Show appropriate progress indicators
   */
  showProgressWithCancel(message, cancellable = true) {
    this.info(`Progress (cancellable): ${message}`);
    return vscode2.window.withProgress(
      {
        location: vscode2.ProgressLocation.Notification,
        title: message,
        cancellable
      },
      async (progress, token) => {
        return new Promise((resolve, reject) => {
          if (token.isCancellationRequested) {
            reject(new Error("Operation cancelled by user"));
          }
          resolve();
        });
      }
    );
  }
  /**
   * Show a success notification
   * Requirement 8.2: Show success notifications with descriptive messages
   */
  showSuccess(message) {
    vscode2.window.showInformationMessage(message);
    this.info(`SUCCESS: ${message}`);
  }
  /**
   * Show an error notification
   * Requirement 8.3: Show error notifications with specific error details
   */
  showError(message, error) {
    let errorMessage = message;
    if (error) {
      errorMessage += ` (${error.message})`;
    }
    vscode2.window.showErrorMessage(errorMessage);
    this.error(`USER ERROR: ${message}`, error);
  }
  /**
   * Show a warning notification
   * Additional helper for user feedback
   */
  showWarning(message) {
    vscode2.window.showWarningMessage(message);
    this.info(`WARNING: ${message}`);
  }
  /**
   * Show and focus the output channel
   * Requirement 6.4: Open and focus the DroidBridge Logs OutputChannel
   */
  show() {
    this.outputChannel.show();
  }
  /**
   * Clear all logs from the output channel
   */
  clear() {
    this.outputChannel.clear();
    this.info("Log cleared");
  }
  /**
   * Dispose of the output channel
   */
  dispose() {
    this.outputChannel.dispose();
  }
};

// src/providers/sidebarProvider.ts
var vscode3 = __toESM(require("vscode"));
var DroidBridgeSidebarProvider = class {
  _onDidChangeTreeData = new vscode3.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  connectionStatus = false;
  scrcpyStatus = false;
  /**
   * Get the tree item representation of an element
   */
  getTreeItem(element) {
    const item = new vscode3.TreeItem(element.label, vscode3.TreeItemCollapsibleState.None);
    if (element.icon) {
      item.iconPath = new vscode3.ThemeIcon(element.icon);
    }
    if (element.command) {
      item.command = {
        command: element.command,
        title: element.label
      };
    }
    return item;
  }
  /**
   * Get the children of an element (or root elements if element is undefined)
   */
  getChildren(element) {
    if (!element) {
      return Promise.resolve([
        {
          id: "connect-section",
          label: "Connect",
          type: "section",
          icon: "plug"
        },
        {
          id: "scrcpy-section",
          label: "Scrcpy",
          type: "section",
          icon: "device-mobile"
        }
      ]);
    }
    if (element.id === "connect-section") {
      return Promise.resolve([
        {
          id: "connection-status",
          label: this.connectionStatus ? "\u2705 Connected" : "\u274C Disconnected",
          type: "status"
        },
        {
          id: "connect-button",
          label: "Connect Device",
          type: "button",
          command: "droidbridge.connectDevice",
          icon: "plug"
        },
        {
          id: "disconnect-button",
          label: "Disconnect Device",
          type: "button",
          command: "droidbridge.disconnectDevice",
          icon: "debug-disconnect"
        }
      ]);
    }
    if (element.id === "scrcpy-section") {
      return Promise.resolve([
        {
          id: "scrcpy-status",
          label: this.scrcpyStatus ? "\u25B6\uFE0F Running" : "\u23F9\uFE0F Stopped",
          type: "status"
        },
        {
          id: "launch-scrcpy-button",
          label: "Launch Scrcpy",
          type: "button",
          command: "droidbridge.launchScrcpy",
          icon: "play"
        },
        {
          id: "stop-scrcpy-button",
          label: "Stop Scrcpy",
          type: "button",
          command: "droidbridge.stopScrcpy",
          icon: "stop"
        }
      ]);
    }
    return Promise.resolve([]);
  }
  /**
   * Refresh the tree view
   */
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  /**
   * Update the connection status and refresh the view
   */
  updateConnectionStatus(connected) {
    this.connectionStatus = connected;
    this.refresh();
  }
  /**
   * Update the scrcpy status and refresh the view
   */
  updateScrcpyStatus(running) {
    this.scrcpyStatus = running;
    this.refresh();
  }
};

// src/extension.ts
var extensionState;
var logger;
var commandManager;
var processManager;
var configManager;
var binaryManager;
var sidebarProvider;
function activate(context) {
  logger = new Logger();
  logger.info("DroidBridge extension is activating...");
  try {
    configManager = new ConfigManager();
    binaryManager = new BinaryManager(context.extensionPath, configManager);
    processManager = new ProcessManager();
    commandManager = new CommandManager();
    sidebarProvider = new DroidBridgeSidebarProvider();
    extensionState = {
      connection: {
        connected: false
      },
      scrcpy: {
        running: false
      },
      initialized: false,
      binariesValidated: false
    };
    vscode4.window.registerTreeDataProvider("droidbridge-sidebar", sidebarProvider);
    commandManager.registerCommands(context);
    const configDisposable = configManager.onConfigurationChanged(() => {
      logger.info("Configuration changed, refreshing extension state");
      sidebarProvider.refresh();
    });
    context.subscriptions.push(
      configDisposable,
      logger
    );
    extensionState.initialized = true;
    logger.info("DroidBridge extension activated successfully");
  } catch (error) {
    logger.error("Failed to activate DroidBridge extension", error);
    vscode4.window.showErrorMessage("Failed to activate DroidBridge extension. Check the logs for details.");
  }
}
async function deactivate() {
  if (logger) {
    logger.info("DroidBridge extension is deactivating...");
  }
  try {
    if (processManager) {
      await processManager.cleanup();
    }
    if (logger) {
      logger.info("DroidBridge extension deactivated successfully");
      logger.dispose();
    }
  } catch (error) {
    console.error("Error during extension deactivation:", error);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
