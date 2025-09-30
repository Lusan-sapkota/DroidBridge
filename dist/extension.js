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

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate,
  getExtensionState: () => getExtensionState,
  getLogger: () => getLogger,
  isExtensionInitialized: () => isExtensionInitialized
});
module.exports = __toCommonJS(extension_exports);

// src/utils/errorHandler.ts
var vscode = __toESM(require("vscode"));
var ErrorCategory = /* @__PURE__ */ ((ErrorCategory2) => {
  ErrorCategory2["CONFIGURATION"] = "configuration";
  ErrorCategory2["CONNECTION"] = "connection";
  ErrorCategory2["PROCESS"] = "process";
  ErrorCategory2["SYSTEM"] = "system";
  ErrorCategory2["VALIDATION"] = "validation";
  ErrorCategory2["BINARY"] = "binary";
  ErrorCategory2["UNKNOWN"] = "unknown";
  return ErrorCategory2;
})(ErrorCategory || {});
var ErrorSeverity = /* @__PURE__ */ ((ErrorSeverity2) => {
  ErrorSeverity2["LOW"] = "low";
  ErrorSeverity2["MEDIUM"] = "medium";
  ErrorSeverity2["HIGH"] = "high";
  ErrorSeverity2["CRITICAL"] = "critical";
  return ErrorSeverity2;
})(ErrorSeverity || {});
var _ErrorHandler = class _ErrorHandler {
  logger;
  activeProgressOperations = /* @__PURE__ */ new Map();
  errorStats = /* @__PURE__ */ new Map();
  config = {
    showNotifications: true,
    logLevel: "info"
  };
  constructor(logger2) {
    this.logger = logger2;
    Object.values(ErrorCategory).forEach((category) => {
      this.errorStats.set(category, 0);
    });
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
      if (error.message.includes("already running")) {
        errorInfo.severity = "medium" /* MEDIUM */;
        errorInfo.userMessage = "Screen mirroring already active";
        errorInfo.suggestedActions = [
          "Stop the current scrcpy instance first",
          "Check for existing scrcpy windows",
          "Wait a moment and try again"
        ];
      } else if (error.message.toLowerCase().includes("device not found")) {
        errorInfo.severity = "high" /* HIGH */;
        errorInfo.userMessage = "No device found for screen mirroring";
        errorInfo.suggestedActions = [
          "Connect to device first",
          "Check device connection status",
          "Enable USB debugging",
          "Try reconnecting the device"
        ];
      } else {
        errorInfo.userMessage = "Screen mirroring failed";
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
    if (error.message.toLowerCase().includes("permission")) {
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
      existingToken == null ? void 0 : existingToken.cancel();
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
      if (error.message.includes("Connection failed") || error.message.includes("network")) {
        errorInfo = this.handleConnectionError(error);
      } else if (error.message.includes("Invalid configuration") || error.message.includes("config")) {
        errorInfo = this.handleConfigurationError(error);
      } else if (error.message.includes("Process spawn error") || error.message.includes("spawn")) {
        errorInfo = this.handleSystemError(error, context);
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
   * Categorize error based on its message and type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    if (message.includes("connection") || message.includes("network") || message.includes("timeout") || message.includes("refused") || message.includes("unreachable") || message.includes("offline") || message.includes("no route to host") || message.includes("timed out")) {
      return "connection" /* CONNECTION */;
    }
    if (message.includes("permission") || message.includes("enoent") || message.includes("eacces") || message.includes("binary") || message.includes("not found") || message.includes("exec format error") || message.includes("operation not permitted")) {
      return "system" /* SYSTEM */;
    }
    if (message.includes("spawn") || message.includes("process") || message.includes("exited") || message.includes("emfile") || message.includes("crashed") || message.includes("memory")) {
      return "process" /* PROCESS */;
    }
    if (message.includes("invalid") || message.includes("format") || message.includes("port out of range") || message.includes("config") || message.includes("setting")) {
      return "configuration" /* CONFIGURATION */;
    }
    return "unknown" /* UNKNOWN */;
  }
  /**
   * Assess error severity based on its impact
   */
  assessSeverity(error) {
    const message = error.message.toLowerCase();
    if (message.includes("spawn enoent") || message.includes("corrupted") || message.includes("memory") || message.includes("exec format error")) {
      return "critical" /* CRITICAL */;
    }
    if (message.includes("process exited") || message.includes("device not found") || message.includes("unauthorized") || message.includes("enoent") || message.includes("no such file") || message.includes("eacces") || message.includes("permission denied")) {
      return "high" /* HIGH */;
    }
    if (message.includes("timeout") || message.includes("timed out") || message.includes("already running") || message.includes("invalid format") || message.includes("network unreachable")) {
      return "medium" /* MEDIUM */;
    }
    return "low" /* LOW */;
  }
  /**
   * Generate user-friendly error message
   */
  getUserFriendlyMessage(error) {
    const category = this.categorizeError(error);
    const message = error.message.toLowerCase();
    switch (category) {
      case "connection" /* CONNECTION */:
        if (message.includes("refused")) {
          return "Device refused the connection. Check if wireless debugging is enabled.";
        }
        if (message.includes("timeout")) {
          return "Connection timed out. Check your network connection.";
        }
        if (message.includes("unreachable")) {
          return "Device is not reachable. Verify the IP address.";
        }
        if (message.includes("offline")) {
          return "Device appears to be offline. Check device connection.";
        }
        return "Failed to connect to device. Check network and device settings.";
      case "process" /* PROCESS */:
        if (message.includes("spawn enoent")) {
          return "Required program not found. Check binary installation.";
        }
        if (message.includes("exited")) {
          return "Process stopped unexpectedly. Check device connection.";
        }
        if (message.includes("emfile")) {
          return "Too many files open. Close some applications and try again.";
        }
        if (message.includes("memory")) {
          return "Not enough memory available. Close some applications.";
        }
        return "Process execution failed. Check system resources.";
      case "configuration" /* CONFIGURATION */:
        if (message.includes("ip") || message.includes("address")) {
          return "Invalid IP address format. Use format like 192.168.1.100.";
        }
        if (message.includes("port")) {
          return "Invalid port number. Use a number between 1 and 65535.";
        }
        return "Configuration error. Check your settings.";
      case "system" /* SYSTEM */:
        if (message.includes("permission")) {
          return "Permission denied. Check file permissions or run as administrator.";
        }
        if (message.includes("not found")) {
          return "Required file not found. Reinstall the extension.";
        }
        return "System error occurred. Try restarting the application.";
      default:
        return "An unexpected error occurred. Check the logs for details.";
    }
  }
  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error) {
    const category = this.categorizeError(error);
    const message = error.message.toLowerCase();
    switch (category) {
      case "connection" /* CONNECTION */:
        if (message.includes("refused")) {
          return [
            "Enable wireless debugging on your Android device",
            "Check if the port number is correct",
            "Try pairing the device first",
            "Restart ADB on your device"
          ];
        }
        if (message.includes("timeout")) {
          return [
            "Check your network connection",
            "Move device closer to the router",
            "Try a different network",
            "Restart wireless debugging"
          ];
        }
        return [
          "Verify device IP address and port",
          "Check network connectivity",
          "Enable wireless debugging",
          "Try USB connection first"
        ];
      case "process" /* PROCESS */:
        return [
          "Check if required binaries are installed",
          "Verify file permissions",
          "Restart the application",
          "Check system resources"
        ];
      case "configuration" /* CONFIGURATION */:
        return [
          "Check extension settings",
          "Verify input format",
          "Reset to default values",
          "Refer to documentation"
        ];
      case "system" /* SYSTEM */:
        return [
          "Restart the application",
          "Check file permissions",
          "Reinstall the extension",
          "Contact support if issue persists"
        ];
      default:
        return [
          "Check the logs for more details",
          "Restart the application",
          "Report the issue"
        ];
    }
  }
  /**
   * Handle error with full context and categorization
   */
  handleError(error, context) {
    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error);
    const userMessage = this.getUserFriendlyMessage(error);
    const suggestedActions = this.getRecoverySuggestions(error);
    const errorInfo = {
      category,
      severity,
      message: context ? `${context}: ${error.message}` : error.message,
      userMessage,
      suggestedActions,
      technicalDetails: error.stack || error.message,
      originalError: error
    };
    this.trackError(error);
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Track error for statistics and pattern analysis
   */
  trackError(error) {
    const category = this.categorizeError(error);
    const currentCount = this.errorStats.get(category) || 0;
    this.errorStats.set(category, currentCount + 1);
  }
  /**
   * Configure error handler behavior
   */
  configure(options) {
    if (options.showNotifications !== void 0) {
      this.config.showNotifications = options.showNotifications;
    }
    if (options.logLevel !== void 0) {
      this.config.logLevel = options.logLevel;
    }
  }
  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics() {
    const stats = {};
    Object.values(ErrorCategory).forEach((category) => {
      stats[category] = this.errorStats.get(category) || 0;
    });
    return stats;
  }
  /**
   * Log error and show appropriate user notification
   */
  logAndNotifyError(errorInfo) {
    this.logger.error(
      `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`,
      errorInfo.originalError
    );
    if (!this.config.showNotifications) {
      return;
    }
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
   * Get error statistics (alias for getErrorStatistics)
   */
  getErrorStats() {
    return this.getErrorStatistics();
  }
  /**
   * Get recurring error patterns
   */
  getRecurringPatterns() {
    const patterns = [];
    return patterns;
  }
  /**
   * Get error summary for debugging
   */
  getErrorSummary() {
    const stats = this.getErrorStatistics();
    const totalErrors = Object.values(stats).reduce((sum, count) => sum + count, 0);
    return {
      totalErrors,
      byCategory: stats,
      recentErrors: []
      // Would contain recent error messages in real implementation
    };
  }
  /**
   * Get current configuration
   */
  getConfiguration() {
    return { ...this.config };
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.cancelAllProgress();
  }
};
__name(_ErrorHandler, "ErrorHandler");
var ErrorHandler = _ErrorHandler;

// src/managers/commandManager.ts
var vscode2 = __toESM(require("vscode"));
var _CommandManager = class _CommandManager {
  processManager;
  configManager;
  logger;
  binaryManager;
  errorHandler;
  sidebarProvider;
  // Will be properly typed when sidebar provider is available
  statusUpdateInterval;
  constructor(processManager2, configManager2, logger2, binaryManager2, sidebarProvider2) {
    this.processManager = processManager2;
    this.configManager = configManager2;
    this.logger = logger2;
    this.binaryManager = binaryManager2;
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
      vscode2.commands.registerCommand("droidbridge.showLogs", () => this.showLogsCommand()),
      // Binary management commands
      vscode2.commands.registerCommand("droidbridge.checkBinaries", () => this.checkBinariesCommand()),
      vscode2.commands.registerCommand("droidbridge.downloadBinaries", () => this.downloadBinariesCommand()),
      vscode2.commands.registerCommand("droidbridge.refreshBinaries", () => this.refreshBinariesCommand()),
      // Pairing support
      vscode2.commands.registerCommand("droidbridge.pairDevice", (hostPort, code) => this.pairDeviceCommand(hostPort, code)),
      // Scrcpy sidebar commands
      vscode2.commands.registerCommand("droidbridge.ejectScrcpySidebar", () => this.ejectScrcpySidebarCommand()),
      vscode2.commands.registerCommand("droidbridge.embedScrcpySidebar", () => this.embedScrcpySidebarCommand())
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
          validateInput: /* @__PURE__ */ __name((value) => {
            if (!value.trim()) {
              return "IP address cannot be empty";
            }
            if (!this.configManager.validateIpAddress(value.trim())) {
              return "Please enter a valid IP address (e.g., 192.168.1.100 or localhost)";
            }
            return null;
          }, "validateInput")
        });
        if (inputIp === void 0) {
          this.logger.info("Connect Device command cancelled by user");
          return;
        }
        ip = inputIp.trim();
        const inputPort = await vscode2.window.showInputBox({
          prompt: "Enter the port number for ADB connection",
          value: port,
          validateInput: /* @__PURE__ */ __name((value) => {
            if (!value.trim()) {
              return "Port cannot be empty";
            }
            if (!this.configManager.validatePort(value.trim())) {
              return "Please enter a valid port number (1-65535)";
            }
            return null;
          }, "validateInput")
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
            this.logger.showSuccess(`\u2705 Device connected to ${ip}:${port}`);
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
      this.logger.error("Failed to execute Connect Device command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Connect Device command");
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
            this.logger.showSuccess(`\u2705 Device disconnected from ${target}`);
          }
          return success;
        },
        progressContext,
        "disconnect-device"
      );
    } catch (error) {
      this.logger.error("Failed to execute Disconnect Device command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Disconnect Device command");
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
        if ((shouldConnect == null ? void 0 : shouldConnect.title) === "Connect Device") {
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
            this.logger.showSuccess("\u2705 Scrcpy launched successfully");
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
      this.logger.error("Failed to execute Launch Scrcpy command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Launch Scrcpy command");
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
        if ((shouldConnect == null ? void 0 : shouldConnect.title) === "Connect Device") {
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
            this.logger.showSuccess("\u2705 Scrcpy launched successfully with screen off");
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
      this.logger.error("Failed to execute Launch Scrcpy Screen Off command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Launch Scrcpy Screen Off command");
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
            this.logger.showSuccess("\u2705 Scrcpy stopped successfully");
          }
          return success;
        },
        progressContext,
        "stop-scrcpy"
      );
    } catch (error) {
      this.logger.error("Failed to execute Stop Scrcpy command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Stop Scrcpy command");
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
      this.logger.error("Failed to execute Show Logs command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Show Logs command");
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
        const errorMessage = connectionState.connectionError || "Failed to connect to device";
        this.logger.showError(`\u274C ${errorMessage}`);
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
        const errorMessage = connectionState.connectionError || "Failed to disconnect from device";
        this.logger.showError(`\u274C ${errorMessage}`);
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
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return false;
      }
      const process2 = await this.processManager.launchScrcpy();
      if (!process2 || !process2.pid) {
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
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return false;
      }
      const process2 = await this.processManager.launchScrcpyScreenOff();
      if (!process2 || !process2.pid) {
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
        this.logger.showError("\u274C Failed to stop scrcpy");
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
   * Check binary status and show information
   */
  async checkBinariesCommand() {
    try {
      this.logger.info("Check Binaries command executed");
      await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Checking binary status...",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Detecting installed binaries..." });
        const detectionStatus = await this.binaryManager.getDetectionStatus();
        const binaryInfo = await this.binaryManager.getBinaryInfo();
        const downloadInfo = await this.binaryManager.needsDownload();
        progress.report({ message: "Analysis complete", increment: 100 });
        const statusLines = [];
        statusLines.push("=== DroidBridge Binary Status ===\n");
        const adbStatus = detectionStatus.get("adb");
        statusLines.push(`ADB: ${(adbStatus == null ? void 0 : adbStatus.found) ? "\u2705 Found" : "\u274C Not Found"}`);
        if (adbStatus == null ? void 0 : adbStatus.found) {
          statusLines.push(`  Path: ${adbStatus.path}`);
          statusLines.push(`  Source: ${this.getSourceDescription(adbStatus.source)}`);
          if (adbStatus.version) {
            statusLines.push(`  Version: ${adbStatus.version}`);
          }
        }
        const scrcpyStatus = detectionStatus.get("scrcpy");
        statusLines.push(`
Scrcpy: ${(scrcpyStatus == null ? void 0 : scrcpyStatus.found) ? "\u2705 Found" : "\u274C Not Found"}`);
        if (scrcpyStatus == null ? void 0 : scrcpyStatus.found) {
          statusLines.push(`  Path: ${scrcpyStatus.path}`);
          statusLines.push(`  Source: ${this.getSourceDescription(scrcpyStatus.source)}`);
          if (scrcpyStatus.version) {
            statusLines.push(`  Version: ${scrcpyStatus.version}`);
          }
        }
        if (downloadInfo.needed) {
          statusLines.push(`
\u26A0\uFE0F  Missing binaries: ${downloadInfo.binaries.join(", ")}`);
          statusLines.push('Use "DroidBridge: Download Binaries" to download missing binaries.');
        } else {
          statusLines.push("\n\u2705 All required binaries are available");
        }
        const statusReport = statusLines.join("\n");
        this.logger.info("Binary status check completed");
        this.logger.info(statusReport);
        const action = downloadInfo.needed ? "Download Missing" : "Show Logs";
        const selection = await vscode2.window.showInformationMessage(
          downloadInfo.needed ? `Missing binaries: ${downloadInfo.binaries.join(", ")}. Download them now?` : "All binaries are available. Check logs for details.",
          action,
          "Show Logs"
        );
        if (selection === "Download Missing") {
          await this.downloadBinariesCommand();
        } else if (selection === "Show Logs") {
          this.logger.show();
        }
      });
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown binary check error"),
        "Check Binaries command"
      );
    }
  }
  /**
   * Download missing binaries
   */
  async downloadBinariesCommand() {
    try {
      this.logger.info("Download Binaries command executed");
      const downloadInfo = await this.binaryManager.needsDownload();
      if (!downloadInfo.needed) {
        vscode2.window.showInformationMessage("All required binaries are already available.");
        return;
      }
      const proceed = await vscode2.window.showWarningMessage(
        `This will download missing binaries: ${downloadInfo.binaries.join(", ")}. Continue?`,
        { modal: true },
        "Download",
        "Cancel"
      );
      if (proceed !== "Download") {
        this.logger.info("Download Binaries command cancelled by user");
        return;
      }
      await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Downloading binaries...",
        cancellable: false
      }, async (progress) => {
        this.binaryManager.setDownloadProgressCallback((downloadProgress) => {
          progress.report({
            message: `Downloading ${downloadProgress.binary}: ${downloadProgress.percentage}%`,
            increment: downloadProgress.percentage / downloadInfo.binaries.length
          });
        });
        const result = await this.binaryManager.ensureBinariesAvailable();
        if (result.success) {
          progress.report({ message: "Download completed successfully", increment: 100 });
          this.errorHandler.showSuccess("All binaries downloaded successfully");
          if (this.sidebarProvider) {
            this.sidebarProvider.refresh();
          }
        } else {
          throw new Error(`Download failed: ${result.errors.join(", ")}`);
        }
      });
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown download error"),
        "Download Binaries command"
      );
    }
  }
  /**
   * Refresh binary detection (clear cache and re-detect)
   */
  async refreshBinariesCommand() {
    try {
      this.logger.info("Refresh Binaries command executed");
      await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Refreshing binary detection...",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Clearing detection cache..." });
        await this.binaryManager.refreshDetection();
        progress.report({ message: "Re-detecting binaries...", increment: 50 });
        const detectionStatus = await this.binaryManager.getDetectionStatus();
        progress.report({ message: "Detection refreshed", increment: 100 });
        const foundBinaries = Array.from(detectionStatus.entries()).filter(([_, status]) => status.found).map(([name, _]) => name);
        this.errorHandler.showSuccess(
          foundBinaries.length > 0 ? `Binary detection refreshed. Found: ${foundBinaries.join(", ")}` : "Binary detection refreshed. No binaries found."
        );
        if (this.sidebarProvider) {
          this.sidebarProvider.refresh();
        }
      });
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown refresh error"),
        "Refresh Binaries command"
      );
    }
  }
  /**
   * Get user-friendly description for binary source
   */
  getSourceDescription(source) {
    switch (source) {
      case "system":
        return "System PATH";
      case "bundled":
        return "Bundled with extension";
      case "downloaded":
        return "Downloaded by extension";
      case "custom":
        return "Custom path (user configured)";
      case "not-found":
        return "Not found";
      default:
        return source;
    }
  }
  /** Pair device via host:port + 6-digit code */
  async pairDeviceCommand(hostPortArg, codeArg) {
    try {
      let hostPort = hostPortArg;
      let code = codeArg;
      if (!hostPort) {
        hostPort = await vscode2.window.showInputBox({
          prompt: "Enter pairing host:port (e.g. 192.168.1.50:37123)",
          validateInput: /* @__PURE__ */ __name((v) => /.+:\d+/.test(v.trim()) ? null : "Format must be host:port", "validateInput")
        }) || void 0;
      }
      if (!hostPort) {
        return;
      }
      if (!code) {
        code = await vscode2.window.showInputBox({
          prompt: "Enter 6-digit pairing code",
          validateInput: /* @__PURE__ */ __name((v) => /^\d{6}$/.test(v.trim()) ? null : "Must be 6 digits", "validateInput")
        }) || void 0;
      }
      if (!code) {
        return;
      }
      const [host, port] = hostPort.trim().split(":");
      const result = await this.processManager.pairDevice(code.trim(), host, port);
      if (result.success) {
        vscode2.window.showInformationMessage(result.message);
        this.logger.info(result.message);
        vscode2.window.withProgress(
          { location: vscode2.ProgressLocation.Notification, title: "Attempting auto-connection..." },
          async () => {
            const autoConnectResult = await this.processManager.tryAutoConnectAfterPairing(host);
            if (autoConnectResult.success) {
              vscode2.window.showInformationMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection successful: ${autoConnectResult.message}`);
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(host);
                this.sidebarProvider.updatePort(autoConnectResult.connectedPort || "5555");
              }
            } else {
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(host);
                this.sidebarProvider.updatePort("5555");
              }
              vscode2.window.showWarningMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection failed, manual connection needed: ${autoConnectResult.message}`);
            }
          }
        );
      } else {
        const errorMessage = `\u274C Pairing failed: ${result.message}`;
        vscode2.window.showErrorMessage(errorMessage);
        this.logger.error(errorMessage);
      }
    } catch (e) {
      this.logger.error("Pairing command failed", e);
      vscode2.window.showErrorMessage("Pairing failed. See logs.");
    }
  }
  /**
  * Eject scrcpy from sidebar to external window
  */
  async ejectScrcpySidebarCommand() {
    try {
      this.logger.info("Ejecting scrcpy from sidebar to external window");
      if (this.processManager.isScrcpyRunning()) {
        await this.stopScrcpyCommand();
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      await this.launchScrcpyCommand();
      if (this.sidebarProvider) {
        this.sidebarProvider.showScrcpySidebar(false);
      }
      vscode2.window.showInformationMessage("Scrcpy ejected to external window");
    } catch (error) {
      this.logger.error("Failed to eject scrcpy sidebar", error instanceof Error ? error : void 0);
      vscode2.window.showErrorMessage("Failed to eject scrcpy from sidebar");
    }
  }
  /**
   * Embed scrcpy into sidebar
   */
  async embedScrcpySidebarCommand() {
    try {
      this.logger.info("Embedding scrcpy into sidebar");
      if (!this.processManager.isDeviceConnected()) {
        vscode2.window.showWarningMessage("Please connect to a device first");
        return;
      }
      if (this.processManager.isScrcpyRunning()) {
        await this.stopScrcpyCommand();
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      const result = await this.processManager.launchScrcpySidebar();
      if (result.success) {
        if (this.sidebarProvider) {
          this.sidebarProvider.showScrcpySidebar(true, result.processId, result.windowId);
        }
        vscode2.window.showInformationMessage("Scrcpy embedded in sidebar");
      } else {
        vscode2.window.showErrorMessage(`Failed to embed scrcpy: ${result.message}`);
      }
    } catch (error) {
      this.logger.error("Failed to embed scrcpy in sidebar", error instanceof Error ? error : void 0);
      vscode2.window.showErrorMessage("Failed to embed scrcpy in sidebar");
    }
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.stopStatusUpdates();
    this.errorHandler.dispose();
  }
};
__name(_CommandManager, "CommandManager");
var CommandManager = _CommandManager;

// src/utils/platformUtils.ts
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var _PlatformUtils = class _PlatformUtils {
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
  static async makeExecutable(filePath) {
    if (os.platform() !== "win32") {
      const fs4 = await import("fs/promises");
      try {
        const stats = await fs4.stat(filePath);
        const currentMode = stats.mode;
        const executableMode = currentMode | 73;
        if (currentMode !== executableMode) {
          await fs4.chmod(filePath, executableMode);
        }
      } catch (error) {
        throw new Error(`Failed to make ${filePath} executable: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  /**
   * Check if a file has executable permissions (Unix systems only)
   */
  static async isExecutable(filePath) {
    if (os.platform() === "win32") {
      const fs5 = await import("fs/promises");
      try {
        await fs5.access(filePath);
        return true;
      } catch {
        return false;
      }
    }
    const fs4 = await import("fs/promises");
    try {
      await fs4.access(filePath, fs4.constants.F_OK | fs4.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get platform-specific spawn options for process execution
   */
  static getPlatformSpecificOptions(options = {}) {
    const baseOptions = {
      stdio: ["pipe", "pipe", "pipe"],
      ...options
    };
    const platform2 = os.platform();
    switch (platform2) {
      case "win32":
        return {
          ...baseOptions,
          shell: true,
          windowsHide: true,
          // Ensure proper handling of Windows paths
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
      case "darwin":
        return {
          ...baseOptions,
          // macOS specific options
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
      case "linux":
        return {
          ...baseOptions,
          // Linux specific options
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
      default:
        return baseOptions;
    }
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
  /**
   * Get platform-specific architecture identifier
   */
  static getCurrentArchitecture() {
    const arch2 = os.arch();
    switch (arch2) {
      case "x64":
        return "x64";
      case "arm64":
        return "arm64";
      case "ia32":
        return "x86";
      default:
        return arch2;
    }
  }
  /**
   * Get platform-specific binary directory name
   */
  static getPlatformBinaryDir() {
    const platform2 = this.getCurrentPlatform();
    const arch2 = this.getCurrentArchitecture();
    return platform2;
  }
  /**
   * Normalize file paths for the current platform
   */
  static normalizePath(filePath) {
    return path.normalize(filePath);
  }
  /**
   * Check if the current platform supports a specific feature
   */
  static supportsFeature(feature) {
    const platform2 = os.platform();
    switch (feature) {
      case "executable-permissions":
        return platform2 !== "win32";
      case "shell-execution":
        return true;
      // All platforms support shell execution
      case "process-signals":
        return platform2 !== "win32";
      // Windows has limited signal support
      default:
        return false;
    }
  }
  /**
   * Get platform-specific process termination signal
   */
  static getTerminationSignal() {
    return os.platform() === "win32" ? "SIGTERM" : "SIGTERM";
  }
  /**
   * Get platform-specific force kill signal
   */
  static getForceKillSignal() {
    return os.platform() === "win32" ? "SIGKILL" : "SIGKILL";
  }
  /**
   * Get platform-specific temporary directory
   */
  static getTempDir() {
    return os.tmpdir();
  }
  /**
   * Check if running on a supported platform
   */
  static isSupportedPlatform() {
    try {
      this.getCurrentPlatform();
      return true;
    } catch {
      return false;
    }
  }
};
__name(_PlatformUtils, "PlatformUtils");
var PlatformUtils = _PlatformUtils;

// src/managers/processManager.ts
var import_child_process2 = require("child_process");
var _ProcessManager = class _ProcessManager {
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
    var _a2, _b2, _c, _d;
    let adbPath;
    try {
      adbPath = await this.binaryManager.getAdbPath();
    } catch (error) {
      adbPath = ((_b2 = (_a2 = this.binaryManager).getAdbPathSync) == null ? void 0 : _b2.call(_a2)) || ((_d = (_c = this.binaryManager).getBundledBinaryPath) == null ? void 0 : _d.call(_c, "adb")) || "adb";
    }
    return new Promise((resolve) => {
      var _a3, _b3;
      let stdout = "";
      let stderr = "";
      this.logger.info(`Executing ADB command: ${adbPath} ${args.join(" ")}`);
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"]
      });
      const process2 = (0, import_child_process2.spawn)(adbPath, args, spawnOptions);
      this.managedProcesses.add(process2);
      (_a3 = process2.stdout) == null ? void 0 : _a3.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        this.logger.logProcessOutput("adb", output);
      });
      (_b3 = process2.stderr) == null ? void 0 : _b3.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        this.logger.logProcessOutput("adb", output);
      });
      process2.on("close", (code) => {
        this.managedProcesses.delete(process2);
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
      process2.on("error", (error) => {
        this.managedProcesses.delete(process2);
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
    var _a2, _b2;
    try {
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, "ip", "IP address");
      if (!ipValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: ((_a2 = ipValidation.error) == null ? void 0 : _a2.userMessage) || "Invalid IP address"
        };
        return false;
      }
      const portValidation = this.errorHandler.validateAndHandleInput(port, "port", "Port number");
      if (!portValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: ((_b2 = portValidation.error) == null ? void 0 : _b2.userMessage) || "Invalid port number"
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
   * Pair with a device over Wi‑Fi (Android 11+ wireless debugging)
   * Expects pairing code (6 digits) and host:port of pairing service (usually shown in device Wireless debugging screen)
   */
  async pairDevice(pairingCode, host, port, attempt = 0) {
    try {
      const code = pairingCode.trim();
      if (!/^[0-9]{6}$/.test(code)) {
        return { success: false, message: "Invalid pairing code. Expected 6 digits." };
      }
      const target = `${host}:${port}`;
      this.logger.info(`Attempting ADB pairing with ${target}`);
      const result = await this.executeAdbCommandWithTimeout(["pair", target, code], 3e4);
      const stdout = result.stdout || "";
      const stderr = result.stderr || "";
      const combined = `${stdout} ${stderr}`.toLowerCase();
      const indicatesSuccess = /successfully paired|pairing code accepted/i.test(stdout);
      const hasProtocolFault = /protocol fault.*couldn't read status message/i.test(stderr);
      const hasSuccessInFault = hasProtocolFault && /success/i.test(stderr);
      const indicatesFailure = /failed|unable|timeout|refused|unreachable|invalid|incorrect/i.test(combined);
      let isProtocolFaultSuccess = false;
      if (hasSuccessInFault && !indicatesFailure && !indicatesSuccess) {
        this.logger.info("Protocol fault with Success detected - verifying pairing status...");
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        const verifyResult = await this.executeAdbCommandWithTimeout(["devices"], 5e3);
        const baseIp = target.split(":")[0];
        const hasDeviceInList = verifyResult.stdout.includes(baseIp) || verifyResult.stdout.includes("device") || verifyResult.stdout.includes("unauthorized");
        this.logger.info(`Pairing verification: devices output contains connection = ${hasDeviceInList}`);
        if (hasDeviceInList) {
          isProtocolFaultSuccess = true;
        } else {
          this.logger.info("No device found in list, attempting connection verification...");
          isProtocolFaultSuccess = await this.tryQuickConnectVerification(baseIp);
          this.logger.info(`Connection verification result: ${isProtocolFaultSuccess}`);
        }
      }
      this.logger.info(`Pairing result - Exit: ${result.exitCode}, Success: ${result.success}`);
      this.logger.info(`Stdout: ${stdout}`);
      this.logger.info(`Stderr: ${stderr}`);
      this.logger.info(`Success detected: ${indicatesSuccess}, Failure detected: ${indicatesFailure}, Protocol fault with success: ${isProtocolFaultSuccess}`);
      if (indicatesSuccess || isProtocolFaultSuccess) {
        this.logger.info(`Successfully paired with ${target}`);
        const baseIp = target.split(":")[0];
        if (isProtocolFaultSuccess && !indicatesSuccess) {
          this.logger.info("Verifying protocol fault pairing by attempting connection...");
          const verifyConnection = await this.tryQuickConnectVerification(baseIp);
          if (!verifyConnection) {
            this.logger.error("Protocol fault pairing verification failed - treating as failure");
            if (attempt < 1) {
              this.logger.info("Restarting ADB server and retrying pairing once more due to protocol fault...");
              await this.restartAdbServer();
              await new Promise((resolve) => setTimeout(resolve, 1500));
              return this.pairDevice(pairingCode, host, port, attempt + 1);
            }
            return {
              success: false,
              message: "Pairing failed - the protocol fault indicates communication was interrupted. The pairing code popup is likely still showing on your device. Please:\n1. Dismiss the current pairing popup\n2. Generate a new pairing code\n3. Try pairing again immediately while the code is fresh\n4. Ensure both devices stay connected to Wi-Fi during pairing"
            };
          }
        }
        const cleanMessage = stdout.split("\n").find((line) => line.includes("Successfully paired")) || (isProtocolFaultSuccess ? `\u2705 Paired successfully! The pairing code popup should have disappeared on your device. Check "Paired devices" for the ADB port, then use the Connect section above.` : `\u2705 Paired successfully! Check your device's "Paired devices" section for the ADB port (usually 5555), then use the Connect section above.`);
        return { success: true, message: cleanMessage };
      }
      let errorMsg = stderr || stdout || "Pairing failed";
      if (combined.includes("timeout") || !stdout && !stderr) {
        errorMsg = "Pairing timed out. The pairing code may have expired. Generate a new pairing code on your device and try again.";
      } else if (combined.includes("refused")) {
        errorMsg = "Connection refused. Make sure Wireless debugging is enabled and the pairing service is running on your device.";
      } else if (combined.includes("unreachable")) {
        errorMsg = "Host unreachable. Verify the IP address and ensure both devices are connected to the same Wi-Fi network.";
      } else if (combined.includes("invalid") || combined.includes("incorrect")) {
        errorMsg = "Invalid pairing code. The 6-digit code may have expired or been mistyped. Generate a fresh code on your device.";
      } else if (hasProtocolFault && hasSuccessInFault) {
        errorMsg = "Pairing communication failed (protocol fault). This happens when the pairing code expires during the handshake or there's a network interruption. The pairing popup should still be visible on your device. Please generate a fresh pairing code and try again.";
        if (attempt < 1) {
          this.logger.info("Protocol fault detected with failure - restarting ADB server and retrying pairing once.");
          await this.restartAdbServer();
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return this.pairDevice(pairingCode, host, port, attempt + 1);
        }
      } else if (hasProtocolFault) {
        errorMsg = "Protocol fault occurred during pairing. This usually means the pairing code expired or there was a network issue. Please generate a new pairing code and try again.";
      }
      this.logger.error(`Pairing failed: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error during pairing";
      this.logger.error("Pairing error", e);
      return { success: false, message };
    }
  }
  /**
   * Quick verification to check if pairing actually worked by attempting connection
   */
  async tryQuickConnectVerification(ip) {
    const commonPorts = ["5555", "5556", "37115"];
    for (const port of commonPorts) {
      try {
        const result = await this.executeAdbCommandWithTimeout(["connect", `${ip}:${port}`], 5e3);
        if (result.stdout.includes("connected") || result.stdout.includes("already connected")) {
          await this.executeAdbCommandWithTimeout(["disconnect", `${ip}:${port}`], 3e3);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }
  /**
   * Restart the ADB server to recover from protocol faults
   */
  async restartAdbServer() {
    this.logger.info("Restarting ADB server (kill-server \u2192 start-server)");
    await this.executeAdbCommandWithTimeout(["kill-server"], 5e3).catch(() => void 0);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.executeAdbCommandWithTimeout(["start-server"], 5e3).catch(() => void 0);
  }
  /**
   * Attempt to auto-connect after successful pairing using common ADB ports
   */
  async tryAutoConnectAfterPairing(ip) {
    const commonPorts = ["5555", "5556", "37115"];
    this.logger.info(`Attempting auto-connection to ${ip} on common ports...`);
    for (const port of commonPorts) {
      try {
        this.logger.info(`Trying ${ip}:${port}...`);
        const connected = await this.connectDevice(ip, port);
        if (connected) {
          return {
            success: true,
            message: `\u{1F389} Auto-connected to ${ip}:${port}! Device is ready for debugging.`,
            connectedPort: port
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to connect to ${ip}:${port}: ${error}`);
        continue;
      }
    }
    return {
      success: false,
      message: `Could not auto-connect. Please check your device's "Paired devices" section for the correct port and connect manually.`
    };
  }
  /**
   * Execute ADB command with timeout to prevent hanging
   */
  async executeAdbCommandWithTimeout(args, timeoutMs) {
    return new Promise(async (resolve) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: false,
            stdout: "",
            stderr: "Command timed out",
            exitCode: -1
          });
        }
      }, timeoutMs);
      try {
        const result = await this.executeAdbCommand(args);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            success: false,
            stdout: "",
            stderr: error instanceof Error ? error.message : "Unknown error",
            exitCode: -1
          });
        }
      }
    });
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
      const process2 = this.scrcpyProcess;
      this.logger.info("Stopping scrcpy process");
      const cleanup = /* @__PURE__ */ __name(() => {
        this.managedProcesses.delete(process2);
        this.scrcpyProcess = null;
        this.scrcpyState = {
          running: false
        };
        this.logger.info("Scrcpy process stopped successfully");
        resolve(true);
      }, "cleanup");
      const timeout = setTimeout(() => {
        if (process2 && !process2.killed) {
          this.logger.info("Force killing scrcpy process");
          const forceKillSignal = PlatformUtils.getForceKillSignal();
          process2.kill(forceKillSignal);
        }
        cleanup();
      }, 3e3);
      process2.on("close", () => {
        clearTimeout(timeout);
        cleanup();
      });
      if (process2 && !process2.killed) {
        const terminationSignal = PlatformUtils.getTerminationSignal();
        process2.kill(terminationSignal);
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
    const process2 = this.scrcpyProcess;
    if (process2.killed || process2.exitCode !== null) {
      this.logger.info("Detected scrcpy process termination during monitoring");
      this.managedProcesses.delete(process2);
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
    for (const process2 of this.managedProcesses) {
      if (!process2.killed) {
        cleanupPromises.push(
          new Promise((resolve) => {
            process2.on("close", () => resolve());
            const terminationSignal = PlatformUtils.getTerminationSignal();
            process2.kill(terminationSignal);
            setTimeout(() => {
              if (!process2.killed) {
                const forceKillSignal = PlatformUtils.getForceKillSignal();
                process2.kill(forceKillSignal);
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
   * Launch scrcpy optimized for sidebar embedding
   */
  async launchScrcpySidebar(options) {
    try {
      const sidebarOptions = {
        ...options,
        maxSize: 400,
        // Smaller resolution for sidebar
        bitrate: 2e6
        // Lower bitrate for better performance in sidebar
      };
      this.logger.info("Launching scrcpy optimized for sidebar");
      const process2 = await this.launchScrcpyWithCustomArgs(sidebarOptions, [
        "--window-width=300",
        "--window-height=400",
        "--window-x=0",
        "--window-y=0",
        "--stay-awake",
        "--window-title=DroidBridge Sidebar",
        "--always-on-top"
      ]);
      return {
        success: true,
        message: "Scrcpy launched for sidebar",
        processId: process2.pid,
        windowId: `scrcpy-sidebar-${process2.pid}`
      };
    } catch (error) {
      this.logger.error("Failed to launch scrcpy for sidebar", error instanceof Error ? error : void 0);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error launching scrcpy for sidebar"
      };
    }
  }
  /**
   * Launch scrcpy with custom additional arguments
   */
  async launchScrcpyWithCustomArgs(options, additionalArgs = []) {
    var _a2, _b2, _c, _d;
    if (this.isScrcpyRunning()) {
      throw new Error(
        "Scrcpy is already running. Stop the current instance first."
      );
    }
    let scrcpyPath;
    try {
      scrcpyPath = await this.binaryManager.getScrcpyPath();
    } catch (error) {
      scrcpyPath = ((_b2 = (_a2 = this.binaryManager).getScrcpyPathSync) == null ? void 0 : _b2.call(_a2)) || ((_d = (_c = this.binaryManager).getBundledBinaryPath) == null ? void 0 : _d.call(_c, "scrcpy")) || "scrcpy";
    }
    let args = [...this.buildScrcpyArgs(options), ...additionalArgs];
    const deviceArgs = await this.getDeviceSelectionArgs();
    if (deviceArgs.length > 0) {
      args = [...deviceArgs, ...args];
      this.logger.info(`Added device selection: ${deviceArgs.join(" ")}`);
    }
    this.logger.info(`Launching scrcpy: ${scrcpyPath} ${args.join(" ")}`);
    this.scrcpyState = {
      running: false,
      startTime: /* @__PURE__ */ new Date(),
      options: options ? { ...options } : void 0
    };
    return new Promise((resolve, reject) => {
      var _a3, _b3;
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"],
        detached: false
      });
      const process2 = (0, import_child_process2.spawn)(scrcpyPath, args, spawnOptions);
      this.scrcpyProcess = process2;
      this.managedProcesses.add(process2);
      let hasResolved = false;
      const onData = /* @__PURE__ */ __name((data) => {
        const output = data.toString();
        this.logger.logProcessOutput("scrcpy", output);
        if (!hasResolved) {
          hasResolved = true;
          this.scrcpyState = {
            running: true,
            process: process2,
            startTime: this.scrcpyState.startTime,
            options: this.scrcpyState.options
          };
          this.logger.info("Scrcpy process started successfully");
          resolve(process2);
        }
      }, "onData");
      (_a3 = process2.stdout) == null ? void 0 : _a3.on("data", onData);
      (_b3 = process2.stderr) == null ? void 0 : _b3.on("data", onData);
      process2.on("close", (code) => {
        this.managedProcesses.delete(process2);
        if (this.scrcpyProcess === process2) {
          this.scrcpyProcess = null;
          this.scrcpyState = {
            running: false
          };
        }
        this.logger.info(`Scrcpy process closed with exit code: ${code}`);
      });
      process2.on("error", (error) => {
        this.managedProcesses.delete(process2);
        if (this.scrcpyProcess === process2) {
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
   * Get device selection arguments for scrcpy when multiple devices are available
   */
  async getDeviceSelectionArgs() {
    try {
      const result = await this.executeAdbCommand(["devices"]);
      if (!result.success) {
        this.logger.error("Failed to get device list for scrcpy selection");
        return [];
      }
      const devices = this.parseAllDevices(result.stdout);
      if (devices.length <= 1) {
        return [];
      }
      this.logger.info(`Multiple devices found (${devices.length}), selecting device for scrcpy...`);
      const wirelessDevice = devices.find((device) => device.includes(":"));
      if (wirelessDevice) {
        this.logger.info(`Selected wireless device: ${wirelessDevice}`);
        return ["-s", wirelessDevice];
      }
      this.logger.info(`Selected first available device: ${devices[0]}`);
      return ["-s", devices[0]];
    } catch (error) {
      this.logger.error("Failed to get device selection args:", error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
  /**
   * Parse all connected devices from ADB devices output
   */
  parseAllDevices(stdout) {
    const devices = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("List of devices") && trimmedLine.includes("	")) {
        const parts = trimmedLine.split("	");
        if (parts.length >= 2 && parts[1].includes("device")) {
          devices.push(parts[0]);
        }
      }
    }
    return devices;
  }
  /**
   * Build command line arguments for scrcpy based on options
   */
  buildScrcpyArgs(options) {
    const args = [];
    if (options == null ? void 0 : options.bitrate) {
      args.push("--bit-rate", options.bitrate.toString());
    }
    if (options == null ? void 0 : options.maxSize) {
      args.push("--max-size", options.maxSize.toString());
    }
    if (options == null ? void 0 : options.crop) {
      args.push("--crop", options.crop);
    }
    if (options == null ? void 0 : options.recordFile) {
      args.push("--record", options.recordFile);
    }
    return args;
  }
};
__name(_ProcessManager, "ProcessManager");
var ProcessManager2 = _ProcessManager;

// src/managers/configManager.ts
var vscode3 = __toESM(require("vscode"));
var _ConfigManager = class _ConfigManager {
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
    const path5 = config.get("adbPath", "");
    return path5.trim() || void 0;
  }
  /**
   * Get custom scrcpy binary path if configured
   */
  getCustomScrcpyPath() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const path5 = config.get("scrcpyPath", "");
    return path5.trim() || void 0;
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
__name(_ConfigManager, "ConfigManager");
__publicField(_ConfigManager, "CONFIG_SECTION", "droidbridge");
__publicField(_ConfigManager, "DEFAULT_IP", "192.168.1.100");
__publicField(_ConfigManager, "DEFAULT_PORT", "5555");
var ConfigManager2 = _ConfigManager;

// src/config/binaryConfig.ts
var BINARY_CONFIG = [
  {
    name: "adb",
    downloadUrls: {
      // GitHub releases - repository
      github: "https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download",
      // Direct download URLs - CDN (optional, not ready yet)
      // direct: 'https://lusansapkota.com.np/droidbridge/binaries',
      // Fallback to official sources (may require extraction)
      fallback: "https://dl.google.com/android/repository/platform-tools-latest"
    },
    version: "latest"
  },
  {
    name: "scrcpy",
    downloadUrls: {
      // GitHub releases - repository
      github: "https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download",
      // Direct download URLs - CDN (optional, not ready yet)
      // direct: 'https://lusansapkota.com.np/droidbridge/binaries',
      // Fallback to official releases
      fallback: "https://github.com/Genymobile/scrcpy/releases/latest/download"
    },
    version: "latest"
  }
];
function getBinaryConfig(name) {
  return BINARY_CONFIG.find((config) => config.name === name);
}
__name(getBinaryConfig, "getBinaryConfig");
function getDownloadUrl(name, preference = "github") {
  const config = getBinaryConfig(name);
  if (!config) {
    return void 0;
  }
  return config.downloadUrls[preference] || config.downloadUrls.github || config.downloadUrls.direct;
}
__name(getDownloadUrl, "getDownloadUrl");
var BINARY_PATTERNS = {
  adb: {
    win32: "adb-windows-{arch}.exe",
    darwin: "adb-macos-{arch}",
    linux: "adb-linux-{arch}"
  },
  scrcpy: {
    win32: "scrcpy-windows-{arch}.exe",
    darwin: "scrcpy-macos-{arch}",
    linux: "scrcpy-linux-{arch}"
  }
};
function getBinaryPattern(name, platform2, arch2) {
  var _a2;
  const pattern = (_a2 = BINARY_PATTERNS[name]) == null ? void 0 : _a2[platform2];
  if (!pattern) {
    const extension = platform2 === "win32" ? ".exe" : "";
    return `${name}-${platform2}-${arch2}${extension}`;
  }
  return pattern.replace("{arch}", arch2);
}
__name(getBinaryPattern, "getBinaryPattern");

// src/managers/binaryDetector.ts
var import_child_process3 = require("child_process");
var import_util = require("util");
var path2 = __toESM(require("path"));
var fs = __toESM(require("fs/promises"));
var _a, _b;
var execAsync = (0, import_util.promisify)(import_child_process3.exec);
var _BinaryDetector = class _BinaryDetector {
  downloadDir;
  constructor(extensionPath) {
    this.downloadDir = path2.join(extensionPath, "downloaded-binaries");
  }
  /**
   * Detect all required binaries and determine what needs to be downloaded
   */
  async detectBinaries() {
    const results = /* @__PURE__ */ new Map();
    for (const requirement of _BinaryDetector.BINARY_REQUIREMENTS) {
      const result = await this.detectSingleBinary(requirement.name);
      results.set(requirement.name, result);
    }
    return results;
  }
  /**
   * Detect a single binary on the system
   */
  async detectSingleBinary(binaryName) {
    const systemResult = await this.checkSystemPath(binaryName);
    if (systemResult.found) {
      return systemResult;
    }
    const downloadedResult = await this.checkDownloadedBinary(binaryName);
    if (downloadedResult.found) {
      return downloadedResult;
    }
    const commonPathResult = await this.checkCommonPaths(binaryName);
    if (commonPathResult.found) {
      return commonPathResult;
    }
    return {
      found: false,
      source: "not-found"
    };
  }
  /**
   * Get missing binaries that need to be downloaded
   */
  async getMissingBinaries() {
    const detectionResults = await this.detectBinaries();
    const missing = [];
    for (const requirement of _BinaryDetector.BINARY_REQUIREMENTS) {
      const result = detectionResults.get(requirement.name);
      if (!(result == null ? void 0 : result.found) && requirement.required) {
        missing.push(requirement);
      }
    }
    return missing;
  }
  /**
   * Check if binary exists in system PATH
   */
  async checkSystemPath(binaryName) {
    try {
      const command = PlatformUtils.getCurrentPlatform() === "win32" ? "where" : "which";
      const { stdout } = await execAsync(`${command} ${binaryName}`);
      const binaryPath = stdout.trim().split("\n")[0];
      if (binaryPath) {
        const version = await this.getBinaryVersion(binaryName, binaryPath);
        return {
          found: true,
          path: binaryPath,
          version,
          source: "system"
        };
      }
    } catch (error) {
    }
    return { found: false, source: "not-found" };
  }
  /**
   * Check if we have a downloaded version of the binary
   */
  async checkDownloadedBinary(binaryName) {
    try {
      const platform2 = PlatformUtils.getCurrentPlatform();
      const extension = PlatformUtils.getBinaryExtension();
      const binaryPath = path2.join(this.downloadDir, platform2, `${binaryName}${extension}`);
      await fs.access(binaryPath);
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          return { found: false, source: "not-found" };
        }
      }
      const version = await this.getBinaryVersion(binaryName, binaryPath);
      return {
        found: true,
        path: binaryPath,
        version,
        source: "downloaded"
      };
    } catch (error) {
      return { found: false, source: "not-found" };
    }
  }
  /**
   * Check common installation paths for binaries
   */
  async checkCommonPaths(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    let commonPaths = [];
    switch (platform2) {
      case "win32":
        commonPaths = [
          `C:\\Program Files\\${binaryName}\\${binaryName}${extension}`,
          `C:\\Program Files (x86)\\${binaryName}\\${binaryName}${extension}`,
          `C:\\${binaryName}\\${binaryName}${extension}`,
          `C:\\tools\\${binaryName}\\${binaryName}${extension}`
        ];
        break;
      case "darwin":
        commonPaths = [
          `/usr/local/bin/${binaryName}`,
          `/opt/homebrew/bin/${binaryName}`,
          `/Applications/${binaryName}/${binaryName}`,
          `${process.env.HOME}/bin/${binaryName}`
        ];
        break;
      case "linux":
        commonPaths = [
          `/usr/bin/${binaryName}`,
          `/usr/local/bin/${binaryName}`,
          `/opt/${binaryName}/${binaryName}`,
          `${process.env.HOME}/.local/bin/${binaryName}`,
          `${process.env.HOME}/bin/${binaryName}`
        ];
        break;
    }
    for (const binaryPath of commonPaths) {
      try {
        await fs.access(binaryPath);
        if (PlatformUtils.supportsFeature("executable-permissions")) {
          const isExecutable = await PlatformUtils.isExecutable(binaryPath);
          if (!isExecutable) {
            continue;
          }
        }
        const version = await this.getBinaryVersion(binaryName, binaryPath);
        return {
          found: true,
          path: binaryPath,
          version,
          source: "system"
        };
      } catch (error) {
      }
    }
    return { found: false, source: "not-found" };
  }
  /**
   * Get version information for a binary
   */
  async getBinaryVersion(binaryName, binaryPath) {
    try {
      let versionCommand;
      switch (binaryName) {
        case "adb":
          versionCommand = `"${binaryPath}" version`;
          break;
        case "scrcpy":
          versionCommand = `"${binaryPath}" --version`;
          break;
        default:
          return void 0;
      }
      const { stdout } = await execAsync(versionCommand);
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : stdout.trim().split("\n")[0];
    } catch (error) {
      return void 0;
    }
  }
  /**
   * Get the download directory path
   */
  getDownloadDir() {
    return this.downloadDir;
  }
  /**
   * Get binary requirements
   */
  static getBinaryRequirements() {
    return [..._BinaryDetector.BINARY_REQUIREMENTS];
  }
};
__name(_BinaryDetector, "BinaryDetector");
__publicField(_BinaryDetector, "BINARY_REQUIREMENTS", [
  {
    name: "adb",
    required: true,
    downloadUrl: (_a = getBinaryConfig("adb")) == null ? void 0 : _a.downloadUrls.github
  },
  {
    name: "scrcpy",
    required: true,
    downloadUrl: (_b = getBinaryConfig("scrcpy")) == null ? void 0 : _b.downloadUrls.github
  }
]);
var BinaryDetector = _BinaryDetector;

// src/managers/binaryDownloader.ts
var https = __toESM(require("https"));
var http = __toESM(require("http"));
var fs2 = __toESM(require("fs/promises"));
var path3 = __toESM(require("path"));
var import_fs = require("fs");
var _BinaryDownloader = class _BinaryDownloader {
  downloadDir;
  progressCallback;
  constructor(downloadDir) {
    this.downloadDir = downloadDir;
  }
  /**
   * Set progress callback for download updates
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }
  /**
   * Download multiple binaries
   */
  async downloadBinaries(requirements) {
    const results = [];
    await this.ensureDownloadDirectory();
    for (const requirement of requirements) {
      const result = await this.downloadSingleBinary(requirement);
      results.push(result);
    }
    return results;
  }
  /**
   * Download a single binary
   */
  async downloadSingleBinary(requirement) {
    try {
      if (!requirement.downloadUrl) {
        return {
          success: false,
          binary: requirement.name,
          error: "No download URL provided"
        };
      }
      const downloadUrl = this.getDownloadUrl(requirement);
      const outputPath = this.getOutputPath(requirement.name);
      await fs2.mkdir(path3.dirname(outputPath), { recursive: true });
      await this.downloadFile(downloadUrl, outputPath, requirement.name);
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        await PlatformUtils.makeExecutable(outputPath);
      }
      return {
        success: true,
        binary: requirement.name,
        path: outputPath
      };
    } catch (error) {
      return {
        success: false,
        binary: requirement.name,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Check if a binary is already downloaded
   */
  async isBinaryDownloaded(binaryName) {
    try {
      const outputPath = this.getOutputPath(binaryName);
      await fs2.access(outputPath);
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        return await PlatformUtils.isExecutable(outputPath);
      }
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get the path where a binary would be downloaded
   */
  getDownloadedBinaryPath(binaryName) {
    return this.getOutputPath(binaryName);
  }
  /**
   * Clean up downloaded binaries
   */
  async cleanupDownloads() {
    try {
      await fs2.rm(this.downloadDir, { recursive: true, force: true });
    } catch (error) {
    }
  }
  /**
   * Get download URLs based on platform and binary
   */
  getDownloadUrl(requirement) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const arch2 = PlatformUtils.getCurrentArchitecture();
    const configUrl = getDownloadUrl(requirement.name, "github");
    if (configUrl) {
      const fileName = getBinaryPattern(requirement.name, platform2, arch2);
      return `${configUrl}/${fileName}`;
    }
    if (requirement.downloadUrl) {
      const extension = PlatformUtils.getBinaryExtension();
      const fileName = `${requirement.name}-${platform2}-${arch2}${extension}`;
      if (requirement.downloadUrl.includes("github.com")) {
        return `${requirement.downloadUrl}/${fileName}`;
      } else {
        return `${requirement.downloadUrl}/${fileName}`;
      }
    }
    throw new Error(`No download URL configured for ${requirement.name}`);
  }
  /**
   * Get the output path for a binary
   */
  getOutputPath(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path3.join(this.downloadDir, platform2, `${binaryName}${extension}`);
  }
  /**
   * Ensure download directory exists
   */
  async ensureDownloadDirectory() {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const platformDir = path3.join(this.downloadDir, platform2);
    await fs2.mkdir(platformDir, { recursive: true });
  }
  /**
   * Download a file from URL to local path
   */
  async downloadFile(url, outputPath, binaryName) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith("https:") ? https : http;
      const request = client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.downloadFile(redirectUrl, outputPath, binaryName).then(resolve).catch(reject);
            return;
          }
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }
        const totalSize = parseInt(response.headers["content-length"] || "0", 10);
        let downloadedSize = 0;
        const fileStream = (0, import_fs.createWriteStream)(outputPath);
        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          if (this.progressCallback && totalSize > 0) {
            this.progressCallback({
              binary: binaryName,
              downloaded: downloadedSize,
              total: totalSize,
              percentage: Math.round(downloadedSize / totalSize * 100)
            });
          }
        });
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
        fileStream.on("error", (error) => {
          fs2.unlink(outputPath).catch(() => {
          });
          reject(error);
        });
      });
      request.on("error", (error) => {
        reject(error);
      });
      request.setTimeout(3e4, () => {
        request.destroy();
        reject(new Error("Download timeout"));
      });
    });
  }
};
__name(_BinaryDownloader, "BinaryDownloader");
var BinaryDownloader = _BinaryDownloader;

// src/managers/binaryManager.ts
var path4 = __toESM(require("path"));
var fs3 = __toESM(require("fs/promises"));
var _BinaryManager = class _BinaryManager {
  extensionPath;
  configManager;
  binaryDetector;
  binaryDownloader;
  detectionCache = /* @__PURE__ */ new Map();
  downloadProgressCallback;
  constructor(extensionPath, configManager2) {
    this.extensionPath = extensionPath;
    this.configManager = configManager2;
    this.binaryDetector = new BinaryDetector(extensionPath);
    this.binaryDownloader = new BinaryDownloader(this.binaryDetector.getDownloadDir());
  }
  /**
   * Set download progress callback
   */
  setDownloadProgressCallback(callback) {
    this.downloadProgressCallback = callback;
    this.binaryDownloader.setProgressCallback(callback);
  }
  /**
   * Get the path to the ADB binary (custom, system, or downloaded)
   */
  async getAdbPath() {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    const detection = await this.getOrDetectBinary("adb");
    if (detection.found && detection.path) {
      return detection.path;
    }
    throw new Error("ADB binary not found. Please install ADB or set a custom path in settings.");
  }
  /**
   * Get the path to the scrcpy binary (custom, system, or downloaded)
   */
  async getScrcpyPath() {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    const detection = await this.getOrDetectBinary("scrcpy");
    if (detection.found && detection.path) {
      return detection.path;
    }
    throw new Error("Scrcpy binary not found. Please install scrcpy or set a custom path in settings.");
  }
  /**
   * Get the path to the ADB binary (synchronous version for backward compatibility)
   * @deprecated Use getAdbPath() instead
   */
  getAdbPathSync() {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath("adb");
  }
  /**
   * Get the path to the scrcpy binary (synchronous version for backward compatibility)
   * @deprecated Use getScrcpyPath() instead
   */
  getScrcpyPathSync() {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath("scrcpy");
  }
  /**
   * Ensure all required binaries are available, downloading if necessary
   */
  async ensureBinariesAvailable() {
    const errors = [];
    try {
      const detectionStatus = await this.getDetectionStatus();
      const missingBinaries = [];
      for (const requirement of BinaryDetector.getBinaryRequirements()) {
        const detection = detectionStatus.get(requirement.name);
        if (!(detection == null ? void 0 : detection.found)) {
          missingBinaries.push(requirement);
        }
      }
      if (missingBinaries.length === 0) {
        return { success: true, errors: [] };
      }
      const downloadResults = await this.binaryDownloader.downloadBinaries(missingBinaries);
      for (const result of downloadResults) {
        if (!result.success) {
          errors.push(`Failed to download ${result.binary}: ${result.error}`);
        }
      }
      this.detectionCache.clear();
      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Binary management error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, errors };
    }
  }
  /**
   * Validate that required binaries exist and are executable
   */
  async validateBinaries() {
    const errors = [];
    let adbValid = false;
    let scrcpyValid = false;
    try {
      const ensureResult = await this.ensureBinariesAvailable();
      if (!ensureResult.success) {
        errors.push(...ensureResult.errors);
      }
      try {
        const adbPath = await this.getAdbPath();
        adbValid = await this.validateBinary(adbPath, "adb");
        if (!adbValid) {
          errors.push(`ADB binary not found or not executable: ${adbPath}`);
        }
      } catch (error) {
        errors.push(`Error validating ADB binary: ${error instanceof Error ? error.message : String(error)}`);
      }
      try {
        const scrcpyPath = await this.getScrcpyPath();
        scrcpyValid = await this.validateBinary(scrcpyPath, "scrcpy");
        if (!scrcpyValid) {
          errors.push(`Scrcpy binary not found or not executable: ${scrcpyPath}`);
        }
      } catch (error) {
        errors.push(`Error validating scrcpy binary: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      errors.push(`Binary validation error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return {
      adbValid,
      scrcpyValid,
      errors
    };
  }
  /**
   * Get information about binary paths and their sources
   */
  async getBinaryInfo() {
    const customAdbPath = this.configManager.getCustomAdbPath();
    const customScrcpyPath = this.configManager.getCustomScrcpyPath();
    const adbDetection = await this.getOrDetectBinary("adb");
    const scrcpyDetection = await this.getOrDetectBinary("scrcpy");
    return {
      adb: {
        path: customAdbPath || adbDetection.path || "Not found",
        isCustom: !!customAdbPath,
        bundledPath: this.getBundledBinaryPath("adb"),
        source: customAdbPath ? "custom" : adbDetection.source,
        version: adbDetection.version
      },
      scrcpy: {
        path: customScrcpyPath || scrcpyDetection.path || "Not found",
        isCustom: !!customScrcpyPath,
        bundledPath: this.getBundledBinaryPath("scrcpy"),
        source: customScrcpyPath ? "custom" : scrcpyDetection.source,
        version: scrcpyDetection.version
      }
    };
  }
  /**
   * Get detection status for all binaries (includes bundled fallback)
   */
  async getDetectionStatus() {
    const results = /* @__PURE__ */ new Map();
    for (const requirement of BinaryDetector.getBinaryRequirements()) {
      const detection = await this.getOrDetectBinary(requirement.name);
      results.set(requirement.name, detection);
    }
    return results;
  }
  /**
   * Force re-detection of binaries (clears cache)
   */
  async refreshDetection() {
    this.detectionCache.clear();
  }
  /**
   * Check if binary downloads are needed (considers bundled binaries)
   */
  async needsDownload() {
    const detectionStatus = await this.getDetectionStatus();
    const missingBinaries = [];
    for (const requirement of BinaryDetector.getBinaryRequirements()) {
      const detection = detectionStatus.get(requirement.name);
      if (!(detection == null ? void 0 : detection.found)) {
        missingBinaries.push(requirement.name);
      }
    }
    return {
      needed: missingBinaries.length > 0,
      binaries: missingBinaries
    };
  }
  /**
   * Check binary integrity and platform compatibility
   */
  async checkBinaryIntegrity() {
    const errors = [];
    let adbIntegrity = false;
    let scrcpyIntegrity = false;
    try {
      if (!PlatformUtils.isSupportedPlatform()) {
        errors.push(`Unsupported platform: ${PlatformUtils.getCurrentPlatform()}`);
        return { adb: false, scrcpy: false, errors };
      }
      const adbPath = await this.getAdbPath();
      adbIntegrity = await this.checkSingleBinaryIntegrity(adbPath, "adb");
      if (!adbIntegrity) {
        errors.push(`ADB binary integrity check failed: ${adbPath}`);
      }
      const scrcpyPath = await this.getScrcpyPath();
      scrcpyIntegrity = await this.checkSingleBinaryIntegrity(scrcpyPath, "scrcpy");
      if (!scrcpyIntegrity) {
        errors.push(`Scrcpy binary integrity check failed: ${scrcpyPath}`);
      }
    } catch (error) {
      errors.push(`Binary integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { adb: adbIntegrity, scrcpy: scrcpyIntegrity, errors };
  }
  /**
   * Get platform-specific binary information
   */
  getPlatformInfo() {
    return {
      platform: PlatformUtils.getCurrentPlatform(),
      architecture: PlatformUtils.getCurrentArchitecture(),
      binaryExtension: PlatformUtils.getBinaryExtension(),
      supportsExecutablePermissions: PlatformUtils.supportsFeature("executable-permissions")
    };
  }
  /**
   * Get or detect a binary (with caching)
   */
  async getOrDetectBinary(binaryName) {
    if (this.detectionCache.has(binaryName)) {
      return this.detectionCache.get(binaryName);
    }
    let detection = await this.binaryDetector.detectSingleBinary(binaryName);
    this.detectionCache.set(binaryName, detection);
    return detection;
  }
  /**
   * Get the path where a binary would be if it were bundled (for compatibility)
   * Note: We no longer bundle binaries - this is kept for interface compatibility
   */
  getBundledBinaryPath(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path4.join(
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
      const stats = await fs3.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
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
  /**
   * Check integrity of a single binary file
   */
  async checkSingleBinaryIntegrity(binaryPath, binaryName) {
    try {
      const stats = await fs3.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }
      if (stats.size === 0) {
        return false;
      }
      const platform2 = PlatformUtils.getCurrentPlatform();
      if (platform2 === "win32") {
        const expectedExtension = PlatformUtils.getBinaryExtension();
        if (expectedExtension && !binaryPath.endsWith(expectedExtension)) {
          return false;
        }
      } else {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          try {
            await PlatformUtils.makeExecutable(binaryPath);
            return await PlatformUtils.isExecutable(binaryPath);
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
__name(_BinaryManager, "BinaryManager");
var BinaryManager3 = _BinaryManager;

// src/managers/logger.ts
var vscode4 = __toESM(require("vscode"));
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["ERROR"] = 2] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
var _Logger = class _Logger {
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
__name(_Logger, "Logger");
var Logger4 = _Logger;

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

// src/utils/themeManager.ts
var vscode6 = __toESM(require("vscode"));
var ThemeKind = /* @__PURE__ */ ((ThemeKind3) => {
  ThemeKind3[ThemeKind3["Light"] = 1] = "Light";
  ThemeKind3[ThemeKind3["Dark"] = 2] = "Dark";
  ThemeKind3[ThemeKind3["HighContrast"] = 3] = "HighContrast";
  ThemeKind3[ThemeKind3["HighContrastLight"] = 4] = "HighContrastLight";
  return ThemeKind3;
})(ThemeKind || {});
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
    const colorTheme = vscode6.window.activeColorTheme;
    switch (colorTheme.kind) {
      case vscode6.ColorThemeKind.Light:
        return 1 /* Light */;
      case vscode6.ColorThemeKind.Dark:
        return 2 /* Dark */;
      case vscode6.ColorThemeKind.HighContrast:
        return 3 /* HighContrast */;
      case vscode6.ColorThemeKind.HighContrastLight:
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
    const disposable = vscode6.window.onDidChangeActiveColorTheme((colorTheme) => {
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
      case vscode6.ColorThemeKind.Light:
        return 1 /* Light */;
      case vscode6.ColorThemeKind.Dark:
        return 2 /* Dark */;
      case vscode6.ColorThemeKind.HighContrast:
        return 3 /* HighContrast */;
      case vscode6.ColorThemeKind.HighContrastLight:
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
    return vscode6.Uri.joinPath(extensionUri, "media", "icons", themeFolder, `${iconName}.svg`);
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

// src/providers/sidebarProvider.ts
var vscode7 = __toESM(require("vscode"));
var _DroidBridgeSidebarProvider = class _DroidBridgeSidebarProvider {
  constructor(_extensionUri, _context, configManager2) {
    this._extensionUri = _extensionUri;
    this._context = _context;
    this.configManager = configManager2;
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
  scrcpySidebarState = { isRunning: false };
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
            vscode7.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "disconnectDevice":
            vscode7.commands.executeCommand("droidbridge.disconnectDevice");
            break;
          case "launchScrcpy":
            vscode7.commands.executeCommand("droidbridge.launchScrcpy");
            break;
          case "launchScrcpyScreenOff":
            vscode7.commands.executeCommand("droidbridge.launchScrcpyScreenOff");
            break;
          case "stopScrcpy":
            vscode7.commands.executeCommand("droidbridge.stopScrcpy");
            break;
          case "showLogs":
            vscode7.commands.executeCommand("droidbridge.showLogs");
            break;
          case "ipChanged":
            this.currentIp = message.value;
            break;
          case "portChanged":
            this.currentPort = message.value;
            break;
          case "connectFromHistory":
            vscode7.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "removeFromHistory":
            this.connectionHistory.removeConnection(message.id);
            this._updateWebviewState();
            break;
          case "clearHistory":
            this.connectionHistory.clearHistory();
            this._updateWebviewState();
            break;
          case "pairManual":
            if (message.host && message.port && message.code) {
              const hostPort = `${message.host}:${message.port}`;
              vscode7.commands.executeCommand("droidbridge.pairDevice", hostPort, message.code);
            }
            break;
          case "ejectScrcpySidebar":
            vscode7.commands.executeCommand("droidbridge.ejectScrcpySidebar");
            break;
          case "embedScrcpySidebar":
            vscode7.commands.executeCommand("droidbridge.embedScrcpySidebar");
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
    const scriptUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "main.js"));
    const styleResetUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "reset.css"));
    const styleVSCodeUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
    const styleMainUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "main.css"));
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

          <!-- Scrcpy Sidebar Mirror Section -->
          <div class="section" id="scrcpy-sidebar-section" ${this.scrcpySidebarState.isRunning ? "" : 'style="display: none;"'}>
            <div class="section-header">
              <span class="codicon codicon-device-mobile section-icon"></span>
              <h3>Scrcpy Mirror</h3>
              <div class="section-actions">
                <button id="eject-scrcpy-btn" class="icon-button" title="Eject to External Window">
                  <span class="codicon codicon-window"></span>
                </button>
                <button id="close-scrcpy-btn" class="icon-button" title="Close Scrcpy">
                  <span class="codicon codicon-close"></span>
                </button>
              </div>
            </div>
            <div class="section-content">
              <div id="scrcpy-container" class="scrcpy-mirror-container">
                <div id="scrcpy-placeholder" class="scrcpy-placeholder">
                  <span class="codicon codicon-device-mobile"></span>
                  <p>Scrcpy mirror will appear here when launched</p>
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
                <br />1. On Android: <em>Developer options \u2192 Wireless debugging \u2192 Pair device with pairing code</em>
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
        connectionHistory: this.connectionHistory.getRecentConnections(),
        scrcpySidebar: this.scrcpySidebarState
      });
    }
  }
  showScrcpySidebar(isRunning, processId, windowId) {
    this.scrcpySidebarState = {
      isRunning,
      processId,
      windowId
    };
    if (this._view) {
      this._view.webview.postMessage({
        type: "scrcpySidebarUpdate",
        state: this.scrcpySidebarState
      });
      this._updateWebviewState();
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
    this.scrcpySidebarState = { isRunning: false };
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
      currentPort: this.currentPort,
      scrcpySidebar: this.scrcpySidebarState
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

// src/extension.ts
var vscode8 = __toESM(require("vscode"));
var extensionState;
var logger;
var commandManager;
var processManager;
var configManager;
var binaryManager;
var sidebarProvider;
var themeManager;
function activate(context) {
  logger = new Logger4();
  logger.info("DroidBridge extension is activating...");
  try {
    initializeManagers(context);
    initializeExtensionState();
    registerVSCodeComponents(context);
    setupConfigurationWatchers(context);
    validateBinariesAsync();
    extensionState.initialized = true;
    logger.info("DroidBridge extension activated successfully");
  } catch (error) {
    logger.error("Failed to activate DroidBridge extension", error);
    vscode8.window.showErrorMessage("Failed to activate DroidBridge extension. Check the logs for details.");
    throw error;
  }
}
__name(activate, "activate");
function initializeManagers(context) {
  logger.info("Initializing manager classes...");
  configManager = new ConfigManager2();
  logger.debug("ConfigManager initialized");
  themeManager = ThemeManager.getInstance();
  logger.debug("ThemeManager initialized");
  binaryManager = new BinaryManager3(context.extensionPath, configManager);
  logger.debug("BinaryManager initialized");
  processManager = new ProcessManager2(binaryManager, logger);
  logger.debug("ProcessManager initialized");
  sidebarProvider = new DroidBridgeSidebarProvider(
    vscode8.Uri.file(context.extensionPath),
    context,
    configManager
  );
  logger.debug("DroidBridgeSidebarProvider initialized");
  logger.info(`Sidebar provider class loaded with viewType=${DroidBridgeSidebarProvider.viewType}`);
  commandManager = new CommandManager(processManager, configManager, logger, binaryManager, sidebarProvider);
  logger.debug("CommandManager initialized");
  commandManager.setSidebarProvider(sidebarProvider);
  logger.debug("Manager cross-references established");
}
__name(initializeManagers, "initializeManagers");
function initializeExtensionState() {
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
  logger.debug("Extension state initialized");
}
__name(initializeExtensionState, "initializeExtensionState");
function registerVSCodeComponents(context) {
  logger.info("Registering VSCode components...");
  const sidebarDisposable = vscode8.window.registerWebviewViewProvider(
    DroidBridgeSidebarProvider.viewType,
    // Keep in sync with package.json
    sidebarProvider
  );
  logger.debug(`Registered webview view provider for id: ${DroidBridgeSidebarProvider.viewType}`);
  logger.info("Sidebar provider registration complete");
  context.subscriptions.push(sidebarDisposable);
  logger.debug("Sidebar webview provider registered");
  commandManager.registerCommands(context);
  logger.debug("All commands registered");
  logger.info("All VSCode components registered successfully");
}
__name(registerVSCodeComponents, "registerVSCodeComponents");
function setupConfigurationWatchers(context) {
  logger.info("Setting up configuration watchers...");
  const configDisposable = configManager.onConfigurationChanged(() => {
    logger.info("Configuration changed, refreshing extension state");
    sidebarProvider.refresh();
    validateBinariesAsync();
  });
  context.subscriptions.push(configDisposable);
  logger.debug("Configuration watchers set up");
}
__name(setupConfigurationWatchers, "setupConfigurationWatchers");
function validateBinariesAsync() {
  binaryManager.setDownloadProgressCallback((progress) => {
    logger.info(`Downloading ${progress.binary}: ${progress.percentage}% (${progress.downloaded}/${progress.total} bytes)`);
  });
  binaryManager.validateBinaries().then((result) => {
    extensionState.binariesValidated = result.adbValid && result.scrcpyValid;
    if (extensionState.binariesValidated) {
      logger.info("All binaries validated successfully");
      binaryManager.getBinaryInfo().then((info) => {
        logger.info(`ADB: ${info.adb.path} (${info.adb.source}${info.adb.version ? `, v${info.adb.version}` : ""})`);
        logger.info(`Scrcpy: ${info.scrcpy.path} (${info.scrcpy.source}${info.scrcpy.version ? `, v${info.scrcpy.version}` : ""})`);
      });
    } else {
      logger.error("Binary validation failed", new Error(result.errors.join(", ")));
      binaryManager.needsDownload().then((downloadInfo) => {
        if (downloadInfo.needed) {
          vscode8.window.showWarningMessage(
            `DroidBridge needs to download missing binaries: ${downloadInfo.binaries.join(", ")}. This will happen automatically when needed.`,
            "Show Logs"
          ).then((selection) => {
            if (selection === "Show Logs") {
              logger.show();
            }
          });
        } else {
          vscode8.window.showWarningMessage(
            "Some DroidBridge binaries are not available. Check the logs for details.",
            "Show Logs"
          ).then((selection) => {
            if (selection === "Show Logs") {
              logger.show();
            }
          });
        }
      });
    }
  }).catch((error) => {
    logger.error("Failed to validate binaries", error);
    extensionState.binariesValidated = false;
  });
}
__name(validateBinariesAsync, "validateBinariesAsync");
async function deactivate() {
  if (logger) {
    logger.info("DroidBridge extension is deactivating...");
  }
  const cleanupTasks = [];
  try {
    if (commandManager) {
      logger.debug("Disposing command manager...");
      commandManager.dispose();
    }
    if (sidebarProvider) {
      logger.debug("Disposing sidebar provider...");
      sidebarProvider.dispose();
    }
    if (processManager) {
      logger.debug("Cleaning up process manager...");
      cleanupTasks.push(processManager.cleanup());
    }
    await Promise.all(cleanupTasks);
    if (themeManager) {
      logger.debug("Disposing theme manager...");
      themeManager.dispose();
    }
    if (extensionState) {
      extensionState.initialized = false;
      extensionState.binariesValidated = false;
      extensionState.connection.connected = false;
      extensionState.scrcpy.running = false;
    }
    if (logger) {
      logger.info("DroidBridge extension deactivated successfully");
      logger.dispose();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error during extension deactivation:", errorMessage);
    if (logger) {
      try {
        logger.error("Error during extension deactivation", error instanceof Error ? error : void 0);
      } catch (logError) {
        console.error("Failed to log deactivation error:", logError);
      }
    }
  } finally {
    extensionState = void 0;
    logger = void 0;
    commandManager = void 0;
    processManager = void 0;
    configManager = void 0;
    binaryManager = void 0;
    sidebarProvider = void 0;
    themeManager = void 0;
  }
}
__name(deactivate, "deactivate");
function getExtensionState() {
  return extensionState;
}
__name(getExtensionState, "getExtensionState");
function getLogger() {
  return logger;
}
__name(getLogger, "getLogger");
function isExtensionInitialized() {
  return (extensionState == null ? void 0 : extensionState.initialized) === true;
}
__name(isExtensionInitialized, "isExtensionInitialized");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate,
  getExtensionState,
  getLogger,
  isExtensionInitialized
});
//# sourceMappingURL=extension.js.map
