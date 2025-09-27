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
var vscode6 = __toESM(require("vscode"));

// src/managers/commandManager.ts
var vscode2 = __toESM(require("vscode"));

// src/utils/errorHandler.ts
var vscode = __toESM(require("vscode"));
var ErrorHandler = class {
  logger;
  activeProgressOperations = /* @__PURE__ */ new Map();
  constructor(logger2) {
    this.logger = logger2;
  }
  /**
   * Handle configuration-related errors
   * Requirement 8.4: Handle invalid inputs
   */
  handleConfigurationError(error, setting) {
    const errorInfo = {
      category: "configuration" /* CONFIGURATION */,
      severity: "medium" /* MEDIUM */,
      message: `Configuration error${setting ? ` in ${setting}` : ""}`,
      userMessage: "Invalid configuration detected",
      suggestedActions: [
        "Check your extension settings",
        "Verify IP address and port format",
        "Reset to default values if needed"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    if (error.message.includes("IP address")) {
      errorInfo.userMessage = "Invalid IP address format";
      errorInfo.suggestedActions = [
        "Use format: 192.168.1.100 or localhost",
        "Check your device's IP address in settings",
        "Ensure device is on the same network"
      ];
    } else if (error.message.includes("port")) {
      errorInfo.userMessage = "Invalid port number";
      errorInfo.suggestedActions = [
        "Use a port number between 1 and 65535",
        "Common ADB ports: 5555, 5037",
        "Check your device's wireless debugging port"
      ];
    } else if (error.message.includes("binary") || error.message.includes("path")) {
      errorInfo.category = "binary" /* BINARY */;
      errorInfo.userMessage = "Binary path configuration error";
      errorInfo.suggestedActions = [
        "Check if custom binary paths exist",
        "Verify file permissions",
        "Reset to use bundled binaries"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle connection-related errors
   * Requirement 8.5: Handle offline devices and network issues
   */
  handleConnectionError(error, context) {
    const target = context ? `${context.ip}:${context.port}` : "device";
    const errorInfo = {
      category: "connection" /* CONNECTION */,
      severity: "high" /* HIGH */,
      message: `Connection failed to ${target}`,
      userMessage: "Failed to connect to Android device",
      suggestedActions: [
        "Check device IP address and port",
        "Ensure device is on the same network",
        "Enable wireless debugging on device",
        "Try connecting via USB first"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes("connection refused")) {
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Device refused connection";
      errorInfo.suggestedActions = [
        "Enable wireless debugging on your device",
        "Check if the port is correct",
        "Restart ADB on your device",
        "Try pairing the device first"
      ];
    } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      errorInfo.severity = "medium" /* MEDIUM */;
      errorInfo.userMessage = "Connection timeout";
      errorInfo.suggestedActions = [
        "Check network connectivity",
        "Move device closer to router",
        "Restart wireless debugging",
        "Try a different network"
      ];
    } else if (errorMessage.includes("no route to host")) {
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Device not reachable";
      errorInfo.suggestedActions = [
        "Verify the IP address is correct",
        "Check if device is on the same network",
        "Ping the device to test connectivity",
        "Check firewall settings"
      ];
    } else if (errorMessage.includes("unauthorized")) {
      errorInfo.severity = "medium" /* MEDIUM */;
      errorInfo.userMessage = "Device authorization required";
      errorInfo.suggestedActions = [
        "Accept debugging authorization on device",
        "Check device screen for permission dialog",
        "Try connecting via USB first",
        "Clear ADB keys and reconnect"
      ];
    } else if (errorMessage.includes("offline")) {
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Device is offline";
      errorInfo.suggestedActions = [
        "Check device connection",
        "Restart wireless debugging",
        "Reconnect device to network",
        "Try USB connection"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle process execution errors
   * Requirement 8.6: Handle process failures
   */
  handleProcessError(error, processName, context) {
    const errorInfo = {
      category: "process" /* PROCESS */,
      severity: "high" /* HIGH */,
      message: `${processName} process failed`,
      userMessage: `Failed to execute ${processName}`,
      suggestedActions: [
        "Check if binaries are properly installed",
        "Verify file permissions",
        "Try restarting the extension",
        "Check the logs for more details"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    if (processName.toLowerCase().includes("adb")) {
      errorInfo.userMessage = "ADB command failed";
      errorInfo.suggestedActions = [
        "Check if ADB is properly installed",
        "Verify device connection",
        "Restart ADB server",
        "Check device authorization"
      ];
    } else if (processName.toLowerCase().includes("scrcpy")) {
      errorInfo.userMessage = "Screen mirroring failed";
      if (error.message.includes("already running")) {
        errorInfo.severity = "medium" /* MEDIUM */;
        errorInfo.userMessage = "Screen mirroring already active";
        errorInfo.suggestedActions = [
          "Stop the current scrcpy instance first",
          "Check for existing scrcpy windows",
          "Wait a moment and try again"
        ];
      } else if (error.message.includes("device not found")) {
        errorInfo.severity = "high" /* HIGH */;
        errorInfo.userMessage = "No device found for screen mirroring";
        errorInfo.suggestedActions = [
          "Connect to device first",
          "Check device connection status",
          "Enable USB debugging",
          "Try reconnecting the device"
        ];
      } else {
        errorInfo.suggestedActions = [
          "Check if scrcpy is properly installed",
          "Verify device supports screen mirroring",
          "Try connecting device via USB",
          "Check device permissions"
        ];
      }
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle system-level errors
   */
  handleSystemError(error, context) {
    const errorInfo = {
      category: "system" /* SYSTEM */,
      severity: "critical" /* CRITICAL */,
      message: `System error${context ? ` in ${context}` : ""}`,
      userMessage: "System error occurred",
      suggestedActions: [
        "Restart VSCode",
        "Check system resources",
        "Update the extension",
        "Report the issue if it persists"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    if (error.message.includes("permission")) {
      errorInfo.category = "binary" /* BINARY */;
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Permission denied";
      errorInfo.suggestedActions = [
        "Check file permissions",
        "Run VSCode with appropriate permissions",
        "Verify binary executable permissions",
        "Check antivirus software"
      ];
    } else if (error.message.includes("ENOENT") || error.message.includes("not found")) {
      errorInfo.category = "binary" /* BINARY */;
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Required file not found";
      errorInfo.suggestedActions = [
        "Reinstall the extension",
        "Check if binaries are present",
        "Verify installation integrity",
        "Check custom binary paths"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle validation errors
   * Requirement 8.4: Handle invalid inputs
   */
  handleValidationError(field, value, expectedFormat) {
    const errorInfo = {
      category: "validation" /* VALIDATION */,
      severity: "medium" /* MEDIUM */,
      message: `Validation failed for ${field}`,
      userMessage: `Invalid ${field} format`,
      suggestedActions: [
        expectedFormat ? `Use format: ${expectedFormat}` : "Check the input format",
        "Refer to documentation for examples",
        "Use default values if unsure"
      ],
      technicalDetails: `Invalid value: ${value}`
    };
    if (field.toLowerCase().includes("ip")) {
      errorInfo.suggestedActions = [
        "Use format: 192.168.1.100",
        'Use "localhost" for local connections',
        "Check device network settings"
      ];
    } else if (field.toLowerCase().includes("port")) {
      errorInfo.suggestedActions = [
        "Use a number between 1 and 65535",
        "Common ADB port: 5555",
        "Check device wireless debugging settings"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Show progress indicator for long-running operations
   * Requirement 8.1: Show appropriate progress indicators
   */
  async showProgress(operation, context, operationId) {
    if (operationId && this.activeProgressOperations.has(operationId)) {
      const existingToken = this.activeProgressOperations.get(operationId);
      existingToken?.cancel();
      this.activeProgressOperations.delete(operationId);
    }
    const tokenSource = new vscode.CancellationTokenSource();
    if (operationId) {
      this.activeProgressOperations.set(operationId, tokenSource);
    }
    try {
      this.logger.info(`Starting progress operation: ${context.title}`);
      const result = await vscode.window.withProgress(
        {
          location: context.location,
          title: context.title,
          cancellable: context.cancellable
        },
        async (progress, token) => {
          if (token.isCancellationRequested || tokenSource.token.isCancellationRequested) {
            throw new Error("Operation cancelled by user");
          }
          return await operation(progress, token);
        }
      );
      this.logger.info(`Progress operation completed: ${context.title}`);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info(`Progress operation cancelled: ${context.title}`);
        this.showWarning("Operation cancelled by user");
      } else {
        this.logger.error(`Progress operation failed: ${context.title}`, error instanceof Error ? error : void 0);
      }
      throw error;
    } finally {
      if (operationId) {
        this.activeProgressOperations.delete(operationId);
      }
      tokenSource.dispose();
    }
  }
  /**
   * Cancel a specific progress operation
   */
  cancelProgress(operationId) {
    const tokenSource = this.activeProgressOperations.get(operationId);
    if (tokenSource) {
      tokenSource.cancel();
      this.activeProgressOperations.delete(operationId);
      this.logger.info(`Cancelled progress operation: ${operationId}`);
    }
  }
  /**
   * Cancel all active progress operations
   */
  cancelAllProgress() {
    for (const [operationId, tokenSource] of this.activeProgressOperations) {
      tokenSource.cancel();
      this.logger.info(`Cancelled progress operation: ${operationId}`);
    }
    this.activeProgressOperations.clear();
  }
  /**
   * Show success notification with consistent formatting
   * Requirement 8.2: Show success notifications with descriptive messages
   */
  showSuccess(message, details) {
    const fullMessage = details ? `${message} - ${details}` : message;
    this.logger.showSuccess(fullMessage);
  }
  /**
   * Show error notification with user-friendly message and actions
   * Requirement 8.3: Show error notifications with specific error details
   */
  showError(message, actions) {
    this.logger.showError(message);
    if (actions && actions.length > 0) {
      const actionMessage = `Suggested actions: ${actions.join(", ")}`;
      this.logger.info(actionMessage);
    }
  }
  /**
   * Show warning notification
   */
  showWarning(message) {
    this.logger.showWarning(message);
  }
  /**
   * Show information notification
   */
  showInfo(message) {
    vscode.window.showInformationMessage(message);
    this.logger.info(message);
  }
  /**
   * Show error with action buttons
   */
  async showErrorWithActions(message, actions) {
    const actionTitles = actions.map((a) => a.title);
    const selectedAction = await vscode.window.showErrorMessage(message, ...actionTitles);
    if (selectedAction) {
      const action = actions.find((a) => a.title === selectedAction);
      if (action) {
        try {
          await action.action();
        } catch (error) {
          this.logger.error("Action execution failed", error instanceof Error ? error : void 0);
        }
      }
    }
  }
  /**
   * Validate and handle edge cases for user inputs
   * Requirement 8.4: Handle edge cases like invalid inputs
   */
  validateAndHandleInput(input, type, fieldName) {
    if (!input || input.trim().length === 0) {
      const error = this.handleValidationError(fieldName, input, `Non-empty ${type}`);
      return { isValid: false, error };
    }
    const trimmedInput = input.trim();
    if (type === "ip") {
      if (trimmedInput === "localhost" || trimmedInput === "127.0.0.1") {
        return { isValid: true };
      }
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(trimmedInput)) {
        const error = this.handleValidationError(fieldName, trimmedInput, "192.168.1.100 or localhost");
        return { isValid: false, error };
      }
    } else if (type === "port") {
      const portNum = parseInt(trimmedInput, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        const error = this.handleValidationError(fieldName, trimmedInput, "1-65535");
        return { isValid: false, error };
      }
    }
    return { isValid: true };
  }
  /**
   * Handle multiple errors with categorization
   */
  handleMultipleErrors(errors, context) {
    const errorInfos = [];
    for (const error of errors) {
      let errorInfo;
      if (error.message.includes("connect") || error.message.includes("network")) {
        errorInfo = this.handleConnectionError(error);
      } else if (error.message.includes("config") || error.message.includes("setting")) {
        errorInfo = this.handleConfigurationError(error);
      } else if (error.message.includes("process") || error.message.includes("spawn")) {
        errorInfo = this.handleProcessError(error, context);
      } else {
        errorInfo = this.handleSystemError(error, context);
      }
      errorInfos.push(errorInfo);
    }
    if (errorInfos.length > 1) {
      const summary = `Multiple errors occurred in ${context}: ${errorInfos.length} issues found`;
      this.showError(summary);
    }
    return errorInfos;
  }
  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics() {
    return {
      ["configuration" /* CONFIGURATION */]: 0,
      ["connection" /* CONNECTION */]: 0,
      ["process" /* PROCESS */]: 0,
      ["system" /* SYSTEM */]: 0,
      ["validation" /* VALIDATION */]: 0,
      ["binary" /* BINARY */]: 0
    };
  }
  /**
   * Log error and show appropriate user notification
   */
  logAndNotifyError(errorInfo) {
    this.logger.error(
      `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`,
      errorInfo.originalError
    );
    switch (errorInfo.severity) {
      case "critical" /* CRITICAL */:
        this.showError(errorInfo.userMessage, errorInfo.suggestedActions);
        break;
      case "high" /* HIGH */:
        this.showError(errorInfo.userMessage, errorInfo.suggestedActions);
        break;
      case "medium" /* MEDIUM */:
        this.showWarning(errorInfo.userMessage);
        break;
      case "low" /* LOW */:
        this.showInfo(errorInfo.userMessage);
        break;
    }
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.cancelAllProgress();
  }
};

// src/managers/commandManager.ts
var CommandManager = class {
  processManager;
  configManager;
  logger;
  errorHandler;
  sidebarProvider;
  // Will be properly typed when sidebar provider is available
  statusUpdateInterval;
  constructor(processManager2, configManager2, logger2, sidebarProvider2) {
    this.processManager = processManager2;
    this.configManager = configManager2;
    this.logger = logger2;
    this.errorHandler = new ErrorHandler(logger2);
    this.sidebarProvider = sidebarProvider2;
    if (this.sidebarProvider) {
      this.startStatusUpdates();
    }
  }
  /**
   * Register all DroidBridge commands with VSCode
   * Requirement 4.6: Register all commands with VSCode
   */
  registerCommands(context) {
    const commands3 = [
      // Requirement 4.1: Connect to Device command
      vscode2.commands.registerCommand("droidbridge.connectDevice", (ip, port) => this.connectDeviceCommand(ip, port)),
      // Requirement 4.2: Disconnect Device command
      vscode2.commands.registerCommand("droidbridge.disconnectDevice", () => this.disconnectDeviceCommand()),
      // Requirement 4.3: Launch Scrcpy command
      vscode2.commands.registerCommand("droidbridge.launchScrcpy", () => this.launchScrcpyCommand()),
      // Launch Scrcpy Screen Off command (additional functionality)
      vscode2.commands.registerCommand("droidbridge.launchScrcpyScreenOff", () => this.launchScrcpyScreenOffCommand()),
      // Requirement 4.4: Stop Scrcpy command
      vscode2.commands.registerCommand("droidbridge.stopScrcpy", () => this.stopScrcpyCommand()),
      // Requirement 4.5: Show Logs command
      vscode2.commands.registerCommand("droidbridge.showLogs", () => this.showLogsCommand())
    ];
    commands3.forEach((command) => context.subscriptions.push(command));
    this.logger.info("All DroidBridge commands registered successfully");
  }
  /**
   * Connect to Android device via ADB
   * Requirement 4.1: Provide "DroidBridge: Connect to Device" command
   */
  async connectDeviceCommand(providedIp, providedPort) {
    try {
      this.logger.info("Connect Device command executed");
      const config = this.configManager.getConfigWithDefaults();
      let ip = providedIp || config.ip;
      let port = providedPort || config.port;
      if (!providedIp || !providedPort) {
        const inputIp = await vscode2.window.showInputBox({
          prompt: "Enter the IP address of your Android device",
          value: ip,
          validateInput: (value) => {
            if (!value.trim()) {
              return "IP address cannot be empty";
            }
            if (!this.configManager.validateIpAddress(value.trim())) {
              return "Please enter a valid IP address (e.g., 192.168.1.100 or localhost)";
            }
            return null;
          }
        });
        if (inputIp === void 0) {
          this.logger.info("Connect Device command cancelled by user");
          return;
        }
        ip = inputIp.trim();
        const inputPort = await vscode2.window.showInputBox({
          prompt: "Enter the port number for ADB connection",
          value: port,
          validateInput: (value) => {
            if (!value.trim()) {
              return "Port cannot be empty";
            }
            if (!this.configManager.validatePort(value.trim())) {
              return "Please enter a valid port number (1-65535)";
            }
            return null;
          }
        });
        if (inputPort === void 0) {
          this.logger.info("Connect Device command cancelled by user");
          return;
        }
        port = inputPort.trim();
      }
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, "ip", "IP address");
      if (!ipValidation.isValid) {
        return;
      }
      const portValidation = this.errorHandler.validateAndHandleInput(port, "port", "Port number");
      if (!portValidation.isValid) {
        return;
      }
      const progressContext = {
        title: `\u{1F50C} Connecting to ${ip}:${port}...`,
        cancellable: true,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error("Connection cancelled by user");
          }
          progress.report({ message: "Establishing connection..." });
          const success = await this.connectDevice(ip, port);
          if (success) {
            progress.report({ message: "Connected successfully", increment: 100 });
            this.errorHandler.showSuccess(`Device connected to ${ip}:${port}`);
          }
          return success;
        },
        progressContext,
        "connect-device"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Connect Device command cancelled by user");
        return;
      }
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown error"),
        "Connect Device command"
      );
    }
  }
  /**
   * Disconnect from Android device
   * Requirement 4.2: Provide "DroidBridge: Disconnect Device" command
   */
  async disconnectDeviceCommand() {
    try {
      this.logger.info("Disconnect Device command executed");
      if (!this.processManager.isDeviceConnected()) {
        this.logger.showWarning("No device is currently connected");
        return;
      }
      const connectionState = this.processManager.getConnectionState();
      const target = connectionState.deviceIp && connectionState.devicePort ? `${connectionState.deviceIp}:${connectionState.devicePort}` : "device";
      const progressContext = {
        title: `\u{1F50C} Disconnecting from ${target}...`,
        cancellable: false,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: "Disconnecting device..." });
          const success = await this.disconnectDevice();
          if (success) {
            progress.report({ message: "Disconnected successfully", increment: 100 });
            this.errorHandler.showSuccess(`Device disconnected from ${target}`);
          }
          return success;
        },
        progressContext,
        "disconnect-device"
      );
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown error"),
        "Disconnect Device command"
      );
    }
  }
  /**
   * Launch scrcpy screen mirroring
   * Requirement 4.3: Provide "DroidBridge: Launch Scrcpy" command
   */
  async launchScrcpyCommand() {
    try {
      this.logger.info("Launch Scrcpy command executed");
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return;
      }
      if (!this.processManager.isDeviceConnected()) {
        const shouldConnect = await vscode2.window.showWarningMessage(
          "No device is connected. Would you like to connect to a device first?",
          { title: "Connect Device" },
          { title: "Launch Anyway" }
        );
        if (shouldConnect?.title === "Connect Device") {
          await this.connectDeviceCommand();
          if (!this.processManager.isDeviceConnected()) {
            return;
          }
        }
      }
      const progressContext = {
        title: "\u{1F4F1} Launching scrcpy...",
        cancellable: true,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error("Scrcpy launch cancelled by user");
          }
          progress.report({ message: "Starting screen mirroring..." });
          const success = await this.launchScrcpy();
          if (success) {
            progress.report({ message: "Screen mirroring started", increment: 100 });
            this.errorHandler.showSuccess("Scrcpy launched successfully");
          }
          return success;
        },
        progressContext,
        "launch-scrcpy"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Launch Scrcpy command cancelled by user");
        return;
      }
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown error"),
        "scrcpy",
        "Launch Scrcpy command"
      );
    }
  }
  /**
   * Launch scrcpy with screen off functionality
   * Additional command for enhanced functionality
   */
  async launchScrcpyScreenOffCommand() {
    try {
      this.logger.info("Launch Scrcpy Screen Off command executed");
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return;
      }
      if (!this.processManager.isDeviceConnected()) {
        const shouldConnect = await vscode2.window.showWarningMessage(
          "No device is connected. Would you like to connect to a device first?",
          { title: "Connect Device" },
          { title: "Launch Anyway" }
        );
        if (shouldConnect?.title === "Connect Device") {
          await this.connectDeviceCommand();
          if (!this.processManager.isDeviceConnected()) {
            return;
          }
        }
      }
      const progressContext = {
        title: "\u{1F4F1} Launching scrcpy with screen off...",
        cancellable: true,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error("Scrcpy screen off launch cancelled by user");
          }
          progress.report({ message: "Starting screen mirroring with screen off..." });
          const success = await this.launchScrcpyScreenOff();
          if (success) {
            progress.report({ message: "Screen mirroring started with screen off", increment: 100 });
            this.errorHandler.showSuccess("Scrcpy launched successfully with screen off");
          }
          return success;
        },
        progressContext,
        "launch-scrcpy-screen-off"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Launch Scrcpy Screen Off command cancelled by user");
        return;
      }
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown error"),
        "scrcpy screen off",
        "Launch Scrcpy Screen Off command"
      );
    }
  }
  /**
   * Stop scrcpy screen mirroring
   * Requirement 4.4: Provide "DroidBridge: Stop Scrcpy" command
   */
  async stopScrcpyCommand() {
    try {
      this.logger.info("Stop Scrcpy command executed");
      if (!this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is not currently running");
        return;
      }
      const progressContext = {
        title: "\u{1F4F1} Stopping scrcpy...",
        cancellable: false,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: "Stopping screen mirroring..." });
          const success = await this.stopScrcpy();
          if (success) {
            progress.report({ message: "Screen mirroring stopped", increment: 100 });
            this.errorHandler.showSuccess("Scrcpy stopped successfully");
          }
          return success;
        },
        progressContext,
        "stop-scrcpy"
      );
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown error"),
        "scrcpy",
        "Stop Scrcpy command"
      );
    }
  }
  /**
   * Show the DroidBridge logs output channel
   * Requirement 4.5: Provide "DroidBridge: Show Logs" command
   */
  showLogsCommand() {
    try {
      this.logger.info("Show Logs command executed");
      this.logger.show();
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown error"),
        "Show Logs command"
      );
    }
  }
  /**
   * Connect to device with validation and error handling
   * Internal method used by command and sidebar
   */
  async connectDevice(ip, port) {
    const config = this.configManager.getConfigWithDefaults();
    const targetIp = ip || config.ip;
    const targetPort = port || config.port;
    try {
      const validation = this.configManager.validateConnection(targetIp, targetPort);
      if (!validation.isValid) {
        const errorMessage = `Invalid connection parameters: ${validation.errors.join(", ")}`;
        this.logger.showError(errorMessage);
        return false;
      }
      const success = await this.processManager.connectDevice(targetIp, targetPort);
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const connectionError = new Error(connectionState.connectionError || "Failed to connect to device");
        this.errorHandler.handleConnectionError(connectionError, { ip: targetIp, port: targetPort });
        if (this.sidebarProvider) {
          this.sidebarProvider.updateConnectionStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateConnectionStatus(true, targetIp, targetPort);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleConnectionError(
        error instanceof Error ? error : new Error("Unknown connection error"),
        { ip: targetIp, port: targetPort }
      );
      return false;
    }
  }
  /**
   * Disconnect from device with error handling
   * Internal method used by command and sidebar
   */
  async disconnectDevice() {
    try {
      const success = await this.processManager.disconnectDevice();
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const disconnectionError = new Error(connectionState.connectionError || "Failed to disconnect from device");
        this.errorHandler.handleConnectionError(disconnectionError);
        if (this.sidebarProvider) {
          this.sidebarProvider.updateConnectionStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateConnectionStatus(false);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleConnectionError(
        error instanceof Error ? error : new Error("Unknown disconnection error")
      );
      return false;
    }
  }
  /**
   * Launch scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async launchScrcpy() {
    try {
      if (this.processManager.isScrcpyRunning()) {
        const duplicateError = new Error("Scrcpy is already running");
        this.errorHandler.handleProcessError(duplicateError, "scrcpy");
        return false;
      }
      const process = await this.processManager.launchScrcpy();
      if (!process || !process.pid) {
        const processError = new Error("Failed to launch scrcpy - invalid process");
        this.errorHandler.handleProcessError(processError, "scrcpy");
        if (this.sidebarProvider) {
          this.sidebarProvider.updateScrcpyStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(true);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown scrcpy launch error"),
        "scrcpy"
      );
      return false;
    }
  }
  /**
   * Launch scrcpy with screen off functionality
   * Internal method used by command and sidebar
   */
  async launchScrcpyScreenOff() {
    try {
      if (this.processManager.isScrcpyRunning()) {
        const duplicateError = new Error("Scrcpy is already running");
        this.errorHandler.handleProcessError(duplicateError, "scrcpy screen off");
        return false;
      }
      const process = await this.processManager.launchScrcpyScreenOff();
      if (!process || !process.pid) {
        const processError = new Error("Failed to launch scrcpy with screen off - invalid process");
        this.errorHandler.handleProcessError(processError, "scrcpy screen off");
        if (this.sidebarProvider) {
          this.sidebarProvider.updateScrcpyStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(true);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown scrcpy screen off launch error"),
        "scrcpy screen off"
      );
      return false;
    }
  }
  /**
   * Stop scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async stopScrcpy() {
    try {
      const success = await this.processManager.stopScrcpy();
      if (!success) {
        const stopError = new Error("Failed to stop scrcpy");
        this.errorHandler.handleProcessError(stopError, "scrcpy");
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(false);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown scrcpy stop error"),
        "scrcpy"
      );
      return false;
    }
  }
  /**
   * Get current connection status for UI updates
   */
  isDeviceConnected() {
    return this.processManager.isDeviceConnected();
  }
  /**
   * Get current scrcpy status for UI updates
   */
  isScrcpyRunning() {
    return this.processManager.isScrcpyRunning();
  }
  /**
   * Get connection state for UI updates
   */
  getConnectionState() {
    return this.processManager.getConnectionState();
  }
  /**
   * Get scrcpy state for UI updates
   */
  getScrcpyState() {
    return this.processManager.getScrcpyState();
  }
  /**
   * Set the sidebar provider for real-time updates
   */
  setSidebarProvider(sidebarProvider2) {
    this.sidebarProvider = sidebarProvider2;
    if (!this.statusUpdateInterval) {
      this.startStatusUpdates();
    }
    this.updateSidebarState();
  }
  /**
   * Start periodic status updates to keep sidebar in sync
   */
  startStatusUpdates() {
    if (this.statusUpdateInterval) {
      return;
    }
    this.statusUpdateInterval = setInterval(() => {
      this.updateSidebarState();
    }, 2e3);
  }
  /**
   * Stop periodic status updates
   */
  stopStatusUpdates() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = void 0;
    }
  }
  /**
   * Update sidebar state with current process states
   */
  updateSidebarState() {
    if (!this.sidebarProvider) {
      return;
    }
    try {
      const connectionState = this.processManager.getConnectionState();
      const scrcpyState = this.processManager.getScrcpyState();
      this.sidebarProvider.synchronizeState(connectionState, scrcpyState);
    } catch (error) {
      this.logger.error("Failed to update sidebar state", error instanceof Error ? error : void 0);
    }
  }
  /**
   * Force immediate sidebar state update
   */
  refreshSidebarState() {
    this.updateSidebarState();
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.stopStatusUpdates();
    this.errorHandler.dispose();
  }
};

