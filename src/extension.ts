import * as vscode from 'vscode';
import { CommandManager, ConfigManager, ProcessManager, BinaryManager, Logger } from './managers';
import { DroidBridgeSidebarProvider } from './providers';
import { ExtensionState } from './types';

// Global extension state
let extensionState: ExtensionState;
let logger: Logger;
let commandManager: CommandManager;
let processManager: ProcessManager;
let configManager: ConfigManager;
let binaryManager: BinaryManager;
let sidebarProvider: DroidBridgeSidebarProvider;

/**
 * This method is called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  // Initialize logger first
  logger = new Logger();
  logger.info('DroidBridge extension is activating...');

  try {
    // Initialize managers
    configManager = new ConfigManager();
    binaryManager = new BinaryManager(context.extensionPath, configManager);
    processManager = new ProcessManager(binaryManager, logger);
    commandManager = new CommandManager(processManager, configManager, logger);

    // Initialize sidebar provider
    sidebarProvider = new DroidBridgeSidebarProvider();

    // Initialize extension state
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

    // Register sidebar provider
    vscode.window.registerTreeDataProvider('droidbridge-sidebar', sidebarProvider);

    // Register commands (implementation will be added in later tasks)
    commandManager.registerCommands(context);

    // Register configuration change listener
    const configDisposable = configManager.onConfigurationChanged(() => {
      logger.info('Configuration changed, refreshing extension state');
      sidebarProvider.refresh();
    });

    // Add disposables to context
    context.subscriptions.push(
      configDisposable,
      logger
    );

    // Mark as initialized
    extensionState.initialized = true;
    logger.info('DroidBridge extension activated successfully');

  } catch (error) {
    logger.error('Failed to activate DroidBridge extension', error as Error);
    vscode.window.showErrorMessage('Failed to activate DroidBridge extension. Check the logs for details.');
  }
}

/**
 * This method is called when the extension is deactivated
 */
export async function deactivate() {
  if (logger) {
    logger.info('DroidBridge extension is deactivating...');
  }

  try {
    // Clean up processes
    if (processManager) {
      await processManager.cleanup();
    }

    if (logger) {
      logger.info('DroidBridge extension deactivated successfully');
      logger.dispose();
    }
  } catch (error) {
    console.error('Error during extension deactivation:', error);
  }
}
