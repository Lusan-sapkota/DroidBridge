import * as vscode from 'vscode';
import { CommandManager, ConfigManager, ProcessManager, BinaryManager, Logger } from './managers';
import { DroidBridgeSidebarProvider } from './providers';
import { ExtensionState } from './types';
import { ThemeManager } from './utils/themeManager';

// Global extension state
let extensionState: ExtensionState;
let logger: Logger;
let commandManager: CommandManager;
let processManager: ProcessManager;
let configManager: ConfigManager;
let binaryManager: BinaryManager;
let sidebarProvider: DroidBridgeSidebarProvider;
let themeManager: ThemeManager;

/**
 * This method is called when the extension is activated
 * Implements requirements 1.1, 4.6, 6.1
 */
export function activate(context: vscode.ExtensionContext) {
  // Initialize logger first - Requirement 6.1: Create OutputChannel
  logger = new Logger();
  logger.info('DroidBridge extension is activating...');

  try {
    // Initialize all manager classes in proper order
    initializeManagers(context);
    
    // Initialize extension state
    initializeExtensionState();
    
    // Register all VSCode components
    registerVSCodeComponents(context);
    
    // Set up configuration watchers
    setupConfigurationWatchers(context);
    
    // Validate binaries asynchronously
    validateBinariesAsync();
    
    // Mark as initialized
    extensionState.initialized = true;
    logger.info('DroidBridge extension activated successfully');

  } catch (error) {
    logger.error('Failed to activate DroidBridge extension', error as Error);
    vscode.window.showErrorMessage('Failed to activate DroidBridge extension. Check the logs for details.');
    throw error; // Re-throw to ensure activation failure is properly handled
  }
}

/**
 * Initialize all manager classes with proper dependencies
 */
function initializeManagers(context: vscode.ExtensionContext): void {
  logger.info('Initializing manager classes...');
  
  // Initialize configuration manager first (no dependencies)
  configManager = new ConfigManager();
  logger.debug('ConfigManager initialized');
  
  // Initialize theme manager (no dependencies)
  themeManager = ThemeManager.getInstance();
  logger.debug('ThemeManager initialized');
  
  // Initialize binary manager (depends on config manager)
  binaryManager = new BinaryManager(context.extensionPath, configManager);
  logger.debug('BinaryManager initialized');
  
  // Initialize process manager (depends on binary manager and logger)
  processManager = new ProcessManager(binaryManager, logger);
  logger.debug('ProcessManager initialized');
  
  // Initialize sidebar provider (depends on config manager)
  sidebarProvider = new DroidBridgeSidebarProvider(
    vscode.Uri.file(context.extensionPath), 
    context, 
    configManager
  );
  logger.debug('DroidBridgeSidebarProvider initialized');
  
  // Initialize command manager last (depends on all other managers)
  commandManager = new CommandManager(processManager, configManager, logger, sidebarProvider);
  logger.debug('CommandManager initialized');
  
  // Set up bidirectional integration between sidebar and command manager
  commandManager.setSidebarProvider(sidebarProvider);
  logger.debug('Manager cross-references established');
}

/**
 * Initialize the extension state
 */
function initializeExtensionState(): void {
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
  logger.debug('Extension state initialized');
}

/**
 * Register all VSCode components (commands, views, providers)
 * Implements requirements 1.1, 4.6
 */
function registerVSCodeComponents(context: vscode.ExtensionContext): void {
  logger.info('Registering VSCode components...');
  
  // Register webview provider for sidebar - Requirement 1.1: Display DroidBridge sidebar
  const sidebarDisposable = vscode.window.registerWebviewViewProvider(
    'droidbridge-sidebar', // Must match the view ID in package.json
    sidebarProvider
  );
  context.subscriptions.push(sidebarDisposable);
  logger.debug('Sidebar webview provider registered');
  
  // Register all commands - Requirement 4.6: Register all commands with VSCode
  commandManager.registerCommands(context);
  logger.debug('All commands registered');
  
  logger.info('All VSCode components registered successfully');
}

