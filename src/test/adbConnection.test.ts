import * as assert from 'assert';
import * as sinon from 'sinon';
import { ChildProcess, spawn } from 'child_process';
import { ProcessManager } from '../managers/processManager';
import { BinaryManager } from '../managers/binaryManager';
import { Logger } from '../managers/logger';
import { ConfigManager } from '../managers/configManager';

suite('ProcessManager - ADB Connection Integration Tests', () => {
  let processManager: ProcessManager;
  let mockBinaryManager: sinon.SinonStubbedInstance<BinaryManager>;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockConfigManager: sinon.SinonStubbedInstance<ConfigManager>;
  let spawnStub: sinon.SinonStub;

  setup(() => {
    // Create stubbed instances
    mockConfigManager = sinon.createStubInstance(ConfigManager);
    mockBinaryManager = sinon.createStubInstance(BinaryManager);
    mockLogger = sinon.createStubInstance(Logger);
    
    // Stub child_process.spawn
    spawnStub = sinon.stub(require('child_process'), 'spawn');

    // Setup default mock implementations
    mockBinaryManager.getAdbPath.returns('/path/to/adb');

    processManager = new ProcessManager(mockBinaryManager as any, mockLogger as any);
  });

  teardown(async () => {
    // Clean up any processes
    await processManager.cleanup();
    sinon.restore();
  });

  suite('connectDevice', () => {
    test('should successfully connect to a valid device', async () => {
      // Mock successful ADB connect process
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      // Simulate successful connection
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('connected to 192.168.1.100:5555'));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await processManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(result, true);
      assert.ok(spawnStub.calledWith('/path/to/adb', ['connect', '192.168.1.100:5555'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      }));
      assert.strictEqual(processManager.isDeviceConnected(), true);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, true);
      assert.strictEqual(connectionState.deviceIp, '192.168.1.100');
      assert.strictEqual(connectionState.devicePort, '5555');
      assert.strictEqual(connectionState.connectionError, undefined);
    });

    test('should fail to connect with invalid IP address', async () => {
      const result = await processManager.connectDevice('invalid-ip', '5555');

      assert.strictEqual(result, false);
      assert.ok(spawnStub.notCalled);
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError?.includes('Invalid IP address format'));
    });

    test('should fail to connect with invalid port', async () => {
      const result = await processManager.connectDevice('192.168.1.100', '99999');

      assert.strictEqual(result, false);
      assert.ok(spawnStub.notCalled);
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError?.includes('Invalid port number'));
    });

    test('should handle connection refused error', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('failed to connect to 192.168.1.100:5555: Connection refused'));
        mockProcess.emit('close', 1);
      }, 10);

      const result = await processManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(result, false);
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError?.includes('Connection refused'));
    });

    test('should handle timeout error', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('failed to connect to 192.168.1.100:5555: Connection timed out'));
        mockProcess.emit('close', 1);
      }, 10);

      const result = await processManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(result, false);
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError?.includes('Connection timeout'));
    });

    test('should handle already connected scenario', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('already connected to 192.168.1.100:5555'));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await processManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(result, true);
      assert.strictEqual(processManager.isDeviceConnected(), true);
    });
  });

  suite('disconnectDevice', () => {
    setup(async () => {
      // Set up a connected state first
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('connected to 192.168.1.100:5555'));
        mockProcess.emit('close', 0);
      }, 10);

      await processManager.connectDevice('192.168.1.100', '5555');
      spawnStub.resetHistory(); // Clear call history after setup
    });

    test('should successfully disconnect from connected device', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('disconnected 192.168.1.100:5555'));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await processManager.disconnectDevice();

      assert.strictEqual(result, true);
      assert.ok(spawnStub.calledWith('/path/to/adb', ['disconnect', '192.168.1.100:5555'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      }));
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.strictEqual(connectionState.connectionError, undefined);
    });

    test('should handle disconnect when no device is connected', async () => {
      // First disconnect to clear state - need to mock this too
      const firstMockProcess = createMockProcess();
      spawnStub.returns(firstMockProcess);

      setTimeout(() => {
        firstMockProcess.stdout.emit('data', Buffer.from('disconnected 192.168.1.100:5555'));
        firstMockProcess.emit('close', 0);
      }, 10);

      await processManager.disconnectDevice();
      spawnStub.resetHistory();

      // Now test disconnecting when no device is connected
      const result = await processManager.disconnectDevice();

      assert.strictEqual(result, true);
      assert.ok(spawnStub.notCalled);
      assert.strictEqual(processManager.isDeviceConnected(), false);
    });

    test('should handle disconnect command failure', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('error: no such device 192.168.1.100:5555'));
        mockProcess.emit('close', 1);
      }, 10);

      const result = await processManager.disconnectDevice();

      assert.strictEqual(result, false);
      assert.strictEqual(processManager.isDeviceConnected(), false); // Should still update state
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError !== undefined);
    });
  });

  suite('checkDeviceConnectivity', () => {
    test('should detect connected device', async () => {
      // First connect a device
      const connectProcess = createMockProcess();
      spawnStub.returns(connectProcess);

      setTimeout(() => {
        connectProcess.stdout.emit('data', Buffer.from('connected to 192.168.1.100:5555'));
        connectProcess.emit('close', 0);
      }, 10);

      await processManager.connectDevice('192.168.1.100', '5555');
      spawnStub.resetHistory();

      // Mock devices command
      const devicesProcess = createMockProcess();
      spawnStub.returns(devicesProcess);

      setTimeout(() => {
        devicesProcess.stdout.emit('data', Buffer.from(
          'List of devices attached\n192.168.1.100:5555\tdevice\n'
        ));
        devicesProcess.emit('close', 0);
      }, 10);

      const result = await processManager.checkDeviceConnectivity();

      assert.strictEqual(result, true);
      assert.ok(spawnStub.calledWith('/path/to/adb', ['devices'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      }));
      assert.strictEqual(processManager.isDeviceConnected(), true);
    });

    test('should detect disconnected device', async () => {
      // First connect a device
      const connectProcess = createMockProcess();
      spawnStub.returns(connectProcess);

      setTimeout(() => {
        connectProcess.stdout.emit('data', Buffer.from('connected to 192.168.1.100:5555'));
        connectProcess.emit('close', 0);
      }, 10);

      await processManager.connectDevice('192.168.1.100', '5555');
      spawnStub.resetHistory();

      // Mock devices command showing no devices
      const devicesProcess = createMockProcess();
      spawnStub.returns(devicesProcess);

      setTimeout(() => {
        devicesProcess.stdout.emit('data', Buffer.from('List of devices attached\n'));
        devicesProcess.emit('close', 0);
      }, 10);

      const result = await processManager.checkDeviceConnectivity();

      assert.strictEqual(result, false);
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError?.includes('Device no longer connected'));
    });

    test('should handle devices command failure', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('adb: command not found'));
        mockProcess.emit('close', 1);
      }, 10);

      const result = await processManager.checkDeviceConnectivity();

      assert.strictEqual(result, false);
      assert.strictEqual(processManager.isDeviceConnected(), false);
      
      const connectionState = processManager.getConnectionState();
      assert.strictEqual(connectionState.connected, false);
      assert.ok(connectionState.connectionError?.includes('Failed to query ADB devices'));
    });
  });

  suite('getConnectionState', () => {
    test('should return current connection state', () => {
      const state = processManager.getConnectionState();
      
      assert.deepStrictEqual(state, {
        connected: false,
      });
    });

    test('should return connected state after successful connection', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('connected to 192.168.1.100:5555'));
        mockProcess.emit('close', 0);
      }, 10);

      await processManager.connectDevice('192.168.1.100', '5555');
      
      const state = processManager.getConnectionState();
      assert.strictEqual(state.connected, true);
      assert.strictEqual(state.deviceIp, '192.168.1.100');
      assert.strictEqual(state.devicePort, '5555');
      assert.ok(state.lastConnected instanceof Date);
    });
  });

  suite('isDeviceConnected', () => {
    test('should return false initially', () => {
      assert.strictEqual(processManager.isDeviceConnected(), false);
    });

    test('should return true after successful connection', async () => {
      const mockProcess = createMockProcess();
      spawnStub.returns(mockProcess);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('connected to 192.168.1.100:5555'));
        mockProcess.emit('close', 0);
      }, 10);

      await processManager.connectDevice('192.168.1.100', '5555');
      
      assert.strictEqual(processManager.isDeviceConnected(), true);
    });
  });
});

/**
 * Helper function to create a mock ChildProcess
 */
function createMockProcess(): any {
  const mockProcess = {
    stdout: {
      on: sinon.stub(),
      emit: sinon.stub(),
    },
    stderr: {
      on: sinon.stub(),
      emit: sinon.stub(),
    },
    on: sinon.stub(),
    emit: sinon.stub(),
    kill: sinon.stub(),
    killed: false,
    pid: 12345,
  };

  // Setup event emitter behavior
  const events: { [key: string]: Function[] } = {};
  const stdoutEvents: { [key: string]: Function[] } = {};
  const stderrEvents: { [key: string]: Function[] } = {};

  mockProcess.on.callsFake((event: string, callback: Function) => {
    if (!events[event]) {
      events[event] = [];
    }
    events[event].push(callback);
  });

  mockProcess.stdout.on.callsFake((event: string, callback: Function) => {
    if (!stdoutEvents[event]) {
      stdoutEvents[event] = [];
    }
    stdoutEvents[event].push(callback);
  });

  mockProcess.stderr.on.callsFake((event: string, callback: Function) => {
    if (!stderrEvents[event]) {
      stderrEvents[event] = [];
    }
    stderrEvents[event].push(callback);
  });

  mockProcess.emit.callsFake((event: string, ...args: any[]) => {
    if (events[event]) {
      events[event].forEach(callback => callback(...args));
    }
  });

  mockProcess.stdout.emit.callsFake((event: string, ...args: any[]) => {
    if (stdoutEvents[event]) {
      stdoutEvents[event].forEach(callback => callback(...args));
    }
  });

  mockProcess.stderr.emit.callsFake((event: string, ...args: any[]) => {
    if (stderrEvents[event]) {
      stderrEvents[event].forEach(callback => callback(...args));
    }
  });

  return mockProcess;
}