import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommandManager } from '../managers/commandManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { BinaryManager } from '../managers/binaryManager';
import { Logger } from '../managers/logger';

suite('Error Scenarios Integration Tests', () => {
  let commandManager: CommandManager;
  let processManager: ProcessManager;
  let configManager: ConfigManager;
  let binaryManager: BinaryManager;
  let logger: Logger;
  let loggedMessages: string[] = [];
  let shownNotifications: { type: string; message: string }[] = [];

  setup(() => {
    loggedMessages = [];
    shownNotifications = [];

    logger = {
      info: (message: string) => loggedMessages.push(`INFO: ${message}`),
      error: (message: string, error?: Error) => {
        loggedMessages.push(`ERROR: ${message}${error ? ` - ${error.message}` : ''}`);
      },
      showSuccess: (message: string) => {
        shownNotifications.push({ type: 'success', message });
      },
      showError: (message: string) => {
        shownNotifications.push({ type: 'error', message });
      },
      showWarning: (message: string) => {
        shownNotifications.push({ type: 'warning', message });
      },
      show: () => {},
      dispose: () => {},
      outputChannel: {
        appendLine: (message: string) => loggedMessages.push(message),
        show: () => {},
        clear: () => {},
        dispose: () => {}
      }
    } as any;

    binaryManager = {
      getAdbPath: () => '/mock/adb',
      getScrcpyPath: () => '/mock/scrcpy',
      validateBinaries: async () => ({ adbValid: true, scrcpyValid: true, errors: [] })
    } as any;

    configManager = {
      getConfigWithDefaults: () => ({ ip: '192.168.1.100', port: '5555' }),
      getScrcpyOptions: () => ({}),
      validateConnection: (ip: string, port: string) => ({ isValid: true, errors: [] }),
      validateIpAddress: (ip: string) => true,
      validatePort: (port: string) => true
    } as any;

    processManager = new ProcessManager(binaryManager, logger);

    commandManager = new CommandManager(processManager, configManager, logger, binaryManager);
  });

  teardown(() => {
    commandManager.dispose();
  });

  suite('Connection Error Scenarios', () => {
    test('should handle device offline scenario', async () => {
      const originalConnectDevice = processManager.connectDevice;
      processManager.connectDevice = async (ip: string, port: string) => {
        const offlineError = new Error('Device is offline');
        throw offlineError;
      };

      try {
        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, false);
        
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && notif.message.includes('offline')
        ));
      } finally {
        processManager.connectDevice = originalConnectDevice;
      }
    });
  });

  suite('Process Error Scenarios', () => {
    test('should handle scrcpy launch failure', async () => {
      const originalLaunchScrcpy = processManager.launchScrcpy;
      processManager.launchScrcpy = async () => {
        throw new Error('Failed to launch scrcpy - binary not found');
      };

      try {
        const success = await commandManager.launchScrcpy();
        
        assert.strictEqual(success, false);
        
        assert.ok(loggedMessages.some(msg => msg.includes('Failed to launch scrcpy')));
        
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && notif.message.includes('mirroring failed')
        ));
      } finally {
        processManager.launchScrcpy = originalLaunchScrcpy;
      }
    });

    test('should handle ADB command failure', async () => {
      const originalExecuteAdbCommand = processManager.executeAdbCommand;
      processManager.executeAdbCommand = async (args: string[]) => {
        return {
          success: false,
          stdout: '',
          stderr: 'ADB server not running',
          exitCode: 1
        };
      };

      try {
        const success = await processManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, false);
        
        assert.ok(loggedMessages.some(msg => msg.includes('ADB connect command failed')));
      } finally {
        processManager.executeAdbCommand = originalExecuteAdbCommand;
      }
    });
  });

  suite('Progress Indicator Scenarios', () => {
    test('should handle progress cancellation', async () => {
      const originalWithProgress = vscode.window.withProgress;
      vscode.window.withProgress = async (options: any, task: any) => {
        const mockProgress = {
          report: (value: any) => {}
        };
        const mockToken = {
          isCancellationRequested: true
        };
        
        return await task(mockProgress, mockToken);
      };

      try {
        await commandManager.connectDeviceCommand('192.168.1.100', '5555');
        
        assert.ok(loggedMessages.some(msg => msg.includes('cancelled by user')));
      } finally {
        vscode.window.withProgress = originalWithProgress;
      }
    });
  });

  suite('User Feedback Scenarios', () => {
    test('should provide detailed error feedback for failures', async () => {
      const originalConnectDevice = processManager.connectDevice;
      processManager.connectDevice = async (ip: string, port: string) => {
        throw new Error('Connection refused - device not reachable');
      };

      try {
        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, false);
        
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && 
          notif.message.includes('refused')
        ));
        
        assert.ok(loggedMessages.some(msg => 
          msg.includes('Connection refused - device not reachable')
        ));
      } finally {
        processManager.connectDevice = originalConnectDevice;
      }
    });
  });

  suite('Edge Case Scenarios', () => {
    test('should handle empty input gracefully', async () => {
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async (options: any) => {
        if (options.prompt.includes('IP address')) {
          const validationResult = options.validateInput?.('');
          assert.ok(validationResult);
          assert.ok(validationResult.includes('cannot be empty'));
          
          return undefined;
        }
        return undefined;
      };

      try {
        await commandManager.connectDeviceCommand();
        
        assert.ok(loggedMessages.some(msg => msg.includes('cancelled by user')));
      } finally {
        vscode.window.showInputBox = originalShowInputBox;
      }
    });

    test('should handle whitespace-only input', async () => {
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async (options: any) => {
        if (options.prompt.includes('IP address')) {
          const validationResult = options.validateInput?.('   ');
          assert.ok(validationResult);
          assert.ok(validationResult.includes('cannot be empty'));
          
          return undefined;
        }
        return undefined;
      };

      try {
        await commandManager.connectDeviceCommand();
        
        assert.ok(loggedMessages.some(msg => msg.includes('cancelled by user')));
      } finally {
        vscode.window.showInputBox = originalShowInputBox;
      }
    });

    test('should handle system resource exhaustion', async () => {
      const originalLaunchScrcpy = processManager.launchScrcpy;
      processManager.launchScrcpy = async () => {
        throw new Error('EMFILE: too many open files');
      };

      try {
        const success = await commandManager.launchScrcpy();
        
        assert.strictEqual(success, false);
        
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error'
        ));
      } finally {
        processManager.launchScrcpy = originalLaunchScrcpy;
      }
    });
  });

  suite('Command Execution Error Scenarios', () => {
    test('should handle show logs command errors', () => {
      assert.doesNotThrow(() => {
        commandManager.showLogsCommand();
      });

      assert.ok(loggedMessages.some(msg => msg.includes('Show Logs command executed')));
    });
  });
});