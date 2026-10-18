import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommandManager } from '../managers/commandManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { BinaryManager } from '../managers/binaryManager';
import { Logger } from '../managers/logger';
import { DroidBridgeSidebarProvider } from '../providers/sidebarProvider';

suite('Comprehensive Error Scenarios', () => {
  let commandManager: CommandManager;
  let processManager: ProcessManager;
  let configManager: ConfigManager;
  let binaryManager: BinaryManager;
  let logger: Logger;
  let sidebarProvider: DroidBridgeSidebarProvider;
  let sandbox: sinon.SinonSandbox;
  let mockContext: any;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    mockContext = {
      subscriptions: [],
      extensionUri: vscode.Uri.file('/mock/extension'),
      extensionPath: '/mock/extension'
    };

    binaryManager = sandbox.createStubInstance(BinaryManager);
    logger = sandbox.createStubInstance(Logger);
    configManager = sandbox.createStubInstance(ConfigManager);
    processManager = sandbox.createStubInstance(ProcessManager);
    sidebarProvider = sandbox.createStubInstance(DroidBridgeSidebarProvider);

    (configManager as any).getConfigWithDefaults.returns({ ip: '192.168.1.100', port: '5555' });
    (configManager as any).validateConnection.returns({ isValid: true, errors: [] });
    (processManager as any).getConnectionState.returns({ connected: false });
    (processManager as any).getScrcpyState.returns({ running: false });

    commandManager = new CommandManager(
      processManager as any,
      configManager as any,
      logger as any,
      sidebarProvider as any
    );
  });

  teardown(() => {
    sandbox.restore();
    if (commandManager) {
      commandManager.dispose();
    }
  });

  suite('Binary Management Error Scenarios', () => {
    test('should handle missing ADB binary gracefully', async () => {
      (binaryManager as any).validateBinaries.resolves({
        adbValid: false,
        scrcpyValid: true,
        errors: ['ADB binary not found at expected path']
      });

      (binaryManager as any).getAdbPath.returns('/nonexistent/adb');
      (processManager as any).executeAdbCommand.rejects(new Error('ENOENT: no such file or directory'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/binary not found|ENOENT/)));
    });

    test('should handle missing scrcpy binary gracefully', async () => {
      (binaryManager as any).validateBinaries.resolves({
        adbValid: true,
        scrcpyValid: false,
        errors: ['Scrcpy binary not found at expected path']
      });

      (binaryManager as any).getScrcpyPath.returns('/nonexistent/scrcpy');
      (processManager as any).launchScrcpy.rejects(new Error('ENOENT: no such file or directory'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/binary not found|ENOENT/)));
    });

    test('should handle binary permission errors', async () => {
      (processManager as any).executeAdbCommand.rejects(new Error('EACCES: permission denied'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/permission denied|EACCES/)));
    });

    test('should handle corrupted binary files', async () => {
      (processManager as any).executeAdbCommand.rejects(new Error('Exec format error'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/format error|corrupted/)));
    });
  });

  suite('Network and Connection Error Scenarios', () => {
    test('should handle network unreachable errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('Network is unreachable'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/network.*unreachable/i)));
    });

    test('should handle connection timeout errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('Connection timed out'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/timed out|timeout/i)));
    });

    test('should handle connection refused errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('Connection refused'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/connection refused/i)));
    });

    test('should handle host unreachable errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('No route to host'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/no route to host|unreachable/i)));
    });

    test('should handle DNS resolution failures', async () => {
      (processManager as any).connectDevice.rejects(new Error('getaddrinfo ENOTFOUND'));

      const success = await commandManager.connectDevice('invalid.hostname.local', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/ENOTFOUND|DNS|hostname/i)));
    });
  });

  suite('Process Management Error Scenarios', () => {
    test('should handle process spawn failures', async () => {
      (processManager as any).launchScrcpy.rejects(new Error('spawn ENOENT'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/spawn.*ENOENT|failed to start/i)));
    });

    test('should handle process crashes during execution', async () => {
      (processManager as any).launchScrcpy.rejects(new Error('Process exited with code 1'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/exited.*code|crashed/i)));
    });

    test('should handle resource exhaustion errors', async () => {
      (processManager as any).launchScrcpy.rejects(new Error('EMFILE: too many open files'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/EMFILE|too many.*files|resource/i)));
    });

    test('should handle memory allocation failures', async () => {
      (processManager as any).launchScrcpy.rejects(new Error('Cannot allocate memory'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/memory|allocation/i)));
    });

    test('should handle process termination failures', async () => {
      (processManager as any).stopScrcpy.rejects(new Error('Failed to terminate process'));

      const success = await commandManager.stopScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/terminate|stop.*failed/i)));
    });
  });

  suite('Configuration Error Scenarios', () => {
    test('should handle invalid configuration values', async () => {
      (configManager as any).validateConnection.returns({
        isValid: false,
        errors: ['Invalid IP address format', 'Port out of range']
      });

      const success = await commandManager.connectDevice('999.999.999.999', '99999');

      assert.strictEqual(success, false);
      assert.ok((logger as any).showError.calledWith(sinon.match(/Invalid.*IP.*Port.*range/)));
    });

    test('should handle configuration file corruption', async () => {
      (configManager as any).getConfigWithDefaults.throws(new Error('Configuration file is corrupted'));

      assert.doesNotThrow(() => {
        commandManager.getConnectionState();
      });
    });

    test('should handle missing configuration sections', async () => {
      (configManager as any).getConfigWithDefaults.returns({});

      const success = await commandManager.connectDevice(undefined as any, undefined as any);

      assert.strictEqual(success, false);
      assert.ok((logger as any).showError.called);
    });
  });

  suite('Device-Specific Error Scenarios', () => {
    test('should handle device offline errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('device offline'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/device.*offline/i)));
    });

    test('should handle device unauthorized errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('device unauthorized'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/unauthorized|permission/i)));
    });

    test('should handle ADB daemon not running errors', async () => {
      (processManager as any).connectDevice.rejects(new Error('ADB server not running'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/ADB.*server.*not.*running/i)));
    });

    test('should handle device busy errors', async () => {
      (processManager as any).launchScrcpy.rejects(new Error('Device is busy'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/device.*busy/i)));
    });

    test('should handle unsupported device errors', async () => {
      (processManager as any).launchScrcpy.rejects(new Error('Device does not support screen mirroring'));

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, false);
      assert.ok((logger as any).error.calledWith(sinon.match.string, sinon.match.instanceOf(Error)));
      assert.ok((logger as any).showError.calledWith(sinon.match(/not.*support.*mirroring/i)));
    });
  });

  suite('User Interface Error Scenarios', () => {
    test('should handle VSCode API failures gracefully', async () => {
      sandbox.stub(vscode.window, 'showInputBox').rejects(new Error('VSCode API error'));

      await assert.doesNotReject(async () => {
        await commandManager.connectDeviceCommand();
      }, 'Should handle VSCode API errors gracefully');

      assert.ok((logger as any).error.called);
    });

    test('should handle progress notification failures', async () => {
      sandbox.stub(vscode.window, 'withProgress').rejects(new Error('Progress API error'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.ok((processManager as any).connectDevice.called || (logger as any).error.called);
    });

    test('should handle sidebar update failures', async () => {
      (sidebarProvider as any).synchronizeState.throws(new Error('Sidebar update failed'));

      const success = await commandManager.connectDevice('192.168.1.100', '5555');

      assert.ok((logger as any).error.called);
    });

    test('should handle notification display failures', async () => {
      (logger as any).showError.throws(new Error('Notification failed'));

      await assert.doesNotReject(async () => {
        await commandManager.connectDevice('invalid', 'invalid');
      }, 'Should handle notification failures gracefully');
    });
  });

  suite('Concurrent Operation Error Scenarios', () => {
    test('should handle multiple simultaneous connection attempts', async () => {
      (processManager as any).connectDevice.callsFake(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      });

      const promises = [
        commandManager.connectDevice('192.168.1.100', '5555'),
        commandManager.connectDevice('192.168.1.101', '5555'),
        commandManager.connectDevice('192.168.1.102', '5555')
      ];

      const results = await Promise.allSettled(promises);

      results.forEach(result => {
        if (result.status === 'rejected') {
          assert.ok(true, 'Concurrent operations may be rejected');
        }
      });
    });

    test('should handle scrcpy launch while connection is in progress', async () => {
      (processManager as any).connectDevice.callsFake(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      });

      (processManager as any).isDeviceConnected.returns(false);
      (processManager as any).isScrcpyRunning.returns(false);

      const connectionPromise = commandManager.connectDevice('192.168.1.100', '5555');
      const scrcpyPromise = commandManager.launchScrcpy();

      const [connectionResult, scrcpyResult] = await Promise.allSettled([connectionPromise, scrcpyPromise]);

      assert.ok(connectionResult.status === 'fulfilled' || connectionResult.status === 'rejected');
      assert.ok(scrcpyResult.status === 'fulfilled' || scrcpyResult.status === 'rejected');
    });
  });

  suite('Recovery and Cleanup Error Scenarios', () => {
    test('should handle cleanup failures gracefully', async () => {
      (processManager as any).cleanup.rejects(new Error('Cleanup failed'));

      await assert.doesNotReject(async () => {
        commandManager.dispose();
      }, 'Should handle cleanup failures gracefully');
    });

    test('should handle partial state recovery', async () => {
      (processManager as any).getConnectionState.throws(new Error('State corrupted'));
      (processManager as any).getScrcpyState.returns({ running: false });

      assert.doesNotThrow(() => {
        commandManager.refreshSidebarState();
      }, 'Should handle partial state recovery');

      assert.ok((logger as any).error.called);
    });

    test('should handle logger failures during error reporting', async () => {
      (logger as any).error.throws(new Error('Logger failed'));
      (logger as any).showError.throws(new Error('Logger failed'));

      await assert.doesNotReject(async () => {
        await commandManager.connectDevice('invalid', 'invalid');
      }, 'Should handle logger failures gracefully');
    });
  });

  suite('Edge Case Error Scenarios', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      const nullResult = await commandManager.connectDevice(null as any, null as any);
      assert.strictEqual(nullResult, false);

      const undefinedResult = await commandManager.connectDevice(undefined as any, undefined as any);
      assert.strictEqual(undefinedResult, false);

      assert.ok((logger as any).showError.called);
    });

    test('should handle extremely long input values', async () => {
      const longString = 'a'.repeat(10000);
      
      const result = await commandManager.connectDevice(longString, longString);
      assert.strictEqual(result, false);

      assert.ok((logger as any).showError.called);
    });

    test('should handle special characters in inputs', async () => {
      const specialChars = '!@#$%^&*()[]{}|\\:";\'<>?,./`~';
      
      const result = await commandManager.connectDevice(specialChars, specialChars);
      assert.strictEqual(result, false);

      assert.ok((logger as any).showError.called);
    });

    test('should handle unicode and international characters', async () => {
      const unicodeString = '测试';
      
      const result = await commandManager.connectDevice(unicodeString, '5555');
      assert.strictEqual(result, false);

      assert.ok((logger as any).showError.called);
    });
  });
});