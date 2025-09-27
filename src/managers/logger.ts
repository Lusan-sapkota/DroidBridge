import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  ERROR = 2
}

/**
 * Manages logging and user notifications for the extension
 * Implements requirements 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3
 */
export class Logger {
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Requirement 6.1: Create OutputChannel named "DroidBridge Logs"
    this.outputChannel = vscode.window.createOutputChannel('DroidBridge Logs');
  }

  /**
   * Set the minimum log level for output
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Format timestamp for consistent logging
   */
  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
  }

  /**
   * Log a debug message
   * Only shown when log level is DEBUG
   */
  debug(message: string): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] DEBUG: ${message}`);
    }
  }

  /**
   * Log an informational message
   * Requirement 6.5: Log with timestamps
   */
  info(message: string): void {
    if (this.logLevel <= LogLevel.INFO) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }
  }

  /**
   * Log an error message
   * Requirement 6.5: Log detailed error information with timestamps
   */
  error(message: string, error?: Error): void {
    const timestamp = this.formatTimestamp();
    let logMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      logMessage += `\nError Details: ${error.message}`;
      if (error.stack) {
        logMessage += `\nStack Trace:\n${error.stack}`;
      }
    }
    this.outputChannel.appendLine(logMessage);
  }

  /**
   * Log process output
   * Requirements 6.2, 6.3: Capture and display stdout/stderr in OutputChannel
   */
  logProcessOutput(command: string, output: string, isError: boolean = false): void {
    const timestamp = this.formatTimestamp();
    const level = isError ? 'STDERR' : 'STDOUT';
    this.outputChannel.appendLine(`[${timestamp}] PROCESS ${level}: ${command}`);
    
    if (output.trim()) {
      // Split output into lines and prefix each with timestamp for readability
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        this.outputChannel.appendLine(`  ${line}`);
      });
    }
    this.outputChannel.appendLine(''); // Add blank line for readability
  }

  /**
   * Show a progress notification
   * Requirement 8.1: Show appropriate progress indicators
   */
  showProgress(message: string): Thenable<void> {
    this.info(`Progress: ${message}`);
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false
      },
      async () => {
        // Progress will be managed by the calling code
      }
    );
  }

  /**
   * Show a progress notification with cancellation support
   * Requirement 8.1: Show appropriate progress indicators
   */
  showProgressWithCancel(message: string, cancellable: boolean = true): Thenable<void> {
    this.info(`Progress (cancellable): ${message}`);
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable
      },
      async (progress, token) => {
        return new Promise<void>((resolve, reject) => {
          if (token.isCancellationRequested) {
            reject(new Error('Operation cancelled by user'));
          }
          // Progress will be managed by the calling code
          resolve();
        });
      }
    );
  }

  /**
   * Show a success notification
   * Requirement 8.2: Show success notifications with descriptive messages
   */
  showSuccess(message: string): void {
    vscode.window.showInformationMessage(message);
    this.info(`SUCCESS: ${message}`);
  }

  /**
   * Show an error notification
   * Requirement 8.3: Show error notifications with specific error details
   */
  showError(message: string, error?: Error): void {
    let errorMessage = message;
    if (error) {
      errorMessage += ` (${error.message})`;
    }
    
    vscode.window.showErrorMessage(errorMessage);
    this.error(`USER ERROR: ${message}`, error);
  }

  /**
   * Show a warning notification
   * Additional helper for user feedback
   */
  showWarning(message: string): void {
    vscode.window.showWarningMessage(message);
    this.info(`WARNING: ${message}`);
  }

  /**
   * Show and focus the output channel
   * Requirement 6.4: Open and focus the DroidBridge Logs OutputChannel
   */
  show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear all logs from the output channel
   */
  clear(): void {
    this.outputChannel.clear();
    this.info('Log cleared');
  }

  /**
   * Dispose of the output channel
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}