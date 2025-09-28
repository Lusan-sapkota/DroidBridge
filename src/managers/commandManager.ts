import * as vscode from 'vscode';
import { ProcessManager } from './processManager';
import { ConfigManager } from './configManager';
import { Logger } from './logger';
import { BinaryManager } from './binaryManager';
import { ErrorHandler, ProgressContext } from '../utils/errorHandler';

/**
 * Manages all VSCode commands for the DroidBridge extension
 * Implements requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export class CommandManager {
  private processManager: ProcessManager;
  private configManager: ConfigManager;
  private logger: Logger;
  private binaryManager: BinaryManager;
  private errorHandler: ErrorHandler;
  private sidebarProvider?: any; // Will be properly typed when sidebar provider is available
  private statusUpdateInterval?: NodeJS.Timeout;

  constructor(processManager: ProcessManager, configManager: ConfigManager, logger: Logger, binaryManager: BinaryManager, sidebarProvider?: any) {
    this.processManager = processManager;
    this.configManager = configManager;
    this.logger = logger;
    this.binaryManager = binaryManager;
    this.errorHandler = new ErrorHandler(logger);
    this.sidebarProvider = sidebarProvider;
    
    // Start periodic status updates if sidebar provider is available
    if (this.sidebarProvider) {
      this.startStatusUpdates();
    }
  }

  /**
   * Register all DroidBridge commands with VSCode
   * Requirement 4.6: Register all commands with VSCode
   */
  registerCommands(context: vscode.ExtensionContext): void {
    const commands = [
      // Requirement 4.1: Connect to Device command
      vscode.commands.registerCommand('droidbridge.connectDevice', (ip?: string, port?: string) => this.connectDeviceCommand(ip, port)),
      
      // Requirement 4.2: Disconnect Device command
      vscode.commands.registerCommand('droidbridge.disconnectDevice', () => this.disconnectDeviceCommand()),
      
      // Requirement 4.3: Launch Scrcpy command
      vscode.commands.registerCommand('droidbridge.launchScrcpy', () => this.launchScrcpyCommand()),
      
      // Launch Scrcpy Screen Off command (additional functionality)
      vscode.commands.registerCommand('droidbridge.launchScrcpyScreenOff', () => this.launchScrcpyScreenOffCommand()),
      
      // Requirement 4.4: Stop Scrcpy command
      vscode.commands.registerCommand('droidbridge.stopScrcpy', () => this.stopScrcpyCommand()),
      
      // Requirement 4.5: Show Logs command
      vscode.commands.registerCommand('droidbridge.showLogs', () => this.showLogsCommand()),
      
      // Binary management commands
      vscode.commands.registerCommand('droidbridge.checkBinaries', () => this.checkBinariesCommand()),
      vscode.commands.registerCommand('droidbridge.downloadBinaries', () => this.downloadBinariesCommand()),
      vscode.commands.registerCommand('droidbridge.refreshBinaries', () => this.refreshBinariesCommand())
    ];

    // Add all command disposables to the extension context
    commands.forEach(command => context.subscriptions.push(command));
    
    this.logger.info('All DroidBridge commands registered successfully');
  }

  /**
   * Connect to Android device via ADB
   * Requirement 4.1: Provide "DroidBridge: Connect to Device" command
   */
  async connectDeviceCommand(providedIp?: string, providedPort?: string): Promise<void> {
    try {
      this.logger.info('Connect Device command executed');

      // Get default values from configuration
      const config = this.configManager.getConfigWithDefaults();
      let ip = providedIp || config.ip;
      let port = providedPort || config.port;

      // If no IP/port provided, prompt user for input
      if (!providedIp || !providedPort) {
        // Prompt user for IP address with default value
        const inputIp = await vscode.window.showInputBox({
          prompt: 'Enter the IP address of your Android device',
          value: ip,
          validateInput: (value: string) => {
            if (!value.trim()) {
              return 'IP address cannot be empty';
            }
            if (!this.configManager.validateIpAddress(value.trim())) {
              return 'Please enter a valid IP address (e.g., 192.168.1.100 or localhost)';
            }
            return null;
          }
        });

        if (inputIp === undefined) {
          this.logger.info('Connect Device command cancelled by user');
          return;
        }

        ip = inputIp.trim();

        // Prompt user for port with default value
        const inputPort = await vscode.window.showInputBox({
          prompt: 'Enter the port number for ADB connection',
          value: port,
          validateInput: (value: string) => {
            if (!value.trim()) {
              return 'Port cannot be empty';
            }
            if (!this.configManager.validatePort(value.trim())) {
              return 'Please enter a valid port number (1-65535)';
            }
            return null;
          }
        });

        if (inputPort === undefined) {
          this.logger.info('Connect Device command cancelled by user');
          return;
        }

        port = inputPort.trim();
      }

      // Enhanced validation with better error handling
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, 'ip', 'IP address');
      if (!ipValidation.isValid) {
        return; // Error already handled by validator
      }

      const portValidation = this.errorHandler.validateAndHandleInput(port, 'port', 'Port number');
      if (!portValidation.isValid) {
        return; // Error already handled by validator
      }

      // Show progress notification with enhanced error handling
      const progressContext: ProgressContext = {
        title: `🔌 Connecting to ${ip}:${port}...`,
        cancellable: true,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error('Connection cancelled by user');
          }
          
          progress.report({ message: 'Establishing connection...' });
          const success = await this.connectDevice(ip, port);
          
          if (success) {
            progress.report({ message: 'Connected successfully', increment: 100 });
            this.errorHandler.showSuccess(`Device connected to ${ip}:${port}`);
          }
          
          return success;
        },
        progressContext,
        'connect-device'
      );

    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger.info('Connect Device command cancelled by user');
        return;
      }
      
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Unknown error'),
        'Connect Device command'
      );
    }
  }

  /**
   * Disconnect from Android device
   * Requirement 4.2: Provide "DroidBridge: Disconnect Device" command
   */
  async disconnectDeviceCommand(): Promise<void> {
    try {
      this.logger.info('Disconnect Device command executed');

      // Check if device is connected
      if (!this.processManager.isDeviceConnected()) {
        this.logger.showWarning('No device is currently connected');
        return;
      }

      const connectionState = this.processManager.getConnectionState();
      const target = connectionState.deviceIp && connectionState.devicePort 
        ? `${connectionState.deviceIp}:${connectionState.devicePort}` 
        : 'device';

      // Show progress notification with enhanced error handling
      const progressContext: ProgressContext = {
        title: `🔌 Disconnecting from ${target}...`,
        cancellable: false,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: 'Disconnecting device...' });
          const success = await this.disconnectDevice();
          
          if (success) {
            progress.report({ message: 'Disconnected successfully', increment: 100 });
            this.errorHandler.showSuccess(`Device disconnected from ${target}`);
          }
          
          return success;
        },
        progressContext,
        'disconnect-device'
      );

    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Unknown error'),
        'Disconnect Device command'
      );
    }
  }

  /**
   * Launch scrcpy screen mirroring
   * Requirement 4.3: Provide "DroidBridge: Launch Scrcpy" command
   */
  async launchScrcpyCommand(): Promise<void> {
    try {
      this.logger.info('Launch Scrcpy command executed');

      // Check if scrcpy is already running
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return;
      }

      // Check if device is connected
      if (!this.processManager.isDeviceConnected()) {
        const shouldConnect = await vscode.window.showWarningMessage(
          'No device is connected. Would you like to connect to a device first?',
          { title: 'Connect Device' },
          { title: 'Launch Anyway' }
        );

        if (shouldConnect?.title === 'Connect Device') {
          await this.connectDeviceCommand();
          // Check again if connection was successful
          if (!this.processManager.isDeviceConnected()) {
            return;
          }
        }
      }

      // Show progress notification with enhanced error handling
      const progressContext: ProgressContext = {
        title: '📱 Launching scrcpy...',
        cancellable: true,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error('Scrcpy launch cancelled by user');
          }
          
          progress.report({ message: 'Starting screen mirroring...' });
          const success = await this.launchScrcpy();
          
          if (success) {
            progress.report({ message: 'Screen mirroring started', increment: 100 });
            this.errorHandler.showSuccess('Scrcpy launched successfully');
          }
          
          return success;
        },
        progressContext,
        'launch-scrcpy'
      );

    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger.info('Launch Scrcpy command cancelled by user');
        return;
      }
      
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error('Unknown error'),
        'scrcpy',
        'Launch Scrcpy command'
      );
    }
  }

  /**
   * Launch scrcpy with screen off functionality
   * Additional command for enhanced functionality
   */
  async launchScrcpyScreenOffCommand(): Promise<void> {
    try {
      this.logger.info('Launch Scrcpy Screen Off command executed');

      // Check if scrcpy is already running
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return;
      }

      // Check if device is connected
      if (!this.processManager.isDeviceConnected()) {
        const shouldConnect = await vscode.window.showWarningMessage(
          'No device is connected. Would you like to connect to a device first?',
          { title: 'Connect Device' },
          { title: 'Launch Anyway' }
        );

        if (shouldConnect?.title === 'Connect Device') {
          await this.connectDeviceCommand();
          // Check again if connection was successful
          if (!this.processManager.isDeviceConnected()) {
            return;
          }
        }
      }

      // Show progress notification with enhanced error handling
      const progressContext: ProgressContext = {
        title: '📱 Launching scrcpy with screen off...',
        cancellable: true,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error('Scrcpy screen off launch cancelled by user');
          }
          
          progress.report({ message: 'Starting screen mirroring with screen off...' });
          const success = await this.launchScrcpyScreenOff();
          
          if (success) {
            progress.report({ message: 'Screen mirroring started with screen off', increment: 100 });
            this.errorHandler.showSuccess('Scrcpy launched successfully with screen off');
          }
          
          return success;
        },
        progressContext,
        'launch-scrcpy-screen-off'
      );

    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger.info('Launch Scrcpy Screen Off command cancelled by user');
        return;
      }
      
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error('Unknown error'),
        'scrcpy screen off',
        'Launch Scrcpy Screen Off command'
      );
    }
  }

  /**
   * Stop scrcpy screen mirroring
   * Requirement 4.4: Provide "DroidBridge: Stop Scrcpy" command
   */
  async stopScrcpyCommand(): Promise<void> {
    try {
      this.logger.info('Stop Scrcpy command executed');

      // Check if scrcpy is running
      if (!this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is not currently running');
        return;
      }

      // Show progress notification with enhanced error handling
      const progressContext: ProgressContext = {
        title: '📱 Stopping scrcpy...',
        cancellable: false,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: 'Stopping screen mirroring...' });
          const success = await this.stopScrcpy();
          
          if (success) {
            progress.report({ message: 'Screen mirroring stopped', increment: 100 });
            this.errorHandler.showSuccess('Scrcpy stopped successfully');
          }
          
          return success;
        },
        progressContext,
        'stop-scrcpy'
      );
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error('Unknown error'),
        'scrcpy',
        'Stop Scrcpy command'
      );
    }


  }

  /**
   * Show the DroidBridge logs output channel
   * Requirement 4.5: Provide "DroidBridge: Show Logs" command
   */
  showLogsCommand(): void {
    try {
      this.logger.info('Show Logs command executed');
      this.logger.show();
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Unknown error'),
        'Show Logs command'
      );
    }
  }

  /**
   * Connect to device with validation and error handling
   * Internal method used by command and sidebar
   */
  async connectDevice(ip?: string, port?: string): Promise<boolean> {
    // Use provided values or get from configuration
    const config = this.configManager.getConfigWithDefaults();
    const targetIp = ip || config.ip;
    const targetPort = port || config.port;

    try {

      // Validate inputs
      const validation = this.configManager.validateConnection(targetIp, targetPort);
      if (!validation.isValid) {
        const errorMessage = `Invalid connection parameters: ${validation.errors.join(', ')}`;
        this.logger.showError(errorMessage);
        return false;
      }

      // Attempt connection
      const success = await this.processManager.connectDevice(targetIp, targetPort);
      
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const connectionError = new Error(connectionState.connectionError || 'Failed to connect to device');
        
        this.errorHandler.handleConnectionError(connectionError, { ip: targetIp, port: targetPort });
        
        // Update sidebar UI
        if (this.sidebarProvider) {
          this.sidebarProvider.updateConnectionStatus(false);
        }
        
        return false;
      }

      // Update sidebar UI on success
      if (this.sidebarProvider) {
        this.sidebarProvider.updateConnectionStatus(true, targetIp, targetPort);
      }

      return true;

    } catch (error) {
      this.errorHandler.handleConnectionError(
        error instanceof Error ? error : new Error('Unknown connection error'),
        { ip: targetIp, port: targetPort }
      );
      return false;
    }
  }

  /**
   * Disconnect from device with error handling
   * Internal method used by command and sidebar
   */
  async disconnectDevice(): Promise<boolean> {
    try {
      const success = await this.processManager.disconnectDevice();
      
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const disconnectionError = new Error(connectionState.connectionError || 'Failed to disconnect from device');
        
        this.errorHandler.handleConnectionError(disconnectionError);
        
        // Update sidebar UI
        if (this.sidebarProvider) {
          this.sidebarProvider.updateConnectionStatus(false);
        }
        
        return false;
      }

      // Update sidebar UI on success
      if (this.sidebarProvider) {
        this.sidebarProvider.updateConnectionStatus(false);
      }

      return true;

    } catch (error) {
      this.errorHandler.handleConnectionError(
        error instanceof Error ? error : new Error('Unknown disconnection error')
      );
      return false;
    }
  }

  /**
   * Launch scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async launchScrcpy(): Promise<boolean> {
    try {
      // Check for duplicate instances with enhanced error handling
      if (this.processManager.isScrcpyRunning()) {
        const duplicateError = new Error('Scrcpy is already running');
        this.errorHandler.handleProcessError(duplicateError, 'scrcpy');
        return false;
      }

      const process = await this.processManager.launchScrcpy();
      
      // If we get here, the process was launched successfully
      if (!process || !process.pid) {
        const processError = new Error('Failed to launch scrcpy - invalid process');
        this.errorHandler.handleProcessError(processError, 'scrcpy');
        
        // Update sidebar UI
        if (this.sidebarProvider) {
          this.sidebarProvider.updateScrcpyStatus(false);
        }
        
        return false;
      }

      // Update sidebar UI on success
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(true);
      }

      return true;

    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error('Unknown scrcpy launch error'),
        'scrcpy'
      );
      return false;
    }
  }

  /**
   * Launch scrcpy with screen off functionality
   * Internal method used by command and sidebar
   */
  async launchScrcpyScreenOff(): Promise<boolean> {
    try {
      // Check for duplicate instances with enhanced error handling
      if (this.processManager.isScrcpyRunning()) {
        const duplicateError = new Error('Scrcpy is already running');
        this.errorHandler.handleProcessError(duplicateError, 'scrcpy screen off');
        return false;
      }

      const process = await this.processManager.launchScrcpyScreenOff();
      
      // If we get here, the process was launched successfully
      if (!process || !process.pid) {
        const processError = new Error('Failed to launch scrcpy with screen off - invalid process');
        this.errorHandler.handleProcessError(processError, 'scrcpy screen off');
        
        // Update sidebar UI
        if (this.sidebarProvider) {
          this.sidebarProvider.updateScrcpyStatus(false);
        }
        
        return false;
      }

      // Update sidebar UI on success
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(true);
      }

      return true;

    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error('Unknown scrcpy screen off launch error'),
        'scrcpy screen off'
      );
      return false;
    }
  }

  /**
   * Stop scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async stopScrcpy(): Promise<boolean> {
    try {
      const success = await this.processManager.stopScrcpy();
      
      if (!success) {
        const stopError = new Error('Failed to stop scrcpy');
        this.errorHandler.handleProcessError(stopError, 'scrcpy');
        return false;
      }

      // Update sidebar UI on success
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(false);
      }

      return true;

    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error('Unknown scrcpy stop error'),
        'scrcpy'
      );
      return false;
    }
  }

  /**
   * Get current connection status for UI updates
   */
  isDeviceConnected(): boolean {
    return this.processManager.isDeviceConnected();
  }

  /**
   * Get current scrcpy status for UI updates
   */
  isScrcpyRunning(): boolean {
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
  setSidebarProvider(sidebarProvider: any): void {
    this.sidebarProvider = sidebarProvider;
    
    // Start status updates if not already running
    if (!this.statusUpdateInterval) {
      this.startStatusUpdates();
    }
    
    // Immediately sync current state
    this.updateSidebarState();
  }

  /**
   * Start periodic status updates to keep sidebar in sync
   */
  private startStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      return; // Already running
    }

    // Update sidebar state every 2 seconds
    this.statusUpdateInterval = setInterval(() => {
      this.updateSidebarState();
    }, 2000);
  }

  /**
   * Stop periodic status updates
   */
  private stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = undefined;
    }
  }

  /**
   * Update sidebar state with current process states
   */
  private updateSidebarState(): void {
    if (!this.sidebarProvider) {
      return;
    }

    try {
      const connectionState = this.processManager.getConnectionState();
      const scrcpyState = this.processManager.getScrcpyState();
      
      // Synchronize sidebar with actual process states
      this.sidebarProvider.synchronizeState(connectionState, scrcpyState);
    } catch (error) {
      // Log error but don't throw to avoid breaking the interval
      this.logger.error('Failed to update sidebar state', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Force immediate sidebar state update
   */
  refreshSidebarState(): void {
    this.updateSidebarState();
  }

  /**
   * Check binary status and show information
   */
  async checkBinariesCommand(): Promise<void> {
    try {
      this.logger.info('Check Binaries command executed');

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Checking binary status...',
        cancellable: false
      }, async (progress) => {
        progress.report({ message: 'Detecting installed binaries...' });

        const detectionStatus = await this.binaryManager.getDetectionStatus();
        const binaryInfo = await this.binaryManager.getBinaryInfo();
        const downloadInfo = await this.binaryManager.needsDownload();

        progress.report({ message: 'Analysis complete', increment: 100 });

        // Create status report
        const statusLines: string[] = [];
        statusLines.push('=== DroidBridge Binary Status ===\n');

        // ADB Status
        const adbStatus = detectionStatus.get('adb');
        statusLines.push(`ADB: ${adbStatus?.found ? '✅ Found' : '❌ Not Found'}`);
        if (adbStatus?.found) {
          statusLines.push(`  Path: ${adbStatus.path}`);
          statusLines.push(`  Source: ${adbStatus.source}`);
          if (adbStatus.version) {
            statusLines.push(`  Version: ${adbStatus.version}`);
          }
        }

        // Scrcpy Status
        const scrcpyStatus = detectionStatus.get('scrcpy');
        statusLines.push(`\nScrcpy: ${scrcpyStatus?.found ? '✅ Found' : '❌ Not Found'}`);
        if (scrcpyStatus?.found) {
          statusLines.push(`  Path: ${scrcpyStatus.path}`);
          statusLines.push(`  Source: ${scrcpyStatus.source}`);
          if (scrcpyStatus.version) {
            statusLines.push(`  Version: ${scrcpyStatus.version}`);
          }
        }

        // Download status
        if (downloadInfo.needed) {
          statusLines.push(`\n⚠️  Missing binaries: ${downloadInfo.binaries.join(', ')}`);
          statusLines.push('Use "DroidBridge: Download Binaries" to download missing binaries.');
        } else {
          statusLines.push('\n✅ All required binaries are available');
        }

        const statusReport = statusLines.join('\n');
        this.logger.info('Binary status check completed');
        this.logger.info(statusReport);

        // Show status in information message
        const action = downloadInfo.needed ? 'Download Missing' : 'Show Logs';
        const selection = await vscode.window.showInformationMessage(
          downloadInfo.needed 
            ? `Missing binaries: ${downloadInfo.binaries.join(', ')}. Download them now?`
            : 'All binaries are available. Check logs for details.',
          action,
          'Show Logs'
        );

        if (selection === 'Download Missing') {
          await this.downloadBinariesCommand();
        } else if (selection === 'Show Logs') {
          this.logger.show();
        }
      });

    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Unknown binary check error'),
        'Check Binaries command'
      );
    }
  }

  /**
   * Download missing binaries
   */
  async downloadBinariesCommand(): Promise<void> {
    try {
      this.logger.info('Download Binaries command executed');

      const downloadInfo = await this.binaryManager.needsDownload();
      
      if (!downloadInfo.needed) {
        vscode.window.showInformationMessage('All required binaries are already available.');
        return;
      }

      const proceed = await vscode.window.showWarningMessage(
        `This will download missing binaries: ${downloadInfo.binaries.join(', ')}. Continue?`,
        { modal: true },
        'Download',
        'Cancel'
      );

      if (proceed !== 'Download') {
        this.logger.info('Download Binaries command cancelled by user');
        return;
      }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Downloading binaries...',
        cancellable: false
      }, async (progress) => {
        // Set up progress callback
        this.binaryManager.setDownloadProgressCallback((downloadProgress) => {
          progress.report({ 
            message: `Downloading ${downloadProgress.binary}: ${downloadProgress.percentage}%`,
            increment: downloadProgress.percentage / downloadInfo.binaries.length
          });
        });

        const result = await this.binaryManager.ensureBinariesAvailable();

        if (result.success) {
          progress.report({ message: 'Download completed successfully', increment: 100 });
          this.errorHandler.showSuccess('All binaries downloaded successfully');
          
          // Refresh sidebar state
          if (this.sidebarProvider) {
            this.sidebarProvider.refresh();
          }
        } else {
          throw new Error(`Download failed: ${result.errors.join(', ')}`);
        }
      });

    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Unknown download error'),
        'Download Binaries command'
      );
    }
  }

  /**
   * Refresh binary detection (clear cache and re-detect)
   */
  async refreshBinariesCommand(): Promise<void> {
    try {
      this.logger.info('Refresh Binaries command executed');

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Refreshing binary detection...',
        cancellable: false
      }, async (progress) => {
        progress.report({ message: 'Clearing detection cache...' });
        
        await this.binaryManager.refreshDetection();
        
        progress.report({ message: 'Re-detecting binaries...', increment: 50 });
        
        const detectionStatus = await this.binaryManager.getDetectionStatus();
        
        progress.report({ message: 'Detection refreshed', increment: 100 });

        const foundBinaries = Array.from(detectionStatus.entries())
          .filter(([_, status]) => status.found)
          .map(([name, _]) => name);

        this.errorHandler.showSuccess(
          foundBinaries.length > 0 
            ? `Binary detection refreshed. Found: ${foundBinaries.join(', ')}`
            : 'Binary detection refreshed. No binaries found.'
        );

        // Refresh sidebar state
        if (this.sidebarProvider) {
          this.sidebarProvider.refresh();
        }
      });

    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Unknown refresh error'),
        'Refresh Binaries command'
      );
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopStatusUpdates();
    this.errorHandler.dispose();
  }
}