import * as vscode from 'vscode';
import { ProcessManager } from './processManager';
import { ConfigManager } from './configManager';
import { Logger } from './logger';

/**
 * Manages all VSCode commands for the DroidBridge extension
 * Implements requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export class CommandManager {
  private processManager: ProcessManager;
  private configManager: ConfigManager;
  private logger: Logger;

  constructor(processManager: ProcessManager, configManager: ConfigManager, logger: Logger) {
    this.processManager = processManager;
    this.configManager = configManager;
    this.logger = logger;
  }

  /**
   * Register all DroidBridge commands with VSCode
   * Requirement 4.6: Register all commands with VSCode
   */
  registerCommands(context: vscode.ExtensionContext): void {
    const commands = [
      // Requirement 4.1: Connect to Device command
      vscode.commands.registerCommand('droidbridge.connectDevice', () => this.connectDeviceCommand()),
      
      // Requirement 4.2: Disconnect Device command
      vscode.commands.registerCommand('droidbridge.disconnectDevice', () => this.disconnectDeviceCommand()),
      
      // Requirement 4.3: Launch Scrcpy command
      vscode.commands.registerCommand('droidbridge.launchScrcpy', () => this.launchScrcpyCommand()),
      
      // Launch Scrcpy Screen Off command (additional functionality)
      vscode.commands.registerCommand('droidbridge.launchScrcpyScreenOff', () => this.launchScrcpyScreenOffCommand()),
      
      // Requirement 4.4: Stop Scrcpy command
      vscode.commands.registerCommand('droidbridge.stopScrcpy', () => this.stopScrcpyCommand()),
      
      // Requirement 4.5: Show Logs command
      vscode.commands.registerCommand('droidbridge.showLogs', () => this.showLogsCommand())
    ];

    // Add all command disposables to the extension context
    commands.forEach(command => context.subscriptions.push(command));
    
    this.logger.info('All DroidBridge commands registered successfully');
  }

  /**
   * Connect to Android device via ADB
   * Requirement 4.1: Provide "DroidBridge: Connect to Device" command
   */
  async connectDeviceCommand(): Promise<void> {
    try {
      this.logger.info('Connect Device command executed');

      // Get default values from configuration
      const config = this.configManager.getConfigWithDefaults();
      let ip = config.ip;
      let port = config.port;

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

      // Validate the combination
      const validation = this.configManager.validateConnection(ip, port);
      if (!validation.isValid) {
        const errorMessage = `Invalid connection parameters: ${validation.errors.join(', ')}`;
        this.logger.showError(errorMessage);
        return;
      }

      // Show progress notification
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `🔌 Connecting to ${ip}:${port}...`,
          cancellable: false
        },
        async () => {
          const success = await this.connectDevice(ip, port);
          if (success) {
            this.logger.showSuccess(`✅ Device connected to ${ip}:${port}`);
          }
        }
      );

    } catch (error) {
      const errorMessage = 'Failed to execute Connect Device command';
      this.logger.error(errorMessage, error instanceof Error ? error : undefined);
      this.logger.showError(errorMessage);
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

      // Show progress notification
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `🔌 Disconnecting from ${target}...`,
          cancellable: false
        },
        async () => {
          const success = await this.disconnectDevice();
          if (success) {
            this.logger.showSuccess(`✅ Device disconnected from ${target}`);
          }
        }
      );

    } catch (error) {
      const errorMessage = 'Failed to execute Disconnect Device command';
      this.logger.error(errorMessage, error instanceof Error ? error : undefined);
      this.logger.showError(errorMessage);
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

      // Show progress notification
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '📱 Launching scrcpy...',
          cancellable: false
        },
        async () => {
          const success = await this.launchScrcpy();
          if (success) {
            this.logger.showSuccess('✅ Scrcpy launched successfully');
          }
        }
      );

    } catch (error) {
      const errorMessage = 'Failed to execute Launch Scrcpy command';
      this.logger.error(errorMessage, error instanceof Error ? error : undefined);
      this.logger.showError(errorMessage);
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

      // Show progress notification
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '📱 Launching scrcpy with screen off...',
          cancellable: false
        },
        async () => {
          const success = await this.launchScrcpyScreenOff();
          if (success) {
            this.logger.showSuccess('✅ Scrcpy launched successfully with screen off');
          }
        }
      );

    } catch (error) {
      const errorMessage = 'Failed to execute Launch Scrcpy Screen Off command';
      this.logger.error(errorMessage, error instanceof Error ? error : undefined);
      this.logger.showError(errorMessage);
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

      // Show progress notification
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '📱 Stopping scrcpy...',
          cancellable: false
        },
        async () => {
          const success = await this.stopScrcpy();
          if (success) {
            this.logger.showSuccess('✅ Scrcpy stopped successfully');
          }
        }
      );

    } catch (error) {
      const errorMessage = 'Failed to execute Stop Scrcpy command';
      this.logger.error(errorMessage, error instanceof Error ? error : undefined);
      this.logger.showError(errorMessage);
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
      const errorMessage = 'Failed to execute Show Logs command';
      this.logger.error(errorMessage, error instanceof Error ? error : undefined);
      this.logger.showError(errorMessage);
    }
  }

  /**
   * Connect to device with validation and error handling
   * Internal method used by command and sidebar
   */
  async connectDevice(ip?: string, port?: string): Promise<boolean> {
    try {
      // Use provided values or get from configuration
      const config = this.configManager.getConfigWithDefaults();
      const targetIp = ip || config.ip;
      const targetPort = port || config.port;

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
        const errorMessage = connectionState.connectionError || 'Failed to connect to device';
        this.logger.showError(`❌ ${errorMessage}`);
        return false;
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Connection failed', error instanceof Error ? error : undefined);
      this.logger.showError(`❌ Connection failed: ${errorMessage}`);
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
        const errorMessage = connectionState.connectionError || 'Failed to disconnect from device';
        this.logger.showError(`❌ ${errorMessage}`);
        return false;
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Disconnection failed', error instanceof Error ? error : undefined);
      this.logger.showError(`❌ Disconnection failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Launch scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async launchScrcpy(): Promise<boolean> {
    try {
      // Check for duplicate instances
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return false;
      }

      const process = await this.processManager.launchScrcpy();
      
      if (!process) {
        this.logger.showError('❌ Failed to launch scrcpy');
        return false;
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Failed to launch scrcpy', error instanceof Error ? error : undefined);
      
      // Handle specific error cases
      if (errorMessage.includes('already running')) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
      } else {
        this.logger.showError(`❌ Failed to launch scrcpy: ${errorMessage}`);
      }
      
      return false;
    }
  }

  /**
   * Launch scrcpy with screen off functionality
   * Internal method used by command and sidebar
   */
  async launchScrcpyScreenOff(): Promise<boolean> {
    try {
      // Check for duplicate instances
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return false;
      }

      const process = await this.processManager.launchScrcpyScreenOff();
      
      if (!process) {
        this.logger.showError('❌ Failed to launch scrcpy with screen off');
        return false;
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Failed to launch scrcpy with screen off', error instanceof Error ? error : undefined);
      
      // Handle specific error cases
      if (errorMessage.includes('already running')) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
      } else {
        this.logger.showError(`❌ Failed to launch scrcpy with screen off: ${errorMessage}`);
      }
      
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
        this.logger.showError('❌ Failed to stop scrcpy');
        return false;
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Failed to stop scrcpy', error instanceof Error ? error : undefined);
      this.logger.showError(`❌ Failed to stop scrcpy: ${errorMessage}`);
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
}