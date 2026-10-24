import * as vscode from 'vscode';
import { ProcessManager } from './processManager';
import { ConfigManager } from './configManager';
import { Logger } from './logger';
import { BinaryManager } from './binaryManager';
import { isHeadless, startEmulator, stopEmulator } from './emulator';
import { exec } from '../mcp/avd';
import { ErrorHandler, ProgressContext } from '../utils/errorHandler';

export class CommandManager {
  private processManager: ProcessManager;
  private configManager: ConfigManager;
  private logger: Logger;
  private binaryManager: BinaryManager;
  private errorHandler: ErrorHandler;
  private sidebarProvider?: any;
  private statusUpdateInterval?: NodeJS.Timeout;

  constructor(processManager: ProcessManager, configManager: ConfigManager, logger: Logger, binaryManager: BinaryManager, sidebarProvider?: any) {
    this.processManager = processManager;
    this.configManager = configManager;
    this.logger = logger;
    this.binaryManager = binaryManager;
    this.errorHandler = new ErrorHandler(logger);
    this.sidebarProvider = sidebarProvider;
    
    if (this.sidebarProvider) {
      this.startStatusUpdates();
    }
  }

  registerCommands(context: vscode.ExtensionContext): void {
    const commands = [
      vscode.commands.registerCommand('droidbridge.connectDevice', (ip?: string, port?: string) => this.connectDeviceCommand(ip, port)),
      
      vscode.commands.registerCommand('droidbridge.disconnectDevice', () => this.disconnectDeviceCommand()),
      
      vscode.commands.registerCommand('droidbridge.launchScrcpy', () => this.launchScrcpyCommand()),
      
      vscode.commands.registerCommand('droidbridge.launchScrcpyScreenOff', () => this.launchScrcpyScreenOffCommand()),

      vscode.commands.registerCommand('droidbridge.startEmulator', async () => {
        if (await this.startEmulatorCommand() && isHeadless()) {
          await vscode.commands.executeCommand('droidbridge.startMirror');
        }
      }),

      vscode.commands.registerCommand('droidbridge.stopEmulator', async () => stopEmulator(await this.binaryManager.getAdbPath())),
      
      vscode.commands.registerCommand('droidbridge.stopScrcpy', () => this.stopScrcpyCommand()),
      
      vscode.commands.registerCommand('droidbridge.showLogs', () => this.showLogsCommand()),

      vscode.commands.registerCommand('droidbridge.resetAdb', () => this.resetAdbCommand()),
      
      vscode.commands.registerCommand('droidbridge.checkBinaries', () => this.checkBinariesCommand()),
      vscode.commands.registerCommand('droidbridge.downloadBinaries', () => this.downloadBinariesCommand()),
      vscode.commands.registerCommand('droidbridge.refreshBinaries', () => this.refreshBinariesCommand()),
      vscode.commands.registerCommand('droidbridge.pairDevice', (hostPort?: string, code?: string) => this.pairDeviceCommand(hostPort, code)),
    ];

    commands.forEach(command => context.subscriptions.push(command));
    
    this.logger.info('All DroidBridge commands registered successfully');
  }

