import * as vscode from 'vscode';
import { Logger } from '../managers/logger';

/**
 * Error categories for better error handling and user feedback
 */
export enum ErrorCategory {
  CONFIGURATION = 'configuration',
  CONNECTION = 'connection',
  PROCESS = 'process',
  SYSTEM = 'system',
  VALIDATION = 'validation',
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestedActions: string[];
  technicalDetails?: string;
  originalError?: Error;
}

/**
 * Progress operation context
 */
export interface ProgressContext {
  title: string;
  cancellable: boolean;
  location: vscode.ProgressLocation;
}

/**
 * Comprehensive error handler for DroidBridge extension
 * Implements requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export class ErrorHandler {
  private logger: Logger;
  private activeProgressOperations: Map<string, vscode.CancellationTokenSource> = new Map();
  private errorStats: Map<ErrorCategory, number> = new Map();
  private config: {
    showNotifications: boolean;
    logLevel: string;
  } = {
    showNotifications: true,
    logLevel: 'info'
  };

  constructor(logger: Logger) {
    this.logger = logger;
    // Initialize error statistics
    Object.values(ErrorCategory).forEach(category => {
      this.errorStats.set(category, 0);
    });
  }

  /**
   * Handle configuration-related errors
   * Requirement 8.4: Handle invalid inputs
   */
  handleConfigurationError(error: Error, setting?: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.MEDIUM,
      message: `Configuration error${setting ? ` in ${setting}` : ''}`,
      userMessage: 'Invalid configuration detected',
      suggestedActions: [
        'Check your extension settings',
        'Verify IP address and port format',
        'Reset to default values if needed'
      ],
      technicalDetails: error.message,
      originalError: error
    };

    // Specific handling for different configuration errors
    if (error.message.includes('IP address')) {
      errorInfo.userMessage = 'Invalid IP address format';
      errorInfo.suggestedActions = [
        'Use format: 192.168.1.100 or localhost',
        'Check your device\'s IP address in settings',
        'Ensure device is on the same network'
      ];
    } else if (error.message.includes('port')) {
      errorInfo.userMessage = 'Invalid port number';
      errorInfo.suggestedActions = [
        'Use a port number between 1 and 65535',
        'Common ADB ports: 5555, 5037',
        'Check your device\'s wireless debugging port'
      ];
    } else if (error.message.includes('binary') || error.message.includes('path')) {
      errorInfo.category = ErrorCategory.BINARY;
      errorInfo.userMessage = 'Binary path configuration error';
      errorInfo.suggestedActions = [
        'Check if custom binary paths exist',
        'Verify file permissions',
        'Reset to use bundled binaries'
      ];
    }

    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle connection-related errors
   * Requirement 8.5: Handle offline devices and network issues
   */
  handleConnectionError(error: Error, context?: { ip?: string; port?: string }): ErrorInfo {
    const target = context ? `${context.ip}:${context.port}` : 'device';
    
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.CONNECTION,
      severity: ErrorSeverity.HIGH,
      message: `Connection failed to ${target}`,
      userMessage: 'Failed to connect to Android device',
      suggestedActions: [
        'Check device IP address and port',
        'Ensure device is on the same network',
        'Enable wireless debugging on device',
        'Try connecting via USB first'
      ],
      technicalDetails: error.message,
      originalError: error
    };

    // Specific handling for different connection errors
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('connection refused')) {
      errorInfo.severity = ErrorSeverity.HIGH;
      errorInfo.userMessage = 'Device refused connection';
      errorInfo.suggestedActions = [
        'Enable wireless debugging on your device',
        'Check if the port is correct',
        'Restart ADB on your device',
        'Try pairing the device first'
      ];
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      errorInfo.severity = ErrorSeverity.MEDIUM;
      errorInfo.userMessage = 'Connection timeout';
      errorInfo.suggestedActions = [
        'Check network connectivity',
        'Move device closer to router',
        'Restart wireless debugging',
        'Try a different network'
      ];
    } else if (errorMessage.includes('no route to host')) {
      errorInfo.severity = ErrorSeverity.HIGH;
      errorInfo.userMessage = 'Device not reachable';
      errorInfo.suggestedActions = [
        'Verify the IP address is correct',
        'Check if device is on the same network',
        'Ping the device to test connectivity',
        'Check firewall settings'
      ];
    } else if (errorMessage.includes('unauthorized')) {
      errorInfo.severity = ErrorSeverity.MEDIUM;
      errorInfo.userMessage = 'Device authorization required';
      errorInfo.suggestedActions = [
        'Accept debugging authorization on device',
        'Check device screen for permission dialog',
        'Try connecting via USB first',
        'Clear ADB keys and reconnect'
      ];
    } else if (errorMessage.includes('offline')) {
      errorInfo.severity = ErrorSeverity.HIGH;
      errorInfo.userMessage = 'Device is offline';
      errorInfo.suggestedActions = [
        'Check device connection',
        'Restart wireless debugging',
        'Reconnect device to network',
        'Try USB connection'
      ];
    }

    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle process execution errors
   * Requirement 8.6: Handle process failures
   */
  handleProcessError(error: Error, processName: string, context?: any): ErrorInfo {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.PROCESS,
      severity: ErrorSeverity.HIGH,
      message: `${processName} process failed`,
      userMessage: `Failed to execute ${processName}`,
      suggestedActions: [
        'Check if binaries are properly installed',
        'Verify file permissions',
        'Try restarting the extension',
        'Check the logs for more details'
      ],
      technicalDetails: error.message,
      originalError: error
    };

    // Specific handling for different process types
    if (processName.toLowerCase().includes('adb')) {
      errorInfo.userMessage = 'ADB command failed';
      errorInfo.suggestedActions = [
        'Check if ADB is properly installed',
        'Verify device connection',
        'Restart ADB server',
        'Check device authorization'
      ];
    } else if (processName.toLowerCase().includes('scrcpy')) {
      if (error.message.includes('already running')) {
        errorInfo.severity = ErrorSeverity.MEDIUM;
        errorInfo.userMessage = 'Screen mirroring already active';
        errorInfo.suggestedActions = [
          'Stop the current scrcpy instance first',
          'Check for existing scrcpy windows',
          'Wait a moment and try again'
        ];
      } else if (error.message.toLowerCase().includes('device not found')) {
        errorInfo.severity = ErrorSeverity.HIGH;
        errorInfo.userMessage = 'No device found for screen mirroring';
        errorInfo.suggestedActions = [
          'Connect to device first',
          'Check device connection status',
          'Enable USB debugging',
          'Try reconnecting the device'
        ];
      } else {
        errorInfo.userMessage = 'Screen mirroring failed';
        errorInfo.suggestedActions = [
          'Check if scrcpy is properly installed',
          'Verify device supports screen mirroring',
          'Try connecting device via USB',
          'Check device permissions'
        ];
      }
    }

    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle system-level errors
   */
  handleSystemError(error: Error, context?: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      message: `System error${context ? ` in ${context}` : ''}`,
      userMessage: 'System error occurred',
      suggestedActions: [
        'Restart VSCode',
        'Check system resources',
        'Update the extension',
        'Report the issue if it persists'
      ],
      technicalDetails: error.message,
      originalError: error
    };

    // Specific handling for system errors
    if (error.message.toLowerCase().includes('permission')) {
      errorInfo.category = ErrorCategory.BINARY;
      errorInfo.severity = ErrorSeverity.HIGH;
      errorInfo.userMessage = 'Permission denied';
      errorInfo.suggestedActions = [
        'Check file permissions',
        'Run VSCode with appropriate permissions',
        'Verify binary executable permissions',
        'Check antivirus software'
      ];
    } else if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      errorInfo.category = ErrorCategory.BINARY;
      errorInfo.severity = ErrorSeverity.HIGH;
      errorInfo.userMessage = 'Required file not found';
      errorInfo.suggestedActions = [
        'Reinstall the extension',
        'Check if binaries are present',
        'Verify installation integrity',
        'Check custom binary paths'
      ];
    }

    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }

  /**
   * Handle validation errors
   * Requirement 8.4: Handle invalid inputs
   */
  handleValidationError(field: string, value: string, expectedFormat?: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      message: `Validation failed for ${field}`,
      userMessage: `Invalid ${field} format`,
      suggestedActions: [
        expectedFormat ? `Use format: ${expectedFormat}` : 'Check the input format',
        'Refer to documentation for examples',
        'Use default values if unsure'
      ],
      technicalDetails: `Invalid value: ${value}`
    };

    // Specific validation error messages
    if (field.toLowerCase().includes('ip')) {
      errorInfo.suggestedActions = [
        'Use format: 192.168.1.100',
        'Use "localhost" for local connections',
        'Check device network settings'
      ];
    } else if (field.toLowerCase().includes('port')) {
      errorInfo.suggestedActions = [
        'Use a number between 1 and 65535',
        'Common ADB port: 5555',
        'Check device wireless debugging settings'
      ];
    }

    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }

  /**
   * Show progress indicator for long-running operations
   * Requirement 8.1: Show appropriate progress indicators
   */
  async showProgress<T>(
    operation: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>,
    context: ProgressContext,
    operationId?: string
  ): Promise<T> {
    // Cancel any existing operation with the same ID
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
          // Use the provided token for cancellation checking
          
          if (token.isCancellationRequested || tokenSource.token.isCancellationRequested) {
            throw new Error('Operation cancelled by user');
          }

          return await operation(progress, token);
        }
      );

      this.logger.info(`Progress operation completed: ${context.title}`);
      return result;

    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger.info(`Progress operation cancelled: ${context.title}`);
        this.showWarning('Operation cancelled by user');
      } else {
        this.logger.error(`Progress operation failed: ${context.title}`, error instanceof Error ? error : undefined);
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
  cancelProgress(operationId: string): void {
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
  cancelAllProgress(): void {
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
  showSuccess(message: string, details?: string): void {
    const fullMessage = details ? `${message} - ${details}` : message;
    this.logger.showSuccess(fullMessage);
  }

  /**
   * Show error notification with user-friendly message and actions
   * Requirement 8.3: Show error notifications with specific error details
   */
  showError(message: string, actions?: string[]): void {
    this.logger.showError(message);
    
    // Show additional actions if provided
    if (actions && actions.length > 0) {
      const actionMessage = `Suggested actions: ${actions.join(', ')}`;
      this.logger.info(actionMessage);
    }
  }

  /**
   * Show warning notification
   */
  showWarning(message: string): void {
    this.logger.showWarning(message);
  }

  /**
   * Show information notification
   */
  showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
    this.logger.info(message);
  }

  /**
   * Show error with action buttons
   */
  async showErrorWithActions(message: string, actions: { title: string; action: () => void }[]): Promise<void> {
    const actionTitles = actions.map(a => a.title);
    const selectedAction = await vscode.window.showErrorMessage(message, ...actionTitles);
    
    if (selectedAction) {
      const action = actions.find(a => a.title === selectedAction);
      if (action) {
        try {
          await action.action();
        } catch (error) {
          this.logger.error('Action execution failed', error instanceof Error ? error : undefined);
        }
      }
    }
  }

  /**
   * Validate and handle edge cases for user inputs
   * Requirement 8.4: Handle edge cases like invalid inputs
   */
  validateAndHandleInput(input: string, type: 'ip' | 'port', fieldName: string): { isValid: boolean; error?: ErrorInfo } {
    if (!input || input.trim().length === 0) {
      const error = this.handleValidationError(fieldName, input, `Non-empty ${type}`);
      return { isValid: false, error };
    }

    const trimmedInput = input.trim();

    if (type === 'ip') {
      // Allow localhost and valid IP addresses
      if (trimmedInput === 'localhost' || trimmedInput === '127.0.0.1') {
        return { isValid: true };
      }

      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(trimmedInput)) {
        const error = this.handleValidationError(fieldName, trimmedInput, '192.168.1.100 or localhost');
        return { isValid: false, error };
      }
    } else if (type === 'port') {
      const portNum = parseInt(trimmedInput, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        const error = this.handleValidationError(fieldName, trimmedInput, '1-65535');
        return { isValid: false, error };
      }
    }

    return { isValid: true };
  }

  /**
   * Handle multiple errors with categorization
   */
  handleMultipleErrors(errors: Error[], context: string): ErrorInfo[] {
    const errorInfos: ErrorInfo[] = [];

    for (const error of errors) {
      let errorInfo: ErrorInfo;

      // Categorize error based on message content
      if (error.message.includes('Connection failed') || error.message.includes('network')) {
        errorInfo = this.handleConnectionError(error);
      } else if (error.message.includes('Invalid configuration') || error.message.includes('config')) {
        errorInfo = this.handleConfigurationError(error);
      } else if (error.message.includes('Process spawn error') || error.message.includes('spawn')) {
        errorInfo = this.handleSystemError(error, context);
      } else {
        errorInfo = this.handleSystemError(error, context);
      }

      errorInfos.push(errorInfo);
    }

    // Show summary if multiple errors
    if (errorInfos.length > 1) {
      const summary = `Multiple errors occurred in ${context}: ${errorInfos.length} issues found`;
      this.showError(summary);
    }

    return errorInfos;
  }



  /**
   * Categorize error based on its message and type
   */
  categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    // Connection errors - highest priority for network-related issues
    if (message.includes('connection') || message.includes('network') || 
        message.includes('timeout') || message.includes('refused') ||
        message.includes('unreachable') || message.includes('offline') ||
        message.includes('no route to host') || message.includes('timed out')) {
      return ErrorCategory.CONNECTION;
    }
    
    // System errors - for file system and permission issues (check first for specific system errors)
    if (message.includes('permission') || message.includes('enoent') ||
        message.includes('eacces') || message.includes('binary') ||
        message.includes('not found') || message.includes('exec format error') ||
        message.includes('operation not permitted')) {
      return ErrorCategory.SYSTEM;
    }
    
    // Process errors - for execution and runtime issues
    if (message.includes('spawn') || message.includes('process') || 
        message.includes('exited') || message.includes('emfile') ||
        message.includes('crashed') || message.includes('memory')) {
      return ErrorCategory.PROCESS;
    }
    
    // Configuration errors - for settings and validation issues
    if (message.includes('invalid') || message.includes('format') ||
        message.includes('port out of range') || message.includes('config') ||
        message.includes('setting')) {
      return ErrorCategory.CONFIGURATION;
    }
    
    return ErrorCategory.UNKNOWN; // Default fallback
  }

  /**
   * Assess error severity based on its impact
   */
  assessSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    // Critical errors that prevent core functionality
    if (message.includes('spawn enoent') || message.includes('corrupted') ||
        message.includes('memory') || message.includes('exec format error')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors that break main features
    if (message.includes('process exited') || message.includes('device not found') ||
        message.includes('unauthorized') || message.includes('enoent') ||
        message.includes('no such file') || message.includes('eacces') ||
        message.includes('permission denied')) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity errors that cause inconvenience
    if (message.includes('timeout') || message.includes('timed out') ||
        message.includes('already running') || message.includes('invalid format') || 
        message.includes('network unreachable')) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Low severity errors that are minor issues
    return ErrorSeverity.LOW;
  }

  /**
   * Generate user-friendly error message
   */
  getUserFriendlyMessage(error: Error): string {
    const category = this.categorizeError(error);
    const message = error.message.toLowerCase();
    
    switch (category) {
      case ErrorCategory.CONNECTION:
        if (message.includes('refused')) {return 'Device refused the connection. Check if wireless debugging is enabled.';}
        if (message.includes('timeout')) {return 'Connection timed out. Check your network connection.';}
        if (message.includes('unreachable')) {return 'Device is not reachable. Verify the IP address.';}
        if (message.includes('offline')) {return 'Device appears to be offline. Check device connection.';}
        return 'Failed to connect to device. Check network and device settings.';
        
      case ErrorCategory.PROCESS:
        if (message.includes('spawn enoent')) {return 'Required program not found. Check binary installation.';}
        if (message.includes('exited')) {return 'Process stopped unexpectedly. Check device connection.';}
        if (message.includes('emfile')) {return 'Too many files open. Close some applications and try again.';}
        if (message.includes('memory')) {return 'Not enough memory available. Close some applications.';}
        return 'Process execution failed. Check system resources.';
        
      case ErrorCategory.CONFIGURATION:
        if (message.includes('ip') || message.includes('address')) {return 'Invalid IP address format. Use format like 192.168.1.100.';}
        if (message.includes('port')) {return 'Invalid port number. Use a number between 1 and 65535.';}
        return 'Configuration error. Check your settings.';
        
      case ErrorCategory.SYSTEM:
        if (message.includes('permission')) {return 'Permission denied. Check file permissions or run as administrator.';}
        if (message.includes('not found')) {return 'Required file not found. Reinstall the extension.';}
        return 'System error occurred. Try restarting the application.';
        
      default:
        return 'An unexpected error occurred. Check the logs for details.';
    }
  }

  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error: Error): string[] {
    const category = this.categorizeError(error);
    const message = error.message.toLowerCase();
    
    switch (category) {
      case ErrorCategory.CONNECTION:
        if (message.includes('refused')) {
          return [
            'Enable wireless debugging on your Android device',
            'Check if the port number is correct',
            'Try pairing the device first',
            'Restart ADB on your device'
          ];
        }
        if (message.includes('timeout')) {
          return [
            'Check your network connection',
            'Move device closer to the router',
            'Try a different network',
            'Restart wireless debugging'
          ];
        }
        return [
          'Verify device IP address and port',
          'Check network connectivity',
          'Enable wireless debugging',
          'Try USB connection first'
        ];
        
      case ErrorCategory.PROCESS:
        return [
          'Check if required binaries are installed',
          'Verify file permissions',
          'Restart the application',
          'Check system resources'
        ];
        
      case ErrorCategory.CONFIGURATION:
        return [
          'Check extension settings',
          'Verify input format',
          'Reset to default values',
          'Refer to documentation'
        ];
        
      case ErrorCategory.SYSTEM:
        return [
          'Restart the application',
          'Check file permissions',
          'Reinstall the extension',
          'Contact support if issue persists'
        ];
        
      default:
        return [
          'Check the logs for more details',
          'Restart the application',
          'Report the issue'
        ];
    }
  }

  /**
   * Handle error with full context and categorization
   */
  handleError(error: Error, context?: string): ErrorInfo {
    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error);
    const userMessage = this.getUserFriendlyMessage(error);
    const suggestedActions = this.getRecoverySuggestions(error);
    
    const errorInfo: ErrorInfo = {
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
  trackError(error: Error): void {
    const category = this.categorizeError(error);
    const currentCount = this.errorStats.get(category) || 0;
    this.errorStats.set(category, currentCount + 1);
  }

  /**
   * Configure error handler behavior
   */
  configure(options: { showNotifications?: boolean; logLevel?: string }): void {
    if (options.showNotifications !== undefined) {
      this.config.showNotifications = options.showNotifications;
    }
    if (options.logLevel !== undefined) {
      this.config.logLevel = options.logLevel;
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): { [key in ErrorCategory]: number } {
    const stats: { [key in ErrorCategory]: number } = {} as any;
    Object.values(ErrorCategory).forEach(category => {
      stats[category] = this.errorStats.get(category) || 0;
    });
    return stats;
  }

  /**
   * Log error and show appropriate user notification
   */
  private logAndNotifyError(errorInfo: ErrorInfo): void {
    // Log technical details
    this.logger.error(
      `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`,
      errorInfo.originalError
    );

    // Show user-friendly notification based on severity and configuration
    if (!this.config.showNotifications) {
      return;
    }

    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        this.showError(errorInfo.userMessage, errorInfo.suggestedActions);
        break;
      case ErrorSeverity.HIGH:
        this.showError(errorInfo.userMessage, errorInfo.suggestedActions);
        break;
      case ErrorSeverity.MEDIUM:
        this.showWarning(errorInfo.userMessage);
        break;
      case ErrorSeverity.LOW:
        this.showInfo(errorInfo.userMessage);
        break;
    }
  }

  /**
   * Get error statistics (alias for getErrorStatistics)
   */
  getErrorStats(): { [key in ErrorCategory]: number } {
    return this.getErrorStatistics();
  }

  /**
   * Get recurring error patterns
   */
  getRecurringPatterns(): { pattern: string; count: number; category: ErrorCategory }[] {
    const patterns: { pattern: string; count: number; category: ErrorCategory }[] = [];
    
    // This would analyze error patterns in a real implementation
    // For now, return empty array
    return patterns;
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary(): { totalErrors: number; byCategory: { [key in ErrorCategory]: number }; recentErrors: string[] } {
    const stats = this.getErrorStatistics();
    const totalErrors = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return {
      totalErrors,
      byCategory: stats,
      recentErrors: [] // Would contain recent error messages in real implementation
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): { showNotifications: boolean; logLevel: string } {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancelAllProgress();
  }
}