import * as assert from 'assert';
import * as sinon from 'sinon';
import { CommandManager } from '../managers/commandManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { BinaryManager } from '../managers/binaryManager';
import { Logger } from '../managers/logger';

class MockSidebarProvider {
  private connectionStatus: boolean = false;
  private scrcpyStatus: boolean = false;
  private currentIp: string = '';
  private currentPort: string = '';

  updateConnectionStatus(connected: boolean, ip?: string, port?: string): void {
    this.connectionStatus = connected;
    if (ip) {
      this.currentIp = ip;
    }
    if (port) {
      this.currentPort = port;
    }
  }

  updateScrcpyStatus(running: boolean): void {
    this.scrcpyStatus = running;
  }

  synchronizeState(connectionState: any, scrcpyState: any): void {
    this.connectionStatus = connectionState.connected;
    this.scrcpyStatus = scrcpyState.running;
    
    if (connectionState.deviceIp) {
      this.currentIp = connectionState.deviceIp;
    }
    if (connectionState.devicePort) {
      this.currentPort = connectionState.devicePort;
    }
  }

  getCurrentState() {
    return {
      connectionStatus: this.connectionStatus,
      scrcpyStatus: this.scrcpyStatus,
      currentIp: this.currentIp,
      currentPort: this.currentPort
    };
  }

  reset(): void {
    this.connectionStatus = false;
    this.scrcpyStatus = false;
    this.currentIp = '';
    this.currentPort = '';
  }
}

