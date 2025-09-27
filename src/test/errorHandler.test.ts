import * as assert from 'assert';
import * as vscode from 'vscode';
import { ErrorHandler, ErrorCategory, ErrorSeverity, ProgressContext } from '../utils/errorHandler';
import { Logger } from '../managers/logger';

/**
 * Test suite for ErrorHandler class
 * Tests requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
suite('ErrorHandler Tests', () => {
  let errorHandler: ErrorHandler;
  let mockLogger: Logger;
  let loggedMessages: string[] = [];
  let shownNotifications: { type: string; message: string }[] = [];

  setup(() => {
    // Reset test state
    loggedMessages = [];
    shownNotifications = [];

    // Create mock logger
    mockLogger = {
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
      dispose: () => {}
    } as any;

    errorHandler = new ErrorHandler(mockLogger);
  });

  teardown(() => {
    errorHandler.dispose();
  });

  suite('Configuration Error Handling', () => {
    test('should handle invalid IP address configuration error', () => {
      // Requirement 8.4: Handle invalid inputs
      const error = new Error('Invalid IP address format');
      const errorInfo = errorHandler.handleConfigurationError(error, 'defaultIp');

      assert.strictEqual(errorInfo.category, ErrorCategory.CONFIGURATION);
      assert.strictEqual(errorInfo.severity, ErrorSeverity.MEDIUM);
      assert.strictEqual(errorInfo.userMessage, 'Invalid IP address format');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('192.168.1.100')));
      assert.ok(loggedMessages.some(msg => msg.includes('Configuration error')));
      assert.ok(shownNotifications.some(notif => notif.type === 'warning'));
    });

    test('should handle invalid port configuration error', () => {
      // Requirement 8.4: Handle invalid inputs
      const error = new Error('Invalid port number');
      const errorInfo = errorHandler.handleConfigurationError(error, 'defaultPort');

      assert.strictEqual(errorInfo.category, ErrorCategory.CONFIGURATION);
      assert.strictEqual(errorInfo.userMessage, 'Invalid port number');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('1 and 65535')));
    });

    test('should handle binary path configuration error', () => {
      const error = new Error('Binary path not found');
      const errorInfo = errorHandler.handleConfigurationError(error, 'adbPath');

      assert.strictEqual(errorInfo.category, ErrorCategory.BINARY);
      assert.strictEqual(errorInfo.userMessage, 'Binary path configuration error');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('bundled binaries')));
    });
  });

  suite('Connection Error Handling', () => {
    test('should handle connection refused error', () => {
      // Requirement 8.5: Handle offline devices and network issues
      const error = new Error('Connection refused');
      const context = { ip: '192.168.1.100', port: '5555' };
      const errorInfo = errorHandler.handleConnectionError(error, context);

      assert.strictEqual(errorInfo.category, ErrorCategory.CONNECTION);
      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'Device refused connection');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('wireless debugging')));
      assert.ok(loggedMessages.some(msg => msg.includes('Connection failed to 192.168.1.100:5555')));
    });

    test('should handle connection timeout error', () => {
      // Requirement 8.5: Handle offline devices and network issues
      const error = new Error('Connection timeout');
      const errorInfo = errorHandler.handleConnectionError(error);

      assert.strictEqual(errorInfo.severity, ErrorSeverity.MEDIUM);
      assert.strictEqual(errorInfo.userMessage, 'Connection timeout');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('network connectivity')));
    });

    test('should handle device unauthorized error', () => {
      // Requirement 8.5: Handle offline devices and network issues
      const error = new Error('Device unauthorized');
      const errorInfo = errorHandler.handleConnectionError(error);

      assert.strictEqual(errorInfo.severity, ErrorSeverity.MEDIUM);
      assert.strictEqual(errorInfo.userMessage, 'Device authorization required');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('Accept debugging authorization')));
    });

    test('should handle device offline error', () => {
      // Requirement 8.5: Handle offline devices and network issues
      const error = new Error('Device is offline');
      const errorInfo = errorHandler.handleConnectionError(error);

      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'Device is offline');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('Check device connection')));
    });

    test('should handle no route to host error', () => {
      // Requirement 8.5: Handle offline devices and network issues
      const error = new Error('No route to host');
      const errorInfo = errorHandler.handleConnectionError(error);

      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'Device not reachable');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('same network')));
    });
  });

  suite('Process Error Handling', () => {
    test('should handle ADB process error', () => {
      // Requirement 8.6: Handle process failures
      const error = new Error('ADB command failed');
      const errorInfo = errorHandler.handleProcessError(error, 'adb');

      assert.strictEqual(errorInfo.category, ErrorCategory.PROCESS);
      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'ADB command failed');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('ADB is properly installed')));
    });

    test('should handle scrcpy already running error', () => {
      // Requirement 8.6: Handle process failures
      const error = new Error('Scrcpy is already running');
      const errorInfo = errorHandler.handleProcessError(error, 'scrcpy');

      assert.strictEqual(errorInfo.severity, ErrorSeverity.MEDIUM);
      assert.strictEqual(errorInfo.userMessage, 'Screen mirroring already active');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('Stop the current scrcpy instance')));
    });

    test('should handle scrcpy device not found error', () => {
      // Requirement 8.6: Handle process failures
      const error = new Error('Device not found for scrcpy');
      const errorInfo = errorHandler.handleProcessError(error, 'scrcpy');

      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'No device found for screen mirroring');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('Connect to device first')));
    });

    test('should handle generic scrcpy error', () => {
      // Requirement 8.6: Handle process failures
      const error = new Error('Generic scrcpy error');
      const errorInfo = errorHandler.handleProcessError(error, 'scrcpy');

      assert.strictEqual(errorInfo.userMessage, 'Screen mirroring failed');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('scrcpy is properly installed')));
    });
  });

  suite('System Error Handling', () => {
    test('should handle permission denied error', () => {
      const error = new Error('Permission denied');
      const errorInfo = errorHandler.handleSystemError(error);

      assert.strictEqual(errorInfo.category, ErrorCategory.BINARY);
      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'Permission denied');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('file permissions')));
    });

    test('should handle file not found error', () => {
      const error = new Error('ENOENT: file not found');
      const errorInfo = errorHandler.handleSystemError(error);

      assert.strictEqual(errorInfo.category, ErrorCategory.BINARY);
      assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
      assert.strictEqual(errorInfo.userMessage, 'Required file not found');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('Reinstall the extension')));
    });

    test('should handle generic system error', () => {
      const error = new Error('Generic system error');
      const errorInfo = errorHandler.handleSystemError(error, 'test context');

      assert.strictEqual(errorInfo.category, ErrorCategory.SYSTEM);
      assert.strictEqual(errorInfo.severity, ErrorSeverity.CRITICAL);
      assert.strictEqual(errorInfo.userMessage, 'System error occurred');
      assert.ok(errorInfo.suggestedActions.some(action => action.includes('Restart VSCode')));
    });
  });

  suite('Input Validation', () => {
    test('should validate valid IP address', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('192.168.1.100', 'ip', 'IP address');
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.error, undefined);
    });

    test('should validate localhost as valid IP', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('localhost', 'ip', 'IP address');
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.error, undefined);
    });

    test('should reject invalid IP address', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('invalid.ip', 'ip', 'IP address');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error);
      assert.strictEqual(result.error.category, ErrorCategory.VALIDATION);
      assert.ok(result.error.suggestedActions.some(action => action.includes('192.168.1.100')));
    });

    test('should validate valid port number', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('5555', 'port', 'Port number');
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.error, undefined);
    });

    test('should reject invalid port number', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('99999', 'port', 'Port number');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error);
      assert.strictEqual(result.error.category, ErrorCategory.VALIDATION);
      assert.ok(result.error.suggestedActions.some(action => action.includes('1 and 65535')));
    });

    test('should reject empty input', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('', 'ip', 'IP address');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error);
      assert.strictEqual(result.error.category, ErrorCategory.VALIDATION);
    });

    test('should reject whitespace-only input', () => {
      // Requirement 8.4: Handle invalid inputs
      const result = errorHandler.validateAndHandleInput('   ', 'port', 'Port number');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error);
    });
  });

  suite('User Feedback', () => {
    test('should show success notification', () => {
      // Requirement 8.2: Show success notifications with descriptive messages
      errorHandler.showSuccess('Operation completed successfully', 'Additional details');
      
      assert.ok(shownNotifications.some(notif => 
        notif.type === 'success' && 
        notif.message.includes('Operation completed successfully') &&
        notif.message.includes('Additional details')
      ));
    });

    test('should show error notification with actions', () => {
      // Requirement 8.3: Show error notifications with specific error details
      const actions = ['Try again', 'Check settings'];
      errorHandler.showError('Operation failed', actions);
      
      assert.ok(shownNotifications.some(notif => 
        notif.type === 'error' && 
        notif.message.includes('Operation failed')
      ));
      assert.ok(loggedMessages.some(msg => 
        msg.includes('Suggested actions: Try again, Check settings')
      ));
    });

    test('should show warning notification', () => {
      errorHandler.showWarning('This is a warning');
      
      assert.ok(shownNotifications.some(notif => 
        notif.type === 'warning' && 
        notif.message === 'This is a warning'
      ));
    });

    test('should show info notification', () => {
      errorHandler.showInfo('This is information');
      
      assert.ok(loggedMessages.some(msg => msg.includes('This is information')));
    });
  });

  suite('Multiple Error Handling', () => {
    test('should handle multiple errors with categorization', () => {
      const errors = [
        new Error('Connection failed'),
        new Error('Invalid configuration'),
        new Error('Process spawn error')
      ];
      
      const errorInfos = errorHandler.handleMultipleErrors(errors, 'test operation');
      
      assert.strictEqual(errorInfos.length, 3);
      assert.strictEqual(errorInfos[0].category, ErrorCategory.CONNECTION);
      assert.strictEqual(errorInfos[1].category, ErrorCategory.CONFIGURATION);
      assert.strictEqual(errorInfos[2].category, ErrorCategory.SYSTEM);
      
      assert.ok(shownNotifications.some(notif => 
        notif.message.includes('Multiple errors occurred in test operation')
      ));
    });
  });

  suite('Progress Operations', () => {
    test('should handle progress operation completion', async () => {
      // Requirement 8.1: Show appropriate progress indicators
      const progressContext: ProgressContext = {
        title: 'Test Operation',
        cancellable: false,
        location: vscode.ProgressLocation.Notification
      };

      // Mock vscode.window.withProgress
      const originalWithProgress = vscode.window.withProgress;
      let progressTitle = '';
      vscode.window.withProgress = async (options: any, task: any) => {
        progressTitle = options.title;
        const mockProgress = {
          report: (value: any) => {}
        };
        const mockToken = {
          isCancellationRequested: false
        };
        return await task(mockProgress, mockToken);
      };

      try {
        const result = await errorHandler.showProgress(
          async (progress, token) => {
            progress.report({ message: 'Working...' });
            return 'success';
          },
          progressContext,
          'test-operation'
        );

        assert.strictEqual(result, 'success');
        assert.strictEqual(progressTitle, 'Test Operation');
        assert.ok(loggedMessages.some(msg => msg.includes('Starting progress operation: Test Operation')));
        assert.ok(loggedMessages.some(msg => msg.includes('Progress operation completed: Test Operation')));
      } finally {
        vscode.window.withProgress = originalWithProgress;
      }
    });

    test('should handle progress operation cancellation', async () => {
      // Requirement 8.1: Show appropriate progress indicators
      const progressContext: ProgressContext = {
        title: 'Cancellable Operation',
        cancellable: true,
        location: vscode.ProgressLocation.Notification
      };

      // Mock vscode.window.withProgress to simulate cancellation
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
        await assert.rejects(
          errorHandler.showProgress(
            async (progress, token) => {
              if (token.isCancellationRequested) {
                throw new Error('Operation cancelled by user');
              }
              return 'success';
            },
            progressContext,
            'cancellable-operation'
          ),
          /Operation cancelled by user/
        );

        assert.ok(loggedMessages.some(msg => msg.includes('Progress operation cancelled')));
      } finally {
        vscode.window.withProgress = originalWithProgress;
      }
    });

    test('should cancel specific progress operation', () => {
      // Test cancellation functionality
      errorHandler.cancelProgress('test-operation');
      assert.ok(loggedMessages.some(msg => msg.includes('Cancelled progress operation: test-operation')));
    });

    test('should cancel all progress operations', () => {
      // Test cancellation functionality
      errorHandler.cancelAllProgress();
      // This should not throw and should log appropriately
      assert.ok(true); // Basic test that method executes without error
    });
  });

  suite('Error Statistics', () => {
    test('should provide error statistics', () => {
      const stats = errorHandler.getErrorStatistics();
      
      assert.ok(typeof stats === 'object');
      assert.ok(stats.hasOwnProperty(ErrorCategory.CONFIGURATION));
      assert.ok(stats.hasOwnProperty(ErrorCategory.CONNECTION));
      assert.ok(stats.hasOwnProperty(ErrorCategory.PROCESS));
      assert.ok(stats.hasOwnProperty(ErrorCategory.SYSTEM));
      assert.ok(stats.hasOwnProperty(ErrorCategory.VALIDATION));
      assert.ok(stats.hasOwnProperty(ErrorCategory.BINARY));
    });
  });

  suite('Resource Cleanup', () => {
    test('should dispose resources properly', () => {
      // Test that dispose doesn't throw
      errorHandler.dispose();
      assert.ok(true);
    });
  });
});