/**
 * Set up configuration change watchers
 */
function setupConfigurationWatchers(context: vscode.ExtensionContext): void {
  logger.info('Setting up configuration watchers...');
  
  // Register configuration change listener
  const configDisposable = configManager.onConfigurationChanged(() => {
    logger.info('Configuration changed, refreshing extension state');
    sidebarProvider.refresh();
    
    // Re-validate binaries if paths changed
    validateBinariesAsync();
  });
  context.subscriptions.push(configDisposable);
  
  logger.debug('Configuration watchers set up');
}

/**
 * Validate binaries asynchronously without blocking activation
 */
function validateBinariesAsync(): void {
  // Run binary validation in background
  binaryManager.validateBinaries()
    .then((result: any) => {
      extensionState.binariesValidated = result.adbValid && result.scrcpyValid;
      
      if (extensionState.binariesValidated) {
        logger.info('All binaries validated successfully');
      } else {
        logger.error('Binary validation failed', new Error(result.errors.join(', ')));
        vscode.window.showWarningMessage(
          'Some DroidBridge binaries are not available. Check the logs for details.',
          'Show Logs'
        ).then(selection => {
          if (selection === 'Show Logs') {
            logger.show();
          }
        });
      }
    })
    .catch((error: any) => {
      logger.error('Failed to validate binaries', error);
      extensionState.binariesValidated = false;
    });
}

/**
 * This method is called when the extension is deactivated
 * Implements proper cleanup and process termination
 */
export async function deactivate(): Promise<void> {
  if (logger) {
    logger.info('DroidBridge extension is deactivating...');
  }

  const cleanupTasks: Promise<void>[] = [];

  try {
    // Clean up command manager (stops status updates)
    if (commandManager) {
      logger.debug('Disposing command manager...');
      commandManager.dispose();
    }

    // Clean up sidebar provider
    if (sidebarProvider) {
      logger.debug('Disposing sidebar provider...');
      sidebarProvider.dispose();
    }

    // Clean up processes (most important - terminate any running processes)
    if (processManager) {
      logger.debug('Cleaning up process manager...');
      cleanupTasks.push(processManager.cleanup());
    }

    // Wait for all cleanup tasks to complete
    await Promise.all(cleanupTasks);

    // Clean up theme manager
    if (themeManager) {
      logger.debug('Disposing theme manager...');
      themeManager.dispose();
    }

    // Reset extension state
    if (extensionState) {
      extensionState.initialized = false;
      extensionState.binariesValidated = false;
      extensionState.connection.connected = false;
      extensionState.scrcpy.running = false;
    }

    if (logger) {
      logger.info('DroidBridge extension deactivated successfully');
      logger.dispose();
    }

  } catch (error) {
    // Use console.error as fallback since logger might be disposed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error during extension deactivation:', errorMessage);
    
    if (logger) {
      try {
        logger.error('Error during extension deactivation', error instanceof Error ? error : undefined);
      } catch (logError) {
        // Logger might already be disposed, ignore
        console.error('Failed to log deactivation error:', logError);
      }
    }
    
    // Don't throw the error - deactivation should always complete
  } finally {
    // Ensure all global references are cleared
    extensionState = undefined as any;
    logger = undefined as any;
    commandManager = undefined as any;
    processManager = undefined as any;
    configManager = undefined as any;
    binaryManager = undefined as any;
    sidebarProvider = undefined as any;
    themeManager = undefined as any;
  }
}

/**
 * Get the current extension state (for testing purposes)
 */
export function getExtensionState(): ExtensionState | undefined {
  return extensionState;
}

/**
 * Get the logger instance (for testing purposes)
 */
export function getLogger(): Logger | undefined {
  return logger;
}

/**
 * Check if the extension is properly initialized
 */
export function isExtensionInitialized(): boolean {
  return extensionState?.initialized === true;
}