suite('Sidebar Integration Unit Tests', () => {
  let commandManager: CommandManager;
  let mockProcessManager: sinon.SinonStubbedInstance<ProcessManager>;
  let mockConfigManager: sinon.SinonStubbedInstance<ConfigManager>;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockBinaryManager: sinon.SinonStubbedInstance<BinaryManager>;
  let mockSidebarProvider: MockSidebarProvider;

  setup(() => {
    mockProcessManager = sinon.createStubInstance(ProcessManager);
    mockConfigManager = sinon.createStubInstance(ConfigManager);
    mockLogger = sinon.createStubInstance(Logger);
    mockBinaryManager = sinon.createStubInstance(BinaryManager);
    mockSidebarProvider = new MockSidebarProvider();

    mockConfigManager.getConfigWithDefaults.returns({
      ip: '192.168.1.100',
      port: '5555'
    });
    mockConfigManager.validateConnection.returns({
      isValid: true,
      errors: []
    });
    mockProcessManager.getConnectionState.returns({
      connected: false
    });
    mockProcessManager.getScrcpyState.returns({
      running: false
    });

    commandManager = new CommandManager(mockProcessManager as any, mockConfigManager as any, mockLogger as any, mockBinaryManager as any, mockSidebarProvider as any);
  });

  teardown(() => {
    if (commandManager) {
      commandManager.dispose();
    }
    sinon.restore();
  });

  suite('Connection Integration', () => {
    test('should update sidebar on successful connection', async () => {
      mockProcessManager.connectDevice.resolves(true);
      mockProcessManager.getConnectionState.returns({
        connected: true,
        deviceIp: '192.168.1.100',
        devicePort: '5555'
      });

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, true);
      assert.ok(mockProcessManager.connectDevice.calledWith('192.168.1.100', '5555'));

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.connectionStatus, true);
      assert.strictEqual(sidebarState.currentIp, '192.168.1.100');
      assert.strictEqual(sidebarState.currentPort, '5555');
    });

    test('should update sidebar on failed connection', async () => {
      mockProcessManager.connectDevice.resolves(false);
      mockProcessManager.getConnectionState.returns({
        connected: false,
        connectionError: 'Connection refused'
      });

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.connectionStatus, false);
    });

    test('should update sidebar on disconnection', async () => {
      mockSidebarProvider.updateConnectionStatus(true, '192.168.1.100', '5555');

      mockProcessManager.disconnectDevice.resolves(true);
      mockProcessManager.getConnectionState.returns({
        connected: false
      });

      const success = await commandManager.disconnectDevice();

      assert.strictEqual(success, true);

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.connectionStatus, false);
    });

    test('should handle validation errors', async () => {
      mockConfigManager.validateConnection.returns({
        isValid: false,
        errors: ['Invalid IP address']
      });

      const success = await commandManager.connectDevice('invalid-ip', '5555');

      assert.strictEqual(success, false);
      assert.ok(mockLogger.showError.called);
      assert.ok(mockProcessManager.connectDevice.notCalled);
    });
  });

  suite('Scrcpy Integration', () => {
    test('should update sidebar on successful scrcpy launch', async () => {
      const mockProcess = { pid: 12345 } as any;
      mockProcessManager.launchScrcpy.resolves(mockProcess);
      mockProcessManager.isScrcpyRunning.returns(false).onSecondCall().returns(true);
      mockProcessManager.getScrcpyState.returns({
        running: true,
        process: mockProcess
      });

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, true);

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.scrcpyStatus, true);
    });

    test('should update sidebar on scrcpy stop', async () => {
      mockSidebarProvider.updateScrcpyStatus(true);

      mockProcessManager.stopScrcpy.resolves(true);
      mockProcessManager.getScrcpyState.returns({
        running: false
      });

      const success = await commandManager.stopScrcpy();

      assert.strictEqual(success, true);

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.scrcpyStatus, false);
    });

    test('should handle duplicate scrcpy launch attempts', async () => {
      mockProcessManager.isScrcpyRunning.returns(true);

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok(mockLogger.showWarning.called);
      assert.ok(mockProcessManager.launchScrcpy.notCalled);
    });

    test('should handle scrcpy launch failure', async () => {
      mockProcessManager.launchScrcpy.rejects(new Error('Failed to launch scrcpy'));
      mockProcessManager.isScrcpyRunning.returns(false);

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok(mockLogger.error.called);

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.scrcpyStatus, false);
    });
  });

  suite('State Synchronization', () => {
    test('should synchronize sidebar with process states', () => {
      const connectionState = {
        connected: true,
        deviceIp: '192.168.1.150',
        devicePort: '5557'
      };

      const scrcpyState = {
        running: true
      };

      mockSidebarProvider.synchronizeState(connectionState, scrcpyState);

      const sidebarState = mockSidebarProvider.getCurrentState();
      assert.strictEqual(sidebarState.connectionStatus, true);
      assert.strictEqual(sidebarState.scrcpyStatus, true);
      assert.strictEqual(sidebarState.currentIp, '192.168.1.150');
      assert.strictEqual(sidebarState.currentPort, '5557');
    });

    test('should handle periodic status updates', (done) => {
      let callCount = 0;
      mockProcessManager.getConnectionState.callsFake(() => {
        callCount++;
        return {
          connected: callCount > 1,
          deviceIp: callCount > 1 ? '192.168.1.100' : undefined,
          devicePort: callCount > 1 ? '5555' : undefined
        };
      });

      mockProcessManager.getScrcpyState.returns({
        running: false
      });

      commandManager.setSidebarProvider(mockSidebarProvider);

      setTimeout(() => {
        assert.ok(mockProcessManager.getConnectionState.callCount >= 2);

        const sidebarState = mockSidebarProvider.getCurrentState();
        assert.strictEqual(sidebarState.connectionStatus, true);

        done();
      }, 2500); // Wait slightly longer than the 2-second interval
    });

    test('should handle status update errors gracefully', () => {
      const errorSidebar = {
        synchronizeState: sinon.stub().throws(new Error('Sidebar error'))
      };

      const errorCommandManager = new CommandManager(mockProcessManager as any, mockConfigManager as any, mockLogger as any, mockBinaryManager as any, errorSidebar);

      assert.doesNotThrow(() => {
        errorCommandManager.refreshSidebarState();
      });

      assert.ok(mockLogger.error.called);

      errorCommandManager.dispose();
    });
  });

  suite('Command Manager Lifecycle', () => {
    test('should start status updates when sidebar provider is set', () => {
      const newCommandManager = new CommandManager(mockProcessManager as any, mockConfigManager as any, mockLogger as any, mockBinaryManager as any);

      assert.ok(mockProcessManager.getConnectionState.notCalled);

      newCommandManager.setSidebarProvider(mockSidebarProvider);

      assert.ok(mockProcessManager.getConnectionState.called);
      assert.ok(mockProcessManager.getScrcpyState.called);

      newCommandManager.dispose();
    });

    test('should stop status updates on dispose', (done) => {
      commandManager.setSidebarProvider(mockSidebarProvider);

      setTimeout(() => {
        const initialCallCount = mockProcessManager.getConnectionState.callCount;

        commandManager.dispose();

        setTimeout(() => {
          const finalCallCount = mockProcessManager.getConnectionState.callCount;
          assert.strictEqual(finalCallCount, initialCallCount);
          done();
        }, 2500);
      }, 1000);
    });

    test('should provide current process states', () => {
      mockProcessManager.isDeviceConnected.returns(true);
      mockProcessManager.isScrcpyRunning.returns(false);
      mockProcessManager.getConnectionState.returns({
        connected: true,
        deviceIp: '192.168.1.100',
        devicePort: '5555'
      });
      mockProcessManager.getScrcpyState.returns({
        running: false
      });

      assert.strictEqual(commandManager.isDeviceConnected(), true);
      assert.strictEqual(commandManager.isScrcpyRunning(), false);

      const connectionState = commandManager.getConnectionState();
      assert.strictEqual(connectionState.connected, true);
      assert.strictEqual(connectionState.deviceIp, '192.168.1.100');

      const scrcpyState = commandManager.getScrcpyState();
      assert.strictEqual(scrcpyState.running, false);
    });
  });

  suite('Error Handling', () => {
    test('should handle process manager errors during connection', async () => {
      mockProcessManager.connectDevice.rejects(new Error('Process error'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok(mockLogger.error.called);
      assert.ok(mockLogger.showError.called);
    });

    test('should handle process manager errors during scrcpy launch', async () => {
      mockProcessManager.launchScrcpy.rejects(new Error('Scrcpy error'));
      mockProcessManager.isScrcpyRunning.returns(false);

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok(mockLogger.error.called);
    });

    test('should handle unknown errors gracefully', async () => {
      mockProcessManager.connectDevice.rejects('String error');

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok(mockLogger.error.called);
      assert.ok(mockLogger.showError.called);
    });
  });
});