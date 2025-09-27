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
var import_child_process = require("child_process");
var ProcessManager = class {
  scrcpyProcess = null;
  managedProcesses = /* @__PURE__ */ new Set();
  binaryManager;
  logger;
  connectionState;
  scrcpyState;
  constructor(binaryManager2, logger2) {
    this.binaryManager = binaryManager2;
    this.logger = logger2;
    this.connectionState = {
      connected: false
    };
    this.scrcpyState = {
      running: false
    };
  }
  /**
   * Execute an ADB command with the given arguments
   */
  async executeAdbCommand(args) {
    const adbPath = this.binaryManager.getAdbPath();
    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      this.logger.info(`Executing ADB command: ${adbPath} ${args.join(" ")}`);
      const process = (0, import_child_process.spawn)(adbPath, args, {
        stdio: ["pipe", "pipe", "pipe"]
      });
      this.managedProcesses.add(process);
      process.stdout?.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        this.logger.logProcessOutput("adb", output);
      });
      process.stderr?.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        this.logger.logProcessOutput("adb", output);
      });
      process.on("close", (code) => {
        this.managedProcesses.delete(process);
        const exitCode = code ?? -1;
        const success = exitCode === 0;
        const result = {
          success,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode
        };
        this.logger.info(`ADB command completed with exit code: ${exitCode}`);
        resolve(result);
      });
      process.on("error", (error) => {
        this.managedProcesses.delete(process);
        this.logger.error(`ADB process error: ${error.message}`, error);
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: -1
        });
      });
    });
  }
  /**
   * Connect to an Android device via ADB using IP and port
   */
  async connectDevice(ip, port) {
    try {
      if (!this.isValidIpAddress(ip)) {
        const error = `Invalid IP address format: ${ip}`;
        this.logger.error(error);
        this.connectionState = {
          connected: false,
          connectionError: error
        };
        return false;
      }
      if (!this.isValidPort(port)) {
        const error = `Invalid port number: ${port}. Port must be between 1 and 65535.`;
        this.logger.error(error);
        this.connectionState = {
          connected: false,
          connectionError: error
        };
        return false;
      }
      const target = `${ip}:${port}`;
      this.logger.info(`Attempting to connect to device at ${target}`);
      const result = await this.executeAdbCommand(["connect", target]);
      if (result.success) {
        const isConnected = this.parseConnectResult(result.stdout, target);
        if (isConnected) {
          this.connectionState = {
            connected: true,
            deviceIp: ip,
            devicePort: port,
            lastConnected: /* @__PURE__ */ new Date(),
            connectionError: void 0
          };
          this.logger.info(`Successfully connected to device at ${target}`);
          return true;
        } else {
          const error = this.extractConnectionError(result.stdout, result.stderr);
          this.connectionState = {
            connected: false,
            connectionError: error
          };
          this.logger.error(`Failed to connect to device at ${target}: ${error}`);
          return false;
        }
      } else {
        const error = this.extractConnectionError(result.stdout, result.stderr);
        this.connectionState = {
          connected: false,
          connectionError: error
        };
        this.logger.error(`ADB connect command failed: ${error}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connection attempt failed: ${errorMessage}`, error instanceof Error ? error : void 0);
      this.connectionState = {
        connected: false,
        connectionError: errorMessage
      };
      return false;
    }
  }
  /**
   * Disconnect from the currently connected Android device
   */
  async disconnectDevice() {
    try {
      if (!this.connectionState.connected || !this.connectionState.deviceIp || !this.connectionState.devicePort) {
        this.logger.info("No device currently connected");
        return true;
      }
      const target = `${this.connectionState.deviceIp}:${this.connectionState.devicePort}`;
      this.logger.info(`Attempting to disconnect from device at ${target}`);
      const result = await this.executeAdbCommand(["disconnect", target]);
      if (result.success) {
        this.connectionState = {
          connected: false,
          connectionError: void 0
        };
        this.logger.info(`Successfully disconnected from device at ${target}`);
        return true;
      } else {
        const error = this.extractConnectionError(result.stdout, result.stderr);
        this.logger.error(`Failed to disconnect from device: ${error}`);
        this.connectionState = {
          connected: false,
          connectionError: error
        };
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Disconnect attempt failed: ${errorMessage}`, error instanceof Error ? error : void 0);
      this.connectionState = {
        connected: false,
        connectionError: errorMessage
      };
      return false;
    }
  }
  /**
   * Check if a device is currently connected and reachable
   */
  async checkDeviceConnectivity() {
    try {
      this.logger.info("Checking device connectivity");
      const result = await this.executeAdbCommand(["devices"]);
      if (!result.success) {
        this.logger.error("Failed to check device connectivity");
        this.connectionState = {
          ...this.connectionState,
          connected: false,
          connectionError: "Failed to query ADB devices"
        };
        return false;
      }
      const isConnected = this.parseDevicesOutput(result.stdout);
      if (isConnected !== this.connectionState.connected) {
        this.connectionState = {
          ...this.connectionState,
          connected: isConnected,
          connectionError: isConnected ? void 0 : "Device no longer connected"
        };
        this.logger.info(`Device connectivity status updated: ${isConnected ? "connected" : "disconnected"}`);
      }
      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connectivity check failed: ${errorMessage}`, error instanceof Error ? error : void 0);
      this.connectionState = {
        ...this.connectionState,
        connected: false,
        connectionError: errorMessage
      };
      return false;
    }
  }
  /**
   * Get the current connection state
   */
  getConnectionState() {
    return { ...this.connectionState };
  }
  /**
   * Check if a device is currently connected
   */
  isDeviceConnected() {
    return this.connectionState.connected;
  }
  /**
   * Launch scrcpy with optional configuration
   */
  async launchScrcpy(options) {
    return this.launchScrcpyWithCustomArgs(options);
  }
  /**
   * Stop the current scrcpy process
   */
  async stopScrcpy() {
    if (!this.scrcpyProcess) {
      this.scrcpyState = {
        running: false
      };
      return true;
    }
    return new Promise((resolve) => {
      const process = this.scrcpyProcess;
      this.logger.info("Stopping scrcpy process");
      const cleanup = () => {
        this.managedProcesses.delete(process);
        this.scrcpyProcess = null;
        this.scrcpyState = {
          running: false
        };
        this.logger.info("Scrcpy process stopped successfully");
        resolve(true);
      };
      const timeout = setTimeout(() => {
        if (process && !process.killed) {
          this.logger.info("Force killing scrcpy process");
          process.kill("SIGKILL");
        }
        cleanup();
      }, 3e3);
      process.on("close", () => {
        clearTimeout(timeout);
        cleanup();
      });
      if (process && !process.killed) {
        process.kill("SIGTERM");
      } else {
        clearTimeout(timeout);
        cleanup();
      }
    });
  }
  /**
   * Check if scrcpy is currently running
   */
  isScrcpyRunning() {
    const processRunning = this.scrcpyProcess !== null && !this.scrcpyProcess.killed;
    if (this.scrcpyState.running !== processRunning) {
      this.scrcpyState = {
        ...this.scrcpyState,
        running: processRunning
      };
    }
    return processRunning;
  }
  /**
   * Get the current scrcpy state
   */
  getScrcpyState() {
    this.isScrcpyRunning();
    return { ...this.scrcpyState };
  }
  /**
   * Get scrcpy process uptime in milliseconds
   */
  getScrcpyUptime() {
    if (!this.isScrcpyRunning() || !this.scrcpyState.startTime) {
      return null;
    }
    return Date.now() - this.scrcpyState.startTime.getTime();
  }
  /**
   * Monitor scrcpy process health and update state accordingly
   */
  monitorScrcpyProcess() {
    if (!this.scrcpyProcess) {
      return;
    }
    const process = this.scrcpyProcess;
    if (process.killed || process.exitCode !== null) {
      this.logger.info("Detected scrcpy process termination during monitoring");
      this.managedProcesses.delete(process);
      this.scrcpyProcess = null;
      this.scrcpyState = {
        running: false
      };
    }
  }
  /**
   * Clean up all managed processes
   */
  async cleanup() {
    this.logger.info("Cleaning up all managed processes");
    const cleanupPromises = [];
    if (this.isScrcpyRunning()) {
      cleanupPromises.push(this.stopScrcpy().then(() => {
      }));
    }
    for (const process of this.managedProcesses) {
      if (!process.killed) {
        cleanupPromises.push(
          new Promise((resolve) => {
            process.on("close", () => resolve());
            process.kill("SIGTERM");
            setTimeout(() => {
              if (!process.killed) {
                process.kill("SIGKILL");
              }
              resolve();
            }, 2e3);
          })
        );
      }
    }
    await Promise.all(cleanupPromises);
    this.managedProcesses.clear();
    this.scrcpyProcess = null;
    this.scrcpyState = {
      running: false
    };
    this.logger.info("Process cleanup completed");
  }
  /**
   * Validate IP address format
   */
  isValidIpAddress(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }
  /**
   * Validate port number
   */
  isValidPort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  }
  /**
   * Parse the result of ADB connect command to determine if connection was successful
   */
  parseConnectResult(stdout, target) {
    const output = stdout.toLowerCase();
    if (output.includes("connected to") || output.includes("already connected")) {
      return true;
    }
    if (output.includes("failed to connect") || output.includes("cannot connect") || output.includes("connection refused") || output.includes("no route to host") || output.includes("timeout")) {
      return false;
    }
    return false;
  }
  /**
   * Parse ADB devices output to check if our target device is connected
   */
  parseDevicesOutput(stdout) {
    if (!this.connectionState.deviceIp || !this.connectionState.devicePort) {
      return false;
    }
    const target = `${this.connectionState.deviceIp}:${this.connectionState.devicePort}`;
    const lines = stdout.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith(target) && trimmedLine.includes("device")) {
        return true;
      }
    }
    return false;
  }
  /**
   * Extract meaningful error message from ADB command output
   */
  extractConnectionError(stdout, stderr) {
    const output = (stdout + " " + stderr).toLowerCase();
    if (output.includes("connection refused")) {
      return "Connection refused. Make sure the device is reachable and ADB debugging is enabled.";
    }
    if (output.includes("no route to host")) {
      return "No route to host. Check the IP address and network connectivity.";
    }
    if (output.includes("timeout") || output.includes("timed out")) {
      return "Connection timeout. The device may be unreachable or busy.";
    }
    if (output.includes("failed to connect")) {
      return "Failed to connect to device. Verify the IP address and port are correct.";
    }
    if (output.includes("cannot connect")) {
      return "Cannot connect to device. Check if wireless debugging is enabled.";
    }
    if (output.includes("device offline")) {
      return "Device is offline. Try reconnecting the device.";
    }
    if (output.includes("unauthorized")) {
      return "Device unauthorized. Please accept the debugging authorization on your device.";
    }
    const errorOutput = stderr.trim() || stdout.trim();
    return errorOutput || "Unknown connection error occurred.";
  }
  /**
   * Launch scrcpy with screen off functionality
   */
  async launchScrcpyScreenOff(options) {
    const screenOffOptions = {
      ...options
    };
    this.logger.info("Launching scrcpy with screen off functionality");
    return this.launchScrcpyWithCustomArgs(screenOffOptions, ["--turn-screen-off"]);
  }
  /**
   * Launch scrcpy with custom additional arguments
   */
  async launchScrcpyWithCustomArgs(options, additionalArgs = []) {
    if (this.isScrcpyRunning()) {
      throw new Error(
        "Scrcpy is already running. Stop the current instance first."
      );
    }
    const scrcpyPath = this.binaryManager.getScrcpyPath();
    const args = [...this.buildScrcpyArgs(options), ...additionalArgs];
    this.logger.info(`Launching scrcpy: ${scrcpyPath} ${args.join(" ")}`);
    this.scrcpyState = {
      running: false,
      startTime: /* @__PURE__ */ new Date(),
      options: options ? { ...options } : void 0
    };
    return new Promise((resolve, reject) => {
      const process = (0, import_child_process.spawn)(scrcpyPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        detached: false
      });
      this.scrcpyProcess = process;
      this.managedProcesses.add(process);
      let hasResolved = false;
      const onData = (data) => {
        const output = data.toString();
        this.logger.logProcessOutput("scrcpy", output);
        if (!hasResolved) {
          hasResolved = true;
          this.scrcpyState = {
            running: true,
            process,
            startTime: this.scrcpyState.startTime,
            options: this.scrcpyState.options
          };
          this.logger.info("Scrcpy process started successfully");
          resolve(process);
        }
      };
      process.stdout?.on("data", onData);
      process.stderr?.on("data", onData);
      process.on("close", (code) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
          this.scrcpyState = {
            running: false
          };
        }
        this.logger.info(`Scrcpy process closed with exit code: ${code}`);
      });
      process.on("error", (error) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
          this.scrcpyState = {
            running: false
          };
        }
        this.logger.error(`Scrcpy process error: ${error.message}`, error);
        if (!hasResolved) {
          hasResolved = true;
          reject(error);
        }
      });
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          this.scrcpyState = {
            running: false
          };
          reject(new Error("Scrcpy failed to start within timeout period"));
        }
      }, 5e3);
    });
  }
  /**
   * Build command line arguments for scrcpy based on options
   */
  buildScrcpyArgs(options) {
    const args = [];
    if (options?.bitrate) {
      args.push("--bit-rate", options.bitrate.toString());
    }
    if (options?.maxSize) {
      args.push("--max-size", options.maxSize.toString());
    }
    if (options?.crop) {
      args.push("--crop", options.crop);
    }
    if (options?.recordFile) {
      args.push("--record", options.recordFile);
    }
    return args;
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
    processManager = new ProcessManager(binaryManager, logger);
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
