import * as assert from 'assert';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../utils/errorHandler';
import { Logger } from '../managers/logger';

/**
 * Unit tests for ErrorHandler class - simplified version for testing core functionality
 */
suite('ErrorHandler Unit Tests', () => {
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

  test('should handle configuration errors correctly', () => {
    const error = new Error('Invalid IP address format');
    const errorInfo = errorHandler.handleConfigurationError(error, 'defaultIp');

    assert.strictEqual(errorInfo.category, ErrorCategory.CONFIGURATION);
    assert.strictEqual(errorInfo.severity, ErrorSeverity.MEDIUM);
    assert.strictEqual(errorInfo.userMessage, 'Invalid IP address format');
    assert.ok(errorInfo.suggestedActions.length > 0);
    assert.ok(loggedMessages.some(msg => msg.includes('Configuration error')));
  });

  test('should handle connection errors correctly', () => {
    const error = new Error('Connection refused');
    const context = { ip: '192.168.1.100', port: '5555' };
    const errorInfo = errorHandler.handleConnectionError(error, context);

    assert.strictEqual(errorInfo.category, ErrorCategory.CONNECTION);
    assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
    assert.strictEqual(errorInfo.userMessage, 'Device refused connection');
    assert.ok(errorInfo.suggestedActions.length > 0);
    assert.ok(loggedMessages.some(msg => msg.includes('Connection failed to 192.168.1.100:5555')));
  });

  test('should handle process errors correctly', () => {
    const error = new Error('ADB command failed');
    const errorInfo = errorHandler.handleProcessError(error, 'adb');

    assert.strictEqual(errorInfo.category, ErrorCategory.PROCESS);
    assert.strictEqual(errorInfo.severity, ErrorSeverity.HIGH);
    assert.strictEqual(errorInfo.userMessage, 'ADB command failed');
    assert.ok(errorInfo.suggestedActions.length > 0);
  });

  test('should validate IP addresses correctly', () => {
    // Valid IP
    let result = errorHandler.validateAndHandleInput('192.168.1.100', 'ip', 'IP address');
    assert.strictEqual(result.isValid, true);

    // Valid localhost
    result = errorHandler.validateAndHandleInput('localhost', 'ip', 'IP address');
    assert.strictEqual(result.isValid, true);

    // Invalid IP
    result = errorHandler.validateAndHandleInput('invalid.ip', 'ip', 'IP address');
    assert.strictEqual(result.isValid, false);
    assert.ok(result.error);
    assert.strictEqual(result.error.category, ErrorCategory.VALIDATION);
  });

  test('should validate port numbers correctly', () => {
    // Valid port
    let result = errorHandler.validateAndHandleInput('5555', 'port', 'Port number');
    assert.strictEqual(result.isValid, true);

    // Invalid port (too high)
    result = errorHandler.validateAndHandleInput('99999', 'port', 'Port number');
    assert.strictEqual(result.isValid, false);
    assert.ok(result.error);

    // Invalid port (non-numeric)
    result = errorHandler.validateAndHandleInput('abc', 'port', 'Port number');
    assert.strictEqual(result.isValid, false);
    assert.ok(result.error);
  });

  test('should show success notifications', () => {
    errorHandler.showSuccess('Operation completed successfully');
    
    assert.ok(shownNotifications.some(notif => 
      notif.type === 'success' && 
      notif.message.includes('Operation completed successfully')
    ));
  });

  test('should show error notifications', () => {
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

  test('should handle multiple errors', () => {
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
  });

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