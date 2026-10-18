import * as vscode from 'vscode';
import { CommandManager, ConfigManager, ProcessManager, BinaryManager, Logger } from './managers';
import { DroidBridgeSidebarProvider } from './providers';
import { ExtensionState } from './types';
import { ThemeManager } from './utils/themeManager';
import './providers/sidebarProvider';

let extensionState: ExtensionState;
let logger: Logger;
let commandManager: CommandManager;
let processManager: ProcessManager;
let configManager: ConfigManager;
let binaryManager: BinaryManager;
let sidebarProvider: DroidBridgeSidebarProvider;
let themeManager: ThemeManager;

export function activate(context: vscode.ExtensionContext) {
  logger = new Logger();
  logger.info('DroidBridge extension is activating...');

  try {
    initializeManagers(context);
    
    initializeExtensionState();
    
    registerVSCodeComponents(context);
    
    setupConfigurationWatchers(context);
    
    validateBinariesAsync();
    
    extensionState.initialized = true;
    logger.info('DroidBridge extension activated successfully');
  } catch (error) {
    logger.error('Failed to activate DroidBridge extension', error as Error);
    vscode.window.showErrorMessage('Failed to activate DroidBridge extension. Check the logs for details.');
    throw error; // Re-throw to ensure activation failure is properly handled
  }
}

function initializeManagers(context: vscode.ExtensionContext): void {
  logger.info('Initializing manager classes...');
  
  configManager = new ConfigManager();
  logger.debug('ConfigManager initialized');
  
  themeManager = ThemeManager.getInstance();
  logger.debug('ThemeManager initialized');
  
  binaryManager = new BinaryManager(context.extensionPath, configManager);
  logger.debug('BinaryManager initialized');
  
  processManager = new ProcessManager(binaryManager, logger);
  logger.debug('ProcessManager initialized');
  
  sidebarProvider = new DroidBridgeSidebarProvider(
    vscode.Uri.file(context.extensionPath), 
    context, 
    configManager
  );
  logger.debug('DroidBridgeSidebarProvider initialized');
    logger.info(`Sidebar provider class loaded with viewType=${DroidBridgeSidebarProvider.viewType}`);
  
  commandManager = new CommandManager(processManager, configManager, logger, binaryManager, sidebarProvider);
  logger.debug('CommandManager initialized');
  
  commandManager.setSidebarProvider(sidebarProvider);
  logger.debug('Manager cross-references established');
}

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

function registerVSCodeComponents(context: vscode.ExtensionContext): void {
  logger.info('Registering VSCode components...');
  
  const sidebarDisposable = vscode.window.registerWebviewViewProvider(
    DroidBridgeSidebarProvider.viewType, // Keep in sync with package.json
    sidebarProvider
  );
  logger.debug(`Registered webview view provider for id: ${DroidBridgeSidebarProvider.viewType}`);
  logger.info('Sidebar provider registration complete');
  context.subscriptions.push(sidebarDisposable);
  logger.debug('Sidebar webview provider registered');

  commandManager.registerCommands(context);
  logger.debug('All commands registered');
  
  logger.info('All VSCode components registered successfully');
}

function setupConfigurationWatchers(context: vscode.ExtensionContext): void {
  logger.info('Setting up configuration watchers...');
  
  const configDisposable = configManager.onConfigurationChanged(() => {
    logger.info('Configuration changed, refreshing extension state');
    sidebarProvider.refresh();
    
    validateBinariesAsync();
  });
  context.subscriptions.push(configDisposable);
  
  logger.debug('Configuration watchers set up');
}

function validateBinariesAsync(): void {
  binaryManager.setDownloadProgressCallback((progress) => {
    logger.info(`Downloading ${progress.binary}: ${progress.percentage}% (${progress.downloaded}/${progress.total} bytes)`);
  });

  binaryManager.validateBinaries()
    .then((result: any) => {
      extensionState.binariesValidated = result.adbValid && result.scrcpyValid;
      
      if (extensionState.binariesValidated) {
        logger.info('All binaries validated successfully');
        
        binaryManager.getBinaryInfo().then((info) => {
          logger.info(`ADB: ${info.adb.path} (${info.adb.source}${info.adb.version ? `, v${info.adb.version}` : ''})`);
          logger.info(`Scrcpy: ${info.scrcpy.path} (${info.scrcpy.source}${info.scrcpy.version ? `, v${info.scrcpy.version}` : ''})`);
        });
      } else {
        logger.error('Binary validation failed', new Error(result.errors.join(', ')));
        
        binaryManager.needsDownload().then((downloadInfo) => {
          if (downloadInfo.needed) {
            vscode.window.showWarningMessage(
              `DroidBridge needs to download missing binaries: ${downloadInfo.binaries.join(', ')}. This will happen automatically when needed.`,
              'Show Logs'
            ).then(selection => {
              if (selection === 'Show Logs') {
                logger.show();
              }
            });
          } else {
            vscode.window.showWarningMessage(
              'Some DroidBridge binaries are not available. Check the logs for details.',
              'Show Logs'
            ).then(selection => {
              if (selection === 'Show Logs') {
                logger.show();
              }
            });
          }
        });
      }
    })
    .catch((error: any) => {
      logger.error('Failed to validate binaries', error);
      extensionState.binariesValidated = false;
    });
}

export async function deactivate(): Promise<void> {
  if (logger) {
    logger.info('DroidBridge extension is deactivating...');
  }

  const cleanupTasks: Promise<void>[] = [];

  try {
    if (commandManager) {
      logger.debug('Disposing command manager...');
      commandManager.dispose();
    }

    if (sidebarProvider) {
      logger.debug('Disposing sidebar provider...');
      sidebarProvider.dispose();
    }

    if (processManager) {
      logger.debug('Cleaning up process manager...');
      cleanupTasks.push(processManager.cleanup());
    }

    await Promise.all(cleanupTasks);

    if (themeManager) {
      logger.debug('Disposing theme manager...');
      themeManager.dispose();
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error during extension deactivation:', errorMessage);
    
    if (logger) {
      try {
        logger.error('Error during extension deactivation', error instanceof Error ? error : undefined);
      } catch (logError) {
        console.error('Failed to log deactivation error:', logError);
      }
    }
  } finally {
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

export function getExtensionState(): ExtensionState | undefined {
  return extensionState;
}

export function getLogger(): Logger | undefined {
  return logger;
}

export function isExtensionInitialized(): boolean {
  return extensionState?.initialized === true;
}
