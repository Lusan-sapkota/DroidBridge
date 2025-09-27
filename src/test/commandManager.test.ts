import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommandManager } from '../managers/commandManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { Logger } from '../managers/logger';
import { BinaryManager } from '../managers/binaryManager';

suite('CommandManager Test Suite', () => {
  let commandManager: CommandManager;
  let processManager: ProcessManager;
  let configManager: ConfigManager;
  let logger: Logger;
  let binaryManager: BinaryManager;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Create mock instances
    binaryManager = sandbox.createStubInstance(BinaryManager);
    logger = sandbox.createStubInstance(Logger);
    processManager = sandbox.createStubInstance(ProcessManager);
    configManager = sandbox.createStubInstance(ConfigManager);
    commandManager = new CommandManager(processManager, configManager, logger);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Command Registration', () => {
    test('should register all required commands', () => {
      const context = {
        subscriptions: []
      } as any;

      const registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
      
      commandManager.registerCommands(context);

      // Verify all required commands are registered
      assert.strictEqual(registerCommandStub.callCount, 6);
      
      const commandNames = registerCommandStub.getCalls().map(call => call.args[0]);
      assert.ok(commandNames.includes('droidbridge.connectDevice'));
      assert.ok(commandNames.includes('droidbridge.disconnectDevice'));
      assert.ok(commandNames.includes('droidbridge.launchScrcpy'));
      assert.ok(commandNames.includes('droidbridge.launchScrcpyScreenOff'));
      assert.ok(commandNames.includes('droidbridge.stopScrcpy'));
      assert.ok(commandNames.includes('droidbridge.showLogs'));

      // Verify commands are added to context subscriptions
      assert.strictEqual(context.subscriptions.length, 6);
    });

    test('should log successful command registration', () => {
      const context = { subscriptions: [] } as any;
      sandbox.stub(vscode.commands, 'registerCommand');
      
      commandManager.registerCommands(context);

      assert.ok((logger.info as sinon.SinonStub).calledWith('All DroidBridge commands registered successfully'));
    });
  });

  suite('Connect Device Command', () => {
    test('should prompt for IP and port, then connect successfully', async () => {
      const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
      showInputBoxStub.onFirstCall().resolves('192.168.1.100'); // IP input
      showInputBoxStub.onSecondCall().resolves('5555'); // Port input

      const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
      withProgressStub.callsFake(async (options, task) => {
        const mockProgress = { report: sandbox.stub() };
        const mockToken = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() };
        return await task(mockProgress, mockToken);
      });

      (configManager.getConfigWithDefaults as sinon.SinonStub).returns({
        ip: '192.168.1.100',
        port: '5555'
      });

      (configManager.validateIpAddress as sinon.SinonStub).returns(true);
      (configManager.validatePort as sinon.SinonStub).returns(true);
      (configManager.validateConnection as sinon.SinonStub).returns({
        isValid: true,
        errors: []
      });

      const connectDeviceStub = sandbox.stub(commandManager, 'connectDevice').resolves(true);

      await commandManager.connectDeviceCommand();

      assert.ok(showInputBoxStub.calledTwice);
      assert.ok(connectDeviceStub.calledWith('192.168.1.100', '5555'));
      assert.ok((logger.showSuccess as sinon.SinonStub).calledWith('✅ Device connected to 192.168.1.100:5555'));
    });

    test('should handle user cancellation during IP input', async () => {
      const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
      showInputBoxStub.onFirstCall().resolves(undefined); // User cancelled

      (configManager.getConfigWithDefaults as sinon.SinonStub).returns({
        ip: '192.168.1.100',
        port: '5555'
      });

      await commandManager.connectDeviceCommand();

      assert.ok(showInputBoxStub.calledOnce);
      assert.ok((logger.info as sinon.SinonStub).calledWith('Connect Device command cancelled by user'));
    });

    test('should handle user cancellation during port input', async () => {
      const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
      showInputBoxStub.onFirstCall().resolves('192.168.1.100'); // IP input
      showInputBoxStub.onSecondCall().resolves(undefined); // User cancelled port

      (configManager.getConfigWithDefaults as sinon.SinonStub).returns({
        ip: '192.168.1.100',
        port: '5555'
      });

      (configManager.validateIpAddress as sinon.SinonStub).returns(true);

      await commandManager.connectDeviceCommand();

      assert.ok(showInputBoxStub.calledTwice);
      assert.ok((logger.info as sinon.SinonStub).calledWith('Connect Device command cancelled by user'));
    });

    test('should handle invalid connection parameters', async () => {
      const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
      showInputBoxStub.onFirstCall().resolves('invalid-ip');
      showInputBoxStub.onSecondCall().resolves('99999');

      (configManager.getConfigWithDefaults as sinon.SinonStub).returns({
        ip: '192.168.1.100',
        port: '5555'
      });

      (configManager.validateIpAddress as sinon.SinonStub).returns(true);
      (configManager.validatePort as sinon.SinonStub).returns(true);
      (configManager.validateConnection as sinon.SinonStub).returns({
        isValid: false,
        errors: ['Invalid IP address', 'Invalid port']
      });

      await commandManager.connectDeviceCommand();

      assert.ok((logger.showError as sinon.SinonStub).calledWith('Invalid connection parameters: Invalid IP address, Invalid port'));
    });

    test('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      sandbox.stub(vscode.window, 'showInputBox').throws(error);
      (configManager.getConfigWithDefaults as sinon.SinonStub).returns({
        ip: '192.168.1.100',
        port: '5555'
      });

      await commandManager.connectDeviceCommand();

      assert.ok((logger.error as sinon.SinonStub).calledWith('Failed to execute Connect Device command', error));
      assert.ok((logger.showError as sinon.SinonStub).calledWith('Failed to execute Connect Device command'));
    });
  });

  suite('Disconnect Device Command', () => {
    test('should disconnect successfully when device is connected', async () => {
      (processManager.isDeviceConnected as sinon.SinonStub).returns(true);
      (processManager.getConnectionState as sinon.SinonStub).returns({
        connected: true,
        deviceIp: '192.168.1.100',
        devicePort: '5555'
      });

      const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
      withProgressStub.callsFake(async (options, task) => {
        const mockProgress = { report: sandbox.stub() };
        const mockToken = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() };
        return await task(mockProgress, mockToken);
      });

      const disconnectDeviceStub = sandbox.stub(commandManager, 'disconnectDevice').resolves(true);

      await commandManager.disconnectDeviceCommand();

      assert.ok(disconnectDeviceStub.called);
      assert.ok((logger.showSuccess as sinon.SinonStub).calledWith('✅ Device disconnected from 192.168.1.100:5555'));
    });

    test('should show warning when no device is connected', async () => {
      (processManager.isDeviceConnected as sinon.SinonStub).returns(false);

      await commandManager.disconnectDeviceCommand();

      assert.ok((logger.showWarning as sinon.SinonStub).calledWith('No device is currently connected'));
    });

    test('should handle disconnection errors', async () => {
      const error = new Error('Disconnection failed');
      (processManager.isDeviceConnected as sinon.SinonStub).throws(error);

      await commandManager.disconnectDeviceCommand();

      assert.ok((logger.error as sinon.SinonStub).calledWith('Failed to execute Disconnect Device command', error));
      assert.ok((logger.showError as sinon.SinonStub).calledWith('Failed to execute Disconnect Device command'));
    });
  });

  suite('Launch Scrcpy Command', () => {
    test('should launch scrcpy successfully when device is connected', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);
      (processManager.isDeviceConnected as sinon.SinonStub).returns(true);

      const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
      withProgressStub.callsFake(async (options, task) => {
        const mockProgress = { report: sandbox.stub() };
        const mockToken = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() };
        return await task(mockProgress, mockToken);
      });

      const launchScrcpyStub = sandbox.stub(commandManager, 'launchScrcpy').resolves(true);

      await commandManager.launchScrcpyCommand();

      assert.ok(launchScrcpyStub.called);
      assert.ok((logger.showSuccess as sinon.SinonStub).calledWith('✅ Scrcpy launched successfully'));
    });

    test('should show warning when scrcpy is already running', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(true);

      await commandManager.launchScrcpyCommand();

      assert.ok((logger.showWarning as sinon.SinonStub).calledWith('Scrcpy is already running. Stop the current instance first.'));
    });

    test('should prompt to connect device when not connected', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);
      (processManager.isDeviceConnected as sinon.SinonStub).returns(false);

      const showWarningMessageStub = sandbox.stub(vscode.window, 'showWarningMessage');
      showWarningMessageStub.resolves({ title: 'Connect Device' });

      const connectDeviceCommandStub = sandbox.stub(commandManager, 'connectDeviceCommand').resolves();
      
      // After connection attempt, device is still not connected
      (processManager.isDeviceConnected as sinon.SinonStub).returns(false);

      await commandManager.launchScrcpyCommand();

      assert.ok(showWarningMessageStub.called);
      assert.ok(connectDeviceCommandStub.called);
    });

    test('should launch anyway when user chooses to launch without connection', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);
      (processManager.isDeviceConnected as sinon.SinonStub).returns(false);

      const showWarningMessageStub = sandbox.stub(vscode.window, 'showWarningMessage');
      showWarningMessageStub.resolves({ title: 'Launch Anyway' });

      const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
      withProgressStub.callsFake(async (options, task) => {
        const mockProgress = { report: sandbox.stub() };
        const mockToken = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() };
        return await task(mockProgress, mockToken);
      });

      const launchScrcpyStub = sandbox.stub(commandManager, 'launchScrcpy').resolves(true);

      await commandManager.launchScrcpyCommand();

      assert.ok(launchScrcpyStub.called);
      assert.ok((logger.showSuccess as sinon.SinonStub).calledWith('✅ Scrcpy launched successfully'));
    });

    test('should handle launch errors', async () => {
      const error = new Error('Launch failed');
      (processManager.isScrcpyRunning as sinon.SinonStub).throws(error);

      await commandManager.launchScrcpyCommand();

      assert.ok((logger.error as sinon.SinonStub).calledWith('Failed to execute Launch Scrcpy command', error));
      assert.ok((logger.showError as sinon.SinonStub).calledWith('Failed to execute Launch Scrcpy command'));
    });
  });

  suite('Launch Scrcpy Screen Off Command', () => {
    test('should launch scrcpy with screen off successfully', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);
      (processManager.isDeviceConnected as sinon.SinonStub).returns(true);

      const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
      withProgressStub.callsFake(async (options, task) => {
        const mockProgress = { report: sandbox.stub() };
        const mockToken = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() };
        return await task(mockProgress, mockToken);
      });

      const launchScrcpyScreenOffStub = sandbox.stub(commandManager, 'launchScrcpyScreenOff').resolves(true);

      await commandManager.launchScrcpyScreenOffCommand();

      assert.ok(launchScrcpyScreenOffStub.called);
      assert.ok((logger.showSuccess as sinon.SinonStub).calledWith('✅ Scrcpy launched successfully with screen off'));
    });

    test('should show warning when scrcpy is already running', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(true);

      await commandManager.launchScrcpyScreenOffCommand();

      assert.ok((logger.showWarning as sinon.SinonStub).calledWith('Scrcpy is already running. Stop the current instance first.'));
    });
  });

  suite('Stop Scrcpy Command', () => {
    test('should stop scrcpy successfully when running', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(true);

      const withProgressStub = sandbox.stub(vscode.window, 'withProgress');
      withProgressStub.callsFake(async (options, task) => {
        const mockProgress = { report: sandbox.stub() };
        const mockToken = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() };
        return await task(mockProgress, mockToken);
      });

      const stopScrcpyStub = sandbox.stub(commandManager, 'stopScrcpy').resolves(true);

      await commandManager.stopScrcpyCommand();

      assert.ok(stopScrcpyStub.called);
      assert.ok((logger.showSuccess as sinon.SinonStub).calledWith('✅ Scrcpy stopped successfully'));
    });

    test('should show warning when scrcpy is not running', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);

      await commandManager.stopScrcpyCommand();

      assert.ok((logger.showWarning as sinon.SinonStub).calledWith('Scrcpy is not currently running'));
    });

    test('should handle stop errors', async () => {
      const error = new Error('Stop failed');
      (processManager.isScrcpyRunning as sinon.SinonStub).throws(error);

      await commandManager.stopScrcpyCommand();

      assert.ok((logger.error as sinon.SinonStub).calledWith('Failed to execute Stop Scrcpy command', error));
      assert.ok((logger.showError as sinon.SinonStub).calledWith('Failed to execute Stop Scrcpy command'));
    });
  });

  suite('Show Logs Command', () => {
    test('should show logs successfully', () => {
      commandManager.showLogsCommand();

      assert.ok((logger.info as sinon.SinonStub).calledWith('Show Logs command executed'));
      assert.ok((logger.show as sinon.SinonStub).called);
    });

    test('should handle show logs errors', () => {
      const error = new Error('Show logs failed');
      (logger.show as sinon.SinonStub).throws(error);

      commandManager.showLogsCommand();

      assert.ok((logger.error as sinon.SinonStub).calledWith('Failed to execute Show Logs command', error));
      assert.ok((logger.showError as sinon.SinonStub).calledWith('Failed to execute Show Logs command'));
    });
  });

  suite('Internal Command Methods', () => {
    test('connectDevice should validate and connect successfully', async () => {
      (configManager.getConfigWithDefaults as sinon.SinonStub).returns({
        ip: '192.168.1.100',
        port: '5555'
      });

      (configManager.validateConnection as sinon.SinonStub).returns({
        isValid: true,
        errors: []
      });

      (processManager.connectDevice as sinon.SinonStub).resolves(true);

      const result = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(result, true);
    });

    test('connectDevice should handle validation errors', async () => {
      (configManager.validateConnection as sinon.SinonStub).returns({
        isValid: false,
        errors: ['Invalid IP']
      });

      const result = await commandManager.connectDevice('invalid', '5555');

      assert.strictEqual(result, false);
      assert.ok((logger.showError as sinon.SinonStub).calledWith('Invalid connection parameters: Invalid IP'));
    });

    test('connectDevice should handle connection failures', async () => {
      (configManager.validateConnection as sinon.SinonStub).returns({
        isValid: true,
        errors: []
      });

      (processManager.connectDevice as sinon.SinonStub).resolves(false);
      (processManager.getConnectionState as sinon.SinonStub).returns({
        connected: false,
        connectionError: 'Connection refused'
      });

      const result = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(result, false);
      assert.ok((logger.showError as sinon.SinonStub).calledWith('❌ Connection refused'));
    });

    test('disconnectDevice should disconnect successfully', async () => {
      (processManager.disconnectDevice as sinon.SinonStub).resolves(true);

      const result = await commandManager.disconnectDevice();

      assert.strictEqual(result, true);
    });

    test('disconnectDevice should handle disconnection failures', async () => {
      (processManager.disconnectDevice as sinon.SinonStub).resolves(false);
      (processManager.getConnectionState as sinon.SinonStub).returns({
        connected: false,
        connectionError: 'Disconnection failed'
      });

      const result = await commandManager.disconnectDevice();

      assert.strictEqual(result, false);
      assert.ok((logger.showError as sinon.SinonStub).calledWith('❌ Disconnection failed'));
    });

    test('launchScrcpy should prevent duplicate instances', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(true);

      const result = await commandManager.launchScrcpy();

      assert.strictEqual(result, false);
      assert.ok((logger.showWarning as sinon.SinonStub).calledWith('Scrcpy is already running. Stop the current instance first.'));
    });

    test('launchScrcpy should launch successfully', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);
      (processManager.launchScrcpy as sinon.SinonStub).resolves({} as any);

      const result = await commandManager.launchScrcpy();

      assert.strictEqual(result, true);
    });

    test('launchScrcpyScreenOff should launch successfully', async () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(false);
      (processManager.launchScrcpyScreenOff as sinon.SinonStub).resolves({} as any);

      const result = await commandManager.launchScrcpyScreenOff();

      assert.strictEqual(result, true);
    });

    test('stopScrcpy should stop successfully', async () => {
      (processManager.stopScrcpy as sinon.SinonStub).resolves(true);

      const result = await commandManager.stopScrcpy();

      assert.strictEqual(result, true);
    });

    test('stopScrcpy should handle stop failures', async () => {
      (processManager.stopScrcpy as sinon.SinonStub).resolves(false);

      const result = await commandManager.stopScrcpy();

      assert.strictEqual(result, false);
      assert.ok((logger.showError as sinon.SinonStub).calledWith('❌ Failed to stop scrcpy'));
    });
  });

  suite('Status Methods', () => {
    test('isDeviceConnected should return process manager status', () => {
      (processManager.isDeviceConnected as sinon.SinonStub).returns(true);

      const result = commandManager.isDeviceConnected();

      assert.strictEqual(result, true);
    });

    test('isScrcpyRunning should return process manager status', () => {
      (processManager.isScrcpyRunning as sinon.SinonStub).returns(true);

      const result = commandManager.isScrcpyRunning();

      assert.strictEqual(result, true);
    });

    test('getConnectionState should return process manager state', () => {
      const mockState = { connected: true, deviceIp: '192.168.1.100' };
      (processManager.getConnectionState as sinon.SinonStub).returns(mockState);

      const result = commandManager.getConnectionState();

      assert.deepStrictEqual(result, mockState);
    });

    test('getScrcpyState should return process manager state', () => {
      const mockState = { running: true, startTime: new Date() };
      (processManager.getScrcpyState as sinon.SinonStub).returns(mockState);

      const result = commandManager.getScrcpyState();

      assert.deepStrictEqual(result, mockState);
    });
  });
});