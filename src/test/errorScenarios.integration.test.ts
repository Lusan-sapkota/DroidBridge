import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommandManager } from '../managers/commandManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { BinaryManager } from '../managers/binaryManager';
import { Logger } from '../managers/logger';

/**
 * Integration tests for error scenarios and user feedback
 * Tests requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
suite('Error Scenarios Integration Tests', () => {
  let commandManager: CommandManager;
  let processManager: ProcessManager;
  let configManager: ConfigManager;
  let binaryManager: BinaryManager;
  let logger: Logger;
  let loggedMessages: string[] = [];
  let shownNotifications: { type: string; message: string }[] = [];

  setup(() => {
    // Reset test state
    loggedMessages = [];
    shownNotifications = [];

    // Create mock logger with notification tracking
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

    // Create mock binary manager
    binaryManager = {
      getAdbPath: () => '/mock/adb',
      getScrcpyPath: () => '/mock/scrcpy',
      validateBinaries: async () => ({ adbValid: true, scrcpyValid: true, errors: [] })
    } as any;

    // Create mock config manager
    configManager = {
      getConfigWithDefaults: () => ({ ip: '192.168.1.100', port: '5555' }),
      validateConnection: (ip: string, port: string) => ({ isValid: true, errors: [] }),
      validateIpAddress: (ip: string) => true,
      validatePort: (port: string) => true
    } as any;

    // Create process manager
    processManager = new ProcessManager(binaryManager, logger);

    // Create command manager
    commandManager = new CommandManager(processManager, configManager, logger, binaryManager);
  });

  teardown(() => {
    commandManager.dispose();
  });

  suite('Connection Error Scenarios', () => {
    test('should handle invalid IP address input gracefully', async () => {
      // Requirement 8.4: Handle invalid inputs
      
      // Mock user input for invalid IP
      const originalShowInputBox = vscode.window.showInputBox;
      let inputPrompts: string[] = [];
      
      vscode.window.showInputBox = async (options: any) => {
        inputPrompts.push(options.prompt);
        
        if (options.prompt.includes('IP address')) {
          // Simulate user entering invalid IP
          const invalidIp = 'invalid.ip.address';
          
          // Test the validation function
          const validationResult = options.validateInput?.(invalidIp);
          assert.ok(validationResult); // Should return error message
          assert.ok(validationResult.includes('valid IP address'));
          
          return undefined; // User cancels after seeing validation error
        }
        
        return undefined;
      };

      try {
        await commandManager.connectDeviceCommand();
        
        // Should have prompted for IP address
        assert.ok(inputPrompts.some(prompt => prompt.includes('IP address')));
        
        // Should have logged cancellation
        assert.ok(loggedMessages.some(msg => msg.includes('cancelled by user')));
        
      } finally {
        vscode.window.showInputBox = originalShowInputBox;
      }
    });

    test('should handle invalid port input gracefully', async () => {
      // Requirement 8.4: Handle invalid inputs
      
      const originalShowInputBox = vscode.window.showInputBox;
      let validationResults: string[] = [];
      
      vscode.window.showInputBox = async (options: any) => {
        if (options.prompt.includes('IP address')) {
          return '192.168.1.100'; // Valid IP
        }
        
        if (options.prompt.includes('port')) {
          // Test various invalid port inputs
          const invalidPorts = ['99999', '0', 'abc', ''];
          
          for (const invalidPort of invalidPorts) {
            const validationResult = options.validateInput?.(invalidPort);
            if (validationResult) {
              validationResults.push(validationResult);
            }
          }
          
          return undefined; // User cancels
        }
        
        return undefined;
      };

      try {
        await commandManager.connectDeviceCommand();
        
        // Should have validation errors for invalid ports
        assert.ok(validationResults.length > 0);
        assert.ok(validationResults.some(result => result.includes('valid port number')));
        
      } finally {
        vscode.window.showInputBox = originalShowInputBox;
      }
    });

    test('should handle connection timeout with appropriate user feedback', async () => {
      // Requirement 8.5: Handle offline devices and network issues
      
      // Mock process manager to simulate timeout
      const originalConnectDevice = processManager.connectDevice;
      processManager.connectDevice = async (ip: string, port: string) => {
        // Simulate connection timeout
        const timeoutError = new Error('Connection timeout');
        throw timeoutError;
      };

      try {
        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, false);
        
        // Should have logged connection error
        assert.ok(loggedMessages.some(msg => msg.includes('Connection failed')));
        
        // Should have shown error notification
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && notif.message.includes('timeout')
        ));
        
      } finally {
        processManager.connectDevice = originalConnectDevice;
      }
    });

    test('should handle device offline scenario', async () => {
      // Requirement 8.5: Handle offline devices and network issues
      
      const originalConnectDevice = processManager.connectDevice;
      processManager.connectDevice = async (ip: string, port: string) => {
        // Simulate device offline
        const offlineError = new Error('Device is offline');
        throw offlineError;
      };

      try {
        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, false);
        
        // Should have appropriate error handling
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && notif.message.includes('offline')
        ));
        
      } finally {
        processManager.connectDevice = originalConnectDevice;
      }
    });
  });

  suite('Process Error Scenarios', () => {
    test('should handle scrcpy already running scenario', async () => {
      // Requirement 8.6: Handle process failures
      
      // Mock scrcpy as already running
      const originalIsScrcpyRunning = processManager.isScrcpyRunning;
      processManager.isScrcpyRunning = () => true;

      try {
        const success = await commandManager.launchScrcpy();
        
        assert.strictEqual(success, false);
        
        // Should have shown warning about duplicate instance
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && notif.message.includes('already')
        ));
        
      } finally {
        processManager.isScrcpyRunning = originalIsScrcpyRunning;
      }
    });

    test('should handle scrcpy launch failure', async () => {
      // Requirement 8.6: Handle process failures
      
      const originalLaunchScrcpy = processManager.launchScrcpy;
      processManager.launchScrcpy = async () => {
        throw new Error('Failed to launch scrcpy - binary not found');
      };

      try {
        const success = await commandManager.launchScrcpy();
        
        assert.strictEqual(success, false);
        
        // Should have logged process error
        assert.ok(loggedMessages.some(msg => msg.includes('Failed to launch scrcpy')));
        
        // Should have shown error notification
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && notif.message.includes('mirroring failed')
        ));
        
      } finally {
        processManager.launchScrcpy = originalLaunchScrcpy;
      }
    });

    test('should handle ADB command failure', async () => {
      // Requirement 8.6: Handle process failures
      
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
        
        // Should have logged ADB command failure
        assert.ok(loggedMessages.some(msg => msg.includes('ADB connect command failed')));
        
      } finally {
        processManager.executeAdbCommand = originalExecuteAdbCommand;
      }
    });
  });

  suite('Progress Indicator Scenarios', () => {
    test('should show progress indicators for long-running operations', async () => {
      // Requirement 8.1: Show appropriate progress indicators
      
      let progressShown = false;
      let progressTitle = '';
      
      // Mock vscode.window.withProgress
      const originalWithProgress = vscode.window.withProgress;
      vscode.window.withProgress = async (options: any, task: any) => {
        progressShown = true;
        progressTitle = options.title;
        
        const mockProgress = {
          report: (value: any) => {
            loggedMessages.push(`PROGRESS: ${JSON.stringify(value)}`);
          }
        };
        const mockToken = {
          isCancellationRequested: false
        };
        
        return await task(mockProgress, mockToken);
      };

      try {
        // Mock successful connection
        const originalConnectDevice = processManager.connectDevice;
        processManager.connectDevice = async (ip: string, port: string) => {
          // Simulate some delay
          await new Promise(resolve => setTimeout(resolve, 10));
          return true;
        };

        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, true);
        assert.strictEqual(progressShown, true);
        assert.ok(progressTitle.includes('Connecting to'));
        
        // Should have progress reports
        assert.ok(loggedMessages.some(msg => msg.includes('PROGRESS:')));
        
        processManager.connectDevice = originalConnectDevice;
        
      } finally {
        vscode.window.withProgress = originalWithProgress;
      }
    });

    test('should handle progress cancellation', async () => {
      // Requirement 8.1: Show appropriate progress indicators
      
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
        
        // Should have logged cancellation
        assert.ok(loggedMessages.some(msg => msg.includes('cancelled by user')));
        
      } finally {
        vscode.window.withProgress = originalWithProgress;
      }
    });
  });

  suite('User Feedback Scenarios', () => {
    test('should provide success feedback for successful operations', async () => {
      // Requirement 8.2: Show success notifications with descriptive messages
      
      // Mock successful connection
      const originalConnectDevice = processManager.connectDevice;
      processManager.connectDevice = async (ip: string, port: string) => true;

      // Mock progress
      const originalWithProgress = vscode.window.withProgress;
      vscode.window.withProgress = async (options: any, task: any) => {
        const mockProgress = { report: (value: any) => {} };
        const mockToken = { isCancellationRequested: false };
        return await task(mockProgress, mockToken);
      };

      try {
        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, true);
        
        // Should have shown success notification
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'success' && 
          notif.message.includes('connected') &&
          notif.message.includes('192.168.1.100:5555')
        ));
        
      } finally {
        processManager.connectDevice = originalConnectDevice;
        vscode.window.withProgress = originalWithProgress;
      }
    });

    test('should provide detailed error feedback for failures', async () => {
      // Requirement 8.3: Show error notifications with specific error details
      
      const originalConnectDevice = processManager.connectDevice;
      processManager.connectDevice = async (ip: string, port: string) => {
        throw new Error('Connection refused - device not reachable');
      };

      try {
        const success = await commandManager.connectDevice('192.168.1.100', '5555');
        
        assert.strictEqual(success, false);
        
        // Should have shown detailed error notification
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error' && 
          notif.message.includes('refused')
        ));
        
        // Should have logged technical details
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
      // Requirement 8.4: Handle edge cases like invalid inputs
      
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async (options: any) => {
        if (options.prompt.includes('IP address')) {
          // Test empty input validation
          const validationResult = options.validateInput?.('');
          assert.ok(validationResult);
          assert.ok(validationResult.includes('cannot be empty'));
          
          return undefined; // User cancels
        }
        return undefined;
      };

      try {
        await commandManager.connectDeviceCommand();
        
        // Should have handled empty input gracefully
        assert.ok(loggedMessages.some(msg => msg.includes('cancelled by user')));
        
      } finally {
        vscode.window.showInputBox = originalShowInputBox;
      }
    });

    test('should handle whitespace-only input', async () => {
      // Requirement 8.4: Handle edge cases like invalid inputs
      
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async (options: any) => {
        if (options.prompt.includes('IP address')) {
          // Test whitespace-only input validation
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
      // Test system error handling
      
      const originalLaunchScrcpy = processManager.launchScrcpy;
      processManager.launchScrcpy = async () => {
        throw new Error('EMFILE: too many open files');
      };

      try {
        const success = await commandManager.launchScrcpy();
        
        assert.strictEqual(success, false);
        
        // Should have handled system error appropriately
        assert.ok(shownNotifications.some(notif => 
          notif.type === 'error'
        ));
        
      } finally {
        processManager.launchScrcpy = originalLaunchScrcpy;
      }
    });
  });

  suite('Command Execution Error Scenarios', () => {
    test('should handle command registration failures gracefully', () => {
      // Test that command registration doesn't throw on errors
      const mockContext = {
        subscriptions: []
      } as any;

      // This should not throw even if there are issues
      assert.doesNotThrow(() => {
        commandManager.registerCommands(mockContext);
      });

      // Should have registered commands
      assert.ok(mockContext.subscriptions.length > 0);
    });

    test('should handle show logs command errors', () => {
      // Test show logs command error handling
      assert.doesNotThrow(() => {
        commandManager.showLogsCommand();
      });

      // Should have logged the command execution
      assert.ok(loggedMessages.some(msg => msg.includes('Show Logs command executed')));
    });
  });
});