// src/managers/processManager.ts
var import_child_process = require("child_process");
var ProcessManager = class {
  scrcpyProcess = null;
  managedProcesses = /* @__PURE__ */ new Set();
  binaryManager;
  logger;
  errorHandler;
  connectionState;
  scrcpyState;
  constructor(binaryManager2, logger2) {
    this.binaryManager = binaryManager2;
    this.logger = logger2;
    this.errorHandler = new ErrorHandler(logger2);
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
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, "ip", "IP address");
      if (!ipValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: ipValidation.error?.userMessage || "Invalid IP address"
        };
        return false;
      }
      const portValidation = this.errorHandler.validateAndHandleInput(port, "port", "Port number");
      if (!portValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: portValidation.error?.userMessage || "Invalid port number"
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
var vscode3 = __toESM(require("vscode"));
var ConfigManager = class _ConfigManager {
  static CONFIG_SECTION = "droidbridge";
  static DEFAULT_IP = "192.168.1.100";
  static DEFAULT_PORT = "5555";
  /**
   * Get the default IP address for ADB connections
   */
  getDefaultIp() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const ip = config.get("defaultIp", _ConfigManager.DEFAULT_IP);
    return ip.trim() || _ConfigManager.DEFAULT_IP;
  }
  /**
   * Get the default port for ADB connections
   */
  getDefaultPort() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const port = config.get("defaultPort", _ConfigManager.DEFAULT_PORT);
    return port.trim() || _ConfigManager.DEFAULT_PORT;
  }
  /**
   * Get custom ADB binary path if configured
   */
  getCustomAdbPath() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const path2 = config.get("adbPath", "");
    return path2.trim() || void 0;
  }
  /**
   * Get custom scrcpy binary path if configured
   */
  getCustomScrcpyPath() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
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
    return vscode3.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(_ConfigManager.CONFIG_SECTION)) {
        callback();
      }
    });
  }
  /**
   * Update configuration value
   */
  async updateConfig(key, value, target = vscode3.ConfigurationTarget.Workspace) {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    await config.update(key, value, target);
  }
  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    await Promise.all([
      config.update("defaultIp", void 0, vscode3.ConfigurationTarget.Workspace),
      config.update("defaultPort", void 0, vscode3.ConfigurationTarget.Workspace),
      config.update("adbPath", void 0, vscode3.ConfigurationTarget.Workspace),
      config.update("scrcpyPath", void 0, vscode3.ConfigurationTarget.Workspace)
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
var vscode4 = __toESM(require("vscode"));
var Logger = class {
  outputChannel;
  logLevel = 1 /* INFO */;
  constructor() {
    this.outputChannel = vscode4.window.createOutputChannel("DroidBridge Logs");
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
    return vscode4.window.withProgress(
      {
        location: vscode4.ProgressLocation.Notification,
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
    return vscode4.window.withProgress(
      {
        location: vscode4.ProgressLocation.Notification,
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
    vscode4.window.showInformationMessage(message);
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
    vscode4.window.showErrorMessage(errorMessage);
    this.error(`USER ERROR: ${message}`, error);
  }
  /**
   * Show a warning notification
   * Additional helper for user feedback
   */
  showWarning(message) {
    vscode4.window.showWarningMessage(message);
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
var vscode5 = __toESM(require("vscode"));
var DroidBridgeSidebarProvider = class {
  constructor(_extensionUri, _context, configManager2) {
    this._extensionUri = _extensionUri;
    this._context = _context;
    this.configManager = configManager2;
    this.loadDefaultValues();
    this.setupConfigurationWatcher();
  }
  static viewType = "droidbridge.sidebar";
  _view;
  connectionStatus = false;
  scrcpyStatus = false;
  currentIp = "";
  currentPort = "";
  configManager;
  configChangeListener;
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
   * Resolves the webview view and sets up the content
   */
  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case "connectDevice":
            vscode5.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "disconnectDevice":
            vscode5.commands.executeCommand("droidbridge.disconnectDevice");
            break;
          case "launchScrcpy":
            vscode5.commands.executeCommand("droidbridge.launchScrcpy");
            break;
          case "launchScrcpyScreenOff":
            vscode5.commands.executeCommand("droidbridge.launchScrcpyScreenOff");
            break;
          case "stopScrcpy":
            vscode5.commands.executeCommand("droidbridge.stopScrcpy");
            break;
          case "showLogs":
            vscode5.commands.executeCommand("droidbridge.showLogs");
            break;
          case "ipChanged":
            this.currentIp = message.value;
            break;
          case "portChanged":
            this.currentPort = message.value;
            break;
        }
      },
      void 0,
      this._context.subscriptions
    );
  }
  /**
   * Generate the HTML content for the webview
   */
  _getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(vscode5.Uri.joinPath(this._extensionUri, "media", "main.js"));
    const styleResetUri = webview.asWebviewUri(vscode5.Uri.joinPath(this._extensionUri, "media", "reset.css"));
    const styleVSCodeUri = webview.asWebviewUri(vscode5.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
    const styleMainUri = webview.asWebviewUri(vscode5.Uri.joinPath(this._extensionUri, "media", "main.css"));
    const nonce = getNonce();
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>DroidBridge</title>
      </head>
      <body>
        <div class="container">
          <!-- Connect Section -->
          <div class="section">
            <div class="section-header">
              <span class="codicon codicon-plug"></span>
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
              <span class="codicon codicon-device-mobile"></span>
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
        currentPort: this.currentPort
      });
    }
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
  }
};
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

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
    sidebarProvider = new DroidBridgeSidebarProvider(vscode6.Uri.file(context.extensionPath), context, configManager);
    commandManager = new CommandManager(processManager, configManager, logger, sidebarProvider);
    commandManager.setSidebarProvider(sidebarProvider);
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
    const sidebarDisposable = vscode6.window.registerWebviewViewProvider(
      DroidBridgeSidebarProvider.viewType,
      sidebarProvider
    );
    commandManager.registerCommands(context);
    const configDisposable = configManager.onConfigurationChanged(() => {
      logger.info("Configuration changed, refreshing extension state");
      sidebarProvider.refresh();
    });
    context.subscriptions.push(
      sidebarDisposable,
      configDisposable,
      logger
    );
    extensionState.initialized = true;
    logger.info("DroidBridge extension activated successfully");
  } catch (error) {
    logger.error("Failed to activate DroidBridge extension", error);
    vscode6.window.showErrorMessage("Failed to activate DroidBridge extension. Check the logs for details.");
  }
}
async function deactivate() {
  if (logger) {
    logger.info("DroidBridge extension is deactivating...");
  }
  try {
    if (commandManager) {
      commandManager.dispose();
    }
    if (sidebarProvider) {
      sidebarProvider.dispose();
    }
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
