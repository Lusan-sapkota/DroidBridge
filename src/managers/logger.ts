import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  ERROR = 2
}

export class Logger {
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('DroidBridge Logs');
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
  }

  debug(message: string): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] DEBUG: ${message}`);
    }
  }

  info(message: string): void {
    if (this.logLevel <= LogLevel.INFO) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }
  }

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

  logProcessOutput(command: string, output: string, isError: boolean = false): void {
    const timestamp = this.formatTimestamp();
    const level = isError ? 'STDERR' : 'STDOUT';
    this.outputChannel.appendLine(`[${timestamp}] PROCESS ${level}: ${command}`);
    
    if (output.trim()) {
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        this.outputChannel.appendLine(`  ${line}`);
      });
    }
    this.outputChannel.appendLine('');
  }

  showProgress(message: string): Thenable<void> {
    this.info(`Progress: ${message}`);
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false
      },
      async () => {
      }
    );
  }

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
          resolve();
        });
      }
    );
  }

  showSuccess(message: string): void {
    vscode.window.showInformationMessage(message);
    this.info(`SUCCESS: ${message}`);
  }

  showError(message: string, error?: Error): void {
    let errorMessage = message;
    if (error) {
      errorMessage += ` (${error.message})`;
    }
    
    vscode.window.showErrorMessage(errorMessage);
    this.error(`USER ERROR: ${message}`, error);
  }

  showWarning(message: string): void {
    vscode.window.showWarningMessage(message);
    this.info(`WARNING: ${message}`);
  }

  show(): void {
    this.outputChannel.show();
  }

  clear(): void {
    this.outputChannel.clear();
    this.info('Log cleared');
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}