  async connectDeviceCommand(providedIp?: string, providedPort?: string): Promise<void> {
    try {
      this.logger.info('Connect Device command executed');

      const config = this.configManager.getConfigWithDefaults();
      let ip = providedIp || config.ip;
      let port = providedPort || config.port;

      if (!providedIp || !providedPort) {
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

      const ipValidation = this.errorHandler.validateAndHandleInput(ip, 'ip', 'IP address');
      if (!ipValidation.isValid) {
        return;
      }

      const portValidation = this.errorHandler.validateAndHandleInput(port, 'port', 'Port number');
      if (!portValidation.isValid) {
        return;
      }

      const progressContext: ProgressContext = {
        title: `Connecting to ${ip}:${port}...`,
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
            this.logger.showSuccess(`Device connected to ${ip}:${port}`);
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
      
      this.logger.error('Failed to execute Connect Device command', error instanceof Error ? error : undefined);
      this.logger.showError('Failed to execute Connect Device command');
    }
  }

  async disconnectDeviceCommand(): Promise<void> {
    try {
      this.logger.info('Disconnect Device command executed');

      if (!this.processManager.isDeviceConnected()) {
        this.logger.showWarning('No device is currently connected');
        return;
      }

      const connectionState = this.processManager.getConnectionState();
      const target = connectionState.deviceIp && connectionState.devicePort 
        ? `${connectionState.deviceIp}:${connectionState.devicePort}` 
        : 'device';

      const progressContext: ProgressContext = {
        title: `Disconnecting from ${target}...`,
        cancellable: false,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: 'Disconnecting device...' });
          const success = await this.disconnectDevice();
          
          if (success) {
            progress.report({ message: 'Disconnected successfully', increment: 100 });
            this.logger.showSuccess(`Device disconnected from ${target}`);
          }
          
          return success;
        },
        progressContext,
        'disconnect-device'
      );
    } catch (error) {
      this.logger.error('Failed to execute Disconnect Device command', error instanceof Error ? error : undefined);
      this.logger.showError('Failed to execute Disconnect Device command');
    }
  }

    private async ensureDevice(): Promise<boolean> {
    if (await this.hasAnyDevice()) {
      return this.processManager.chooseDevice();
    }
    const choice = await vscode.window.showWarningMessage(
      'No device is connected.',
      { title: 'Start Emulator' },
      { title: 'Connect Device' },
      { title: 'Launch Anyway' }
    );
    if (choice?.title === 'Start Emulator') {
      return !!(await this.startEmulatorCommand());
    }
    if (choice?.title === 'Connect Device') {
      await this.connectDeviceCommand();
      return this.processManager.isDeviceConnected();
    }
    return choice?.title === 'Launch Anyway';
  }

  async startEmulatorCommand(): Promise<string | undefined> {
    try {
      return await startEmulator(await this.binaryManager.getAdbPath());
    } catch (error) {
      this.logger.error('Failed to start emulator', error instanceof Error ? error : undefined);
      vscode.window.showErrorMessage(`DroidBridge: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  async launchScrcpyCommand(): Promise<void> {
    try {
      this.logger.info('Launch Scrcpy command executed');

      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return;
      }

      if (!(await this.ensureDevice())) {
        return;
      }

      const progressContext: ProgressContext = {
        title: 'Launching scrcpy...',
        cancellable: true,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error('Scrcpy launch cancelled by user');
          }
          
          progress.report({ message: 'Opening scrcpy window...' });
          const result = await this.processManager.launchScrcpySidebar(this.configManager.getScrcpyOptions());
          
          if (result.success) {
            if (this.sidebarProvider) {
              this.sidebarProvider.updateScrcpyStatus(true);
            }
            progress.report({ message: 'Scrcpy window opened', increment: 100 });
            return true;
          } else {
            throw new Error(result.message || 'Failed to launch scrcpy');
          }
        },
        progressContext,
        'launch-scrcpy'
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger.info('Launch Scrcpy command cancelled by user');
        return;
      }
      
      this.logger.error('Failed to execute Launch Scrcpy command', error instanceof Error ? error : undefined);
      this.logger.showError('Failed to execute Launch Scrcpy command');
    }
  }

  async launchScrcpyScreenOffCommand(): Promise<void> {
    try {
      this.logger.info('Launch Scrcpy Screen Off command executed');

      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return;
      }

      if (!(await this.ensureDevice())) {
        return;
      }

      const progressContext: ProgressContext = {
        title: 'Launching scrcpy with screen off...',
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
            this.logger.showSuccess('Scrcpy launched successfully with screen off');
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
      
      this.logger.error('Failed to execute Launch Scrcpy Screen Off command', error instanceof Error ? error : undefined);
      this.logger.showError('Failed to execute Launch Scrcpy Screen Off command');
    }
  }

  async stopScrcpyCommand(): Promise<void> {
    try {
      this.logger.info('Stop Scrcpy command executed');

      if (!this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is not currently running');
        return;
      }

      const progressContext: ProgressContext = {
        title: 'Stopping scrcpy...',
        cancellable: false,
        location: vscode.ProgressLocation.Notification
      };

      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: 'Stopping screen mirroring...' });
          const success = await this.stopScrcpy();
          
          if (success) {
            progress.report({ message: 'Screen mirroring stopped', increment: 100 });
            this.logger.showSuccess('Scrcpy stopped successfully');
            
          }
          
          return success;
        },
        progressContext,
        'stop-scrcpy'
      );
    } catch (error) {
      this.logger.error('Failed to execute Stop Scrcpy command', error instanceof Error ? error : undefined);
      this.logger.showError('Failed to execute Stop Scrcpy command');
    }
  }

  async resetAdbCommand(): Promise<void> {
    const choice = await vscode.window.showWarningMessage(
      'Reset ADB? This stops mirroring and scrcpy, removes port forwards and restarts the ADB server. USB devices and emulators reconnect on their own.',
      { modal: true },
      'Reset ADB'
    );
    if (choice !== 'Reset ADB') {
      return;
    }
    const { connected, deviceIp, devicePort } = this.processManager.getConnectionState();
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Resetting ADB' }, async progress => {
      await vscode.commands.executeCommand('droidbridge.stopMirror');
      await this.processManager.stopScrcpy().catch(() => undefined);
      this.sidebarProvider?.updateScrcpyStatus(false);
      const adb = await this.binaryManager.getAdbPath();
      await exec(adb, ['forward', '--remove-all'], { timeout: 10000 }).catch(() => undefined);
      await exec(adb, ['kill-server'], { timeout: 10000 }).catch(() => undefined);
      progress.report({ message: 'Starting the ADB server...' });
      await exec(adb, ['start-server'], { timeout: 30000 });
      if (connected && deviceIp && devicePort) {
        progress.report({ message: `Reconnecting ${deviceIp}:${devicePort}...` });
        const ok = await this.processManager.connectDevice(deviceIp, devicePort).catch(() => false);
        this.sidebarProvider?.updateConnectionStatus(ok, deviceIp, devicePort);
      }
    }).then(
      () => this.logger.showSuccess('ADB was reset'),
      error => this.logger.showError(`ADB reset failed: ${error instanceof Error ? error.message : String(error)}`)
    );
  }

  showLogsCommand(): void {
    try {
      this.logger.info('Show Logs command executed');
      this.logger.show();
    } catch (error) {
      this.logger.error('Failed to execute Show Logs command', error instanceof Error ? error : undefined);
      this.logger.showError('Failed to execute Show Logs command');
    }
  }

  async connectDevice(ip?: string, port?: string): Promise<boolean> {
    const config = this.configManager.getConfigWithDefaults();
    const targetIp = ip || config.ip;
    const targetPort = port || config.port;

    try {
      const validation = this.configManager.validateConnection(targetIp, targetPort);
      if (!validation.isValid) {
        const errorMessage = `Invalid connection parameters: ${validation.errors.join(', ')}`;
        this.logger.showError(errorMessage);
        return false;
      }

      const success = await this.processManager.connectDevice(targetIp, targetPort);
      
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const errorMessage = connectionState.connectionError || 'Failed to connect to device';
        this.logger.showError(`${errorMessage}`);
        
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
        error instanceof Error ? error : new Error('Unknown connection error'),
        { ip: targetIp, port: targetPort }
      );
      return false;
    }
  }

  async disconnectDevice(): Promise<boolean> {
    try {
      const success = await this.processManager.disconnectDevice();
      
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const errorMessage = connectionState.connectionError || 'Failed to disconnect from device';
        this.logger.showError(`${errorMessage}`);
        
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
        error instanceof Error ? error : new Error('Unknown disconnection error')
      );
      return false;
    }
  }

  async launchScrcpy(): Promise<boolean> {
    try {
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return false;
      }

      const process = await this.processManager.launchScrcpy(this.configManager.getScrcpyOptions());
      
      if (!process || !process.pid) {
        const processError = new Error('Failed to launch scrcpy - invalid process');
        this.errorHandler.handleProcessError(processError, 'scrcpy');
        
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
        error instanceof Error ? error : new Error('Unknown scrcpy launch error'),
        'scrcpy'
      );
      return false;
    }
  }

  async launchScrcpyScreenOff(): Promise<boolean> {
    try {
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning('Scrcpy is already running. Stop the current instance first.');
        return false;
      }

      const process = await this.processManager.launchScrcpyScreenOff(this.configManager.getScrcpyOptions());
      
      if (!process || !process.pid) {
        const processError = new Error('Failed to launch scrcpy with screen off - invalid process');
        this.errorHandler.handleProcessError(processError, 'scrcpy screen off');
        
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
        error instanceof Error ? error : new Error('Unknown scrcpy screen off launch error'),
        'scrcpy screen off'
      );
      return false;
    }
  }

  async stopScrcpy(): Promise<boolean> {
    try {
      const success = await this.processManager.stopScrcpy();
      
      if (!success) {
        this.logger.showError('Failed to stop scrcpy');
        return false;
      }

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

  private async hasAnyDevice(): Promise<boolean> {
    if (this.processManager.isDeviceConnected()) {
      return true;
    }
    const serials = await this.processManager.getDeviceSerials().catch(() => []);
    return (serials ?? []).length > 0;
  }

  isDeviceConnected(): boolean {
    return this.processManager.isDeviceConnected();
  }

  isScrcpyRunning(): boolean {
    return this.processManager.isScrcpyRunning();
  }

  getConnectionState() {
    return this.processManager.getConnectionState();
  }

  getScrcpyState() {
    return this.processManager.getScrcpyState();
  }

  setSidebarProvider(sidebarProvider: any): void {
    this.sidebarProvider = sidebarProvider;
    
    if (!this.statusUpdateInterval) {
      this.startStatusUpdates();
    }
    
    this.updateSidebarState();
  }

  private startStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      return;
    }

    this.statusUpdateInterval = setInterval(() => {
      this.updateSidebarState();
    }, 2000);
  }

  private stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = undefined;
    }
  }

  private updateSidebarState(): void {
    if (!this.sidebarProvider) {
      return;
    }

    try {
      const connectionState = this.processManager.getConnectionState();
      const scrcpyState = this.processManager.getScrcpyState();
      
      this.sidebarProvider.synchronizeState(connectionState, scrcpyState);
    } catch (error) {
      this.logger.error('Failed to update sidebar state', error instanceof Error ? error : undefined);
    }
  }

  refreshSidebarState(): void {
    this.updateSidebarState();
  }

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

        const statusLines: string[] = [];
        statusLines.push('=== DroidBridge Binary Status ===\n');

        const adbStatus = detectionStatus.get('adb');
        statusLines.push(`ADB: ${adbStatus?.found ? 'Found' : 'Not Found'}`);
        if (adbStatus?.found) {
          statusLines.push(`  Path: ${adbStatus.path}`);
          statusLines.push(`  Source: ${this.getSourceDescription(adbStatus.source)}`);
          if (adbStatus.version) {
            statusLines.push(`  Version: ${adbStatus.version}`);
          }
        }

        const scrcpyStatus = detectionStatus.get('scrcpy');
        statusLines.push(`\nScrcpy: ${scrcpyStatus?.found ? 'Found' : 'Not Found'}`);
        if (scrcpyStatus?.found) {
          statusLines.push(`  Path: ${scrcpyStatus.path}`);
          statusLines.push(`  Source: ${this.getSourceDescription(scrcpyStatus.source)}`);
          if (scrcpyStatus.version) {
            statusLines.push(`  Version: ${scrcpyStatus.version}`);
          }
        }

        if (downloadInfo.needed) {
          statusLines.push(`\n Missing binaries: ${downloadInfo.binaries.join(', ')}`);
          statusLines.push('Use "DroidBridge: Download Binaries" to download missing binaries.');
        } else {
          statusLines.push('\nAll required binaries are available');
        }

        const statusReport = statusLines.join('\n');
        this.logger.info('Binary status check completed');
        this.logger.info(statusReport);

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

  private getSourceDescription(source: string): string {
    switch (source) {
      case 'system': return 'System PATH';
      case 'bundled': return 'Bundled with extension';
      case 'downloaded': return 'Downloaded by extension';
      case 'custom': return 'Custom path (user configured)';
      case 'not-found': return 'Not found';
      default: return source;
    }
  }

  private async pairDeviceCommand(hostPortArg?: string, codeArg?: string): Promise<void> {
    try {
      let hostPort = hostPortArg;
      let code = codeArg;

      if (!hostPort) {
        hostPort = await vscode.window.showInputBox({
          prompt: 'Enter pairing host:port (e.g. 192.168.1.50:37123)',
          validateInput: v => /.+:\d+/.test(v.trim()) ? null : 'Format must be host:port'
        }) || undefined;
      }
      if (!hostPort) {
        return;
      }
      if (!code) {
        code = await vscode.window.showInputBox({
          prompt: 'Enter 6-digit pairing code',
          validateInput: v => /^\d{6}$/.test(v.trim()) ? null : 'Must be 6 digits'
        }) || undefined;
      }
      if (!code) {
        return;
      }

      const [host, port] = hostPort.trim().split(':');
      const result = await (this.processManager as any).pairDevice(code.trim(), host, port);
      if (result.success) {
        vscode.window.showInformationMessage(result.message);
        this.logger.info(result.message);
        
        vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: "Attempting auto-connection..." },
          async () => {
            const autoConnectResult = await (this.processManager as any).tryAutoConnectAfterPairing(host);
            
            if (autoConnectResult.success) {
              vscode.window.showInformationMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection successful: ${autoConnectResult.message}`);
              
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(host);
                this.sidebarProvider.updatePort(autoConnectResult.connectedPort || '5555');
              }
            } else {
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(host);
                this.sidebarProvider.updatePort('5555');
              }
              
              vscode.window.showWarningMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection failed, manual connection needed: ${autoConnectResult.message}`);
            }
          }
        );
      } else {
        const errorMessage = `Pairing failed: ${result.message}`;
        vscode.window.showErrorMessage(errorMessage);
        this.logger.error(errorMessage);
      }
    } catch (e) {
      this.logger.error('Pairing command failed', e as Error);
      vscode.window.showErrorMessage('Pairing failed. See logs.');
    }
  }

  dispose(): void {
    this.stopStatusUpdates();
    this.errorHandler.dispose();
  }
}