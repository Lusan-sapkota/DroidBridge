import * as assert from 'assert';
import * as sinon from 'sinon';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { ProcessManager } from '../managers/processManager.js';
import { BinaryManager } from '../managers/binaryManager.js';
import { Logger } from '../managers/logger.js';
import { ProcessResult, ScrcpyOptions } from '../types/index.js';

// Mock child_process module
const mockChildProcess = {
  spawn: sinon.stub()
};

// Mock ChildProcess class
class MockChildProcess extends EventEmitter {
  public killed = false;
  public exitCode: number | null = null;
  public stdout = new EventEmitter();
  public stderr = new EventEmitter();
  
  kill(signal?: string): boolean {
    this.killed = true;
    // Simulate process termination
    setTimeout(() => this.emit('close', 0), 10);
    return true;
  }
}

suite('ProcessManager Tests', () => {
  let processManager: ProcessManager;
  let mockBinaryManager: sinon.SinonStubbedInstance<BinaryManager>;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let spawnStub: sinon.SinonStub;

  setup(() => {
    // Create mocked dependencies
    mockBinaryManager = sinon.createStubInstance(BinaryManager);
    mockLogger = sinon.createStubInstance(Logger);
    
    // Set up default binary paths
    mockBinaryManager.getAdbPath.returns('/path/to/adb');
    mockBinaryManager.getScrcpyPath.returns('/path/to/scrcpy');
    
    // Mock spawn function
    spawnStub = sinon.stub();
    
    // Replace the actual spawn with our mock
    const childProcessModule = require('child_process');
    sinon.stub(childProcessModule, 'spawn').callsFake(spawnStub);
    
    processManager = new ProcessManager(mockBinaryManager, mockLogger);
  });

  teardown(() => {
    sinon.restore();
  });

  suite('executeAdbCommand', () => {
    test('should execute ADB command successfully', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const commandPromise = processManager.executeAdbCommand(['devices']);

      // Simulate successful command output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('List of devices attached\n'));
        mockProcess.stdout.emit('data', Buffer.from('192.168.1.100:5555\tdevice\n'));
        mockProcess.emit('close', 0);
      }, 10);

      const result: ProcessResult = await commandPromise;

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout, 'List of devices attached\n192.168.1.100:5555\tdevice');
      assert.strictEqual(result.stderr, '');
      
      // Verify spawn was called correctly
      assert.ok(spawnStub.calledWith('/path/to/adb', ['devices']));
      
      // Verify logging
      assert.ok(mockLogger.info.calledWith('Executing ADB command: /path/to/adb devices'));
      assert.ok(mockLogger.info.calledWith('ADB command completed with exit code: 0'));
    });

    test('should handle ADB command failure', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const commandPromise = processManager.executeAdbCommand(['connect', '192.168.1.100:5555']);

      // Simulate command failure
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('failed to connect to 192.168.1.100:5555\n'));
        mockProcess.emit('close', 1);
      }, 10);

      const result: ProcessResult = await commandPromise;

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.exitCode, 1);
      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, 'failed to connect to 192.168.1.100:5555');
    });

    test('should handle process spawn error', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const commandPromise = processManager.executeAdbCommand(['devices']);

      // Simulate spawn error
      setTimeout(() => {
        mockProcess.emit('error', new Error('ENOENT: no such file or directory'));
      }, 10);

      const result: ProcessResult = await commandPromise;

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.exitCode, -1);
      assert.strictEqual(result.stderr, 'ENOENT: no such file or directory');
      
      // Verify error logging
      assert.ok(mockLogger.error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
    });

    test('should log process output', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const commandPromise = processManager.executeAdbCommand(['devices']);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('device output\n'));
        mockProcess.stderr.emit('data', Buffer.from('error output\n'));
        mockProcess.emit('close', 0);
      }, 10);

      await commandPromise;

      // Verify process output logging
      assert.ok(mockLogger.logProcessOutput.calledWith('adb', 'device output\n'));
      assert.ok(mockLogger.logProcessOutput.calledWith('adb', 'error output\n'));
    });
  });

  suite('launchScrcpy', () => {
    test('should launch scrcpy successfully', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();

      // Simulate successful scrcpy startup
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);

      const childProcess = await launchPromise;

      assert.ok(childProcess);
      assert.strictEqual(processManager.isScrcpyRunning(), true);
      
      // Verify spawn was called correctly
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', []));
      
      // Verify logging
      assert.ok(mockLogger.info.calledWith('Launching scrcpy: /path/to/scrcpy '));
    });

    test('should launch scrcpy with options', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const options: ScrcpyOptions = {
        bitrate: 8000000,
        maxSize: 1920,
        crop: '1920:1080:0:0',
        recordFile: '/path/to/recording.mp4'
      };

      const launchPromise = processManager.launchScrcpy(options);

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);

      await launchPromise;

      // Verify spawn was called with correct arguments
      const expectedArgs = [
        '--bit-rate', '8000000',
        '--max-size', '1920',
        '--crop', '1920:1080:0:0',
        '--record', '/path/to/recording.mp4'
      ];
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', expectedArgs));
    });

    test('should reject if scrcpy is already running', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      // Start first instance
      const firstLaunch = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await firstLaunch;

      // Try to start second instance
      try {
        await processManager.launchScrcpy();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, 'Scrcpy is already running. Stop the current instance first.');
      }
    });

    test('should handle scrcpy startup error', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();

      // Simulate startup error
      setTimeout(() => {
        mockProcess.emit('error', new Error('Failed to start scrcpy'));
      }, 10);

      try {
        await launchPromise;
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, 'Failed to start scrcpy');
      }

      assert.strictEqual(processManager.isScrcpyRunning(), false);
    });

    test('should timeout if scrcpy fails to start', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();

      // Don't emit any data to simulate timeout
      try {
        await launchPromise;
        assert.fail('Should have thrown a timeout error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, 'Scrcpy failed to start within timeout period');
      }
    }).timeout(6000); // Increase timeout to account for the 5 second internal timeout
  });

  suite('stopScrcpy', () => {
    test('should stop running scrcpy process', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      // Start scrcpy first
      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      assert.strictEqual(processManager.isScrcpyRunning(), true);

      // Stop scrcpy
      const stopResult = await processManager.stopScrcpy();

      assert.strictEqual(stopResult, true);
      assert.strictEqual(processManager.isScrcpyRunning(), false);
      
      // Verify logging
      assert.ok(mockLogger.info.calledWith('Stopping scrcpy process'));
    });

    test('should return true if scrcpy is not running', async () => {
      const stopResult = await processManager.stopScrcpy();
      assert.strictEqual(stopResult, true);
    });

    test('should force kill process if graceful termination fails', async () => {
      const mockProcess = new MockChildProcess();
      // Override kill method to not emit close event immediately
      mockProcess.kill = sinon.stub().returns(true);
      spawnStub.returns(mockProcess);

      // Start scrcpy first
      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      // Stop scrcpy (should timeout and force kill)
      const stopPromise = processManager.stopScrcpy();
      
      // Simulate timeout by not emitting close event
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 3100); // After the 3 second timeout

      const stopResult = await stopPromise;
      assert.strictEqual(stopResult, true);
    }).timeout(4000); // Increase timeout to account for the 3 second internal timeout
  });

  suite('isScrcpyRunning', () => {
    test('should return false when no scrcpy process exists', () => {
      assert.strictEqual(processManager.isScrcpyRunning(), false);
    });

    test('should return true when scrcpy process is running', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      assert.strictEqual(processManager.isScrcpyRunning(), true);
    });

    test('should return false when scrcpy process is killed', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      mockProcess.killed = true;
      assert.strictEqual(processManager.isScrcpyRunning(), false);
    });
  });

  suite('cleanup', () => {
    test('should clean up all managed processes', async () => {
      const mockProcess1 = new MockChildProcess();
      const mockProcess2 = new MockChildProcess();
      
      spawnStub.onFirstCall().returns(mockProcess1);
      spawnStub.onSecondCall().returns(mockProcess2);

      // Start scrcpy
      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess1.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      // Execute ADB command
      const adbPromise = processManager.executeAdbCommand(['devices']);
      setTimeout(() => {
        mockProcess2.stdout.emit('data', Buffer.from('devices\n'));
        mockProcess2.emit('close', 0);
      }, 10);
      await adbPromise;

      // Cleanup
      await processManager.cleanup();

      assert.strictEqual(processManager.isScrcpyRunning(), false);
      
      // Verify logging
      assert.ok(mockLogger.info.calledWith('Cleaning up all managed processes'));
      assert.ok(mockLogger.info.calledWith('Process cleanup completed'));
    });

    test('should handle cleanup when no processes are running', async () => {
      await processManager.cleanup();
      
      // Should complete without errors
      assert.ok(mockLogger.info.calledWith('Cleaning up all managed processes'));
      assert.ok(mockLogger.info.calledWith('Process cleanup completed'));
    });
  });

  suite('getScrcpyState', () => {
    test('should return initial state when scrcpy is not running', () => {
      const state = processManager.getScrcpyState();
      assert.strictEqual(state.running, false);
      assert.strictEqual(state.process, undefined);
      assert.strictEqual(state.startTime, undefined);
      assert.strictEqual(state.options, undefined);
    });

    test('should return running state when scrcpy is active', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const options: ScrcpyOptions = { bitrate: 8000000 };
      const launchPromise = processManager.launchScrcpy(options);
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      const state = processManager.getScrcpyState();
      assert.strictEqual(state.running, true);
      assert.ok(state.process);
      assert.ok(state.startTime);
      assert.deepStrictEqual(state.options, options);
    });

    test('should update state when scrcpy stops', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      // Stop scrcpy
      await processManager.stopScrcpy();

      const state = processManager.getScrcpyState();
      assert.strictEqual(state.running, false);
      assert.strictEqual(state.process, undefined);
    });
  });

  suite('getScrcpyUptime', () => {
    test('should return null when scrcpy is not running', () => {
      const uptime = processManager.getScrcpyUptime();
      assert.strictEqual(uptime, null);
    });

    test('should return uptime when scrcpy is running', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      // Wait a bit to get some uptime
      await new Promise(resolve => setTimeout(resolve, 50));

      const uptime = processManager.getScrcpyUptime();
      assert.ok(uptime !== null);
      assert.ok(uptime >= 40); // Should be at least 40ms
    });

    test('should return null after scrcpy stops', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      await processManager.stopScrcpy();

      const uptime = processManager.getScrcpyUptime();
      assert.strictEqual(uptime, null);
    });
  });

  suite('monitorScrcpyProcess', () => {
    test('should detect process termination', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      assert.strictEqual(processManager.isScrcpyRunning(), true);

      // Simulate process termination
      mockProcess.killed = true;
      mockProcess.exitCode = 0;

      // Monitor should detect the termination
      processManager.monitorScrcpyProcess();

      assert.strictEqual(processManager.isScrcpyRunning(), false);
      const state = processManager.getScrcpyState();
      assert.strictEqual(state.running, false);
    });

    test('should handle monitoring when no process exists', () => {
      // Should not throw error
      processManager.monitorScrcpyProcess();
      assert.strictEqual(processManager.isScrcpyRunning(), false);
    });
  });

  suite('launchScrcpyScreenOff', () => {
    test('should launch scrcpy with screen off option', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpyScreenOff();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      // Verify spawn was called with screen off argument
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', ['--turn-screen-off']));
      assert.strictEqual(processManager.isScrcpyRunning(), true);
    });

    test('should launch scrcpy with screen off and additional options', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const options: ScrcpyOptions = {
        bitrate: 4000000,
        maxSize: 1080
      };

      const launchPromise = processManager.launchScrcpyScreenOff(options);
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      const expectedArgs = [
        '--bit-rate', '4000000',
        '--max-size', '1080',
        '--turn-screen-off'
      ];
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', expectedArgs));
    });

    test('should reject if scrcpy is already running', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      // Start first instance
      const firstLaunch = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await firstLaunch;

      // Try to start screen off instance
      try {
        await processManager.launchScrcpyScreenOff();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, 'Scrcpy is already running. Stop the current instance first.');
      }
    });
  });

  suite('buildScrcpyArgs', () => {
    test('should build empty args when no options provided', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const launchPromise = processManager.launchScrcpy();
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      // Verify spawn was called with empty args
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', []));
    });

    test('should build args with all options', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const options: ScrcpyOptions = {
        bitrate: 4000000,
        maxSize: 1080,
        crop: '1080:1920:0:0',
        recordFile: '/tmp/recording.mp4'
      };

      const launchPromise = processManager.launchScrcpy(options);
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      const expectedArgs = [
        '--bit-rate', '4000000',
        '--max-size', '1080',
        '--crop', '1080:1920:0:0',
        '--record', '/tmp/recording.mp4'
      ];
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', expectedArgs));
    });

    test('should build args with partial options', async () => {
      const mockProcess = new MockChildProcess();
      spawnStub.returns(mockProcess);

      const options: ScrcpyOptions = {
        bitrate: 2000000,
        maxSize: 720
      };

      const launchPromise = processManager.launchScrcpy(options);
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('scrcpy started\n'));
      }, 10);
      await launchPromise;

      const expectedArgs = [
        '--bit-rate', '2000000',
        '--max-size', '720'
      ];
      assert.ok(spawnStub.calledWith('/path/to/scrcpy', expectedArgs));
    });
  });
});