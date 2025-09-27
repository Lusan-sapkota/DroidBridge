import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { Logger, LogLevel } from '../managers/logger';

// Create a mock OutputChannel
const createMockOutputChannel = () => ({
  name: 'DroidBridge Logs',
  appendLine: sinon.stub(),
  append: sinon.stub(),
  clear: sinon.stub(),
  show: sinon.stub(),
  hide: sinon.stub(),
  dispose: sinon.stub(),
  replace: sinon.stub()
});

suite('Logger Test Suite', () => {
  let logger: Logger;
  let mockOutputChannel: any;
  let createOutputChannelStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  let withProgressStub: sinon.SinonStub;

  setup(() => {
    // Create fresh mocks for each test
    mockOutputChannel = createMockOutputChannel();
    
    // Stub VSCode API methods
    createOutputChannelStub = sinon.stub(vscode.window, 'createOutputChannel').returns(mockOutputChannel as any);
    showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
    showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
    showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage');
    withProgressStub = sinon.stub(vscode.window, 'withProgress');
    
    logger = new Logger();
  });

  teardown(() => {
    // Restore all stubs
    sinon.restore();
    logger.dispose();
  });

  suite('Constructor', () => {
    test('should create OutputChannel with correct name', () => {
      assert.strictEqual(createOutputChannelStub.calledOnce, true);
      assert.strictEqual(createOutputChannelStub.calledWith('DroidBridge Logs'), true);
    });
  });

  suite('Log Level Management', () => {
    test('should have default log level of INFO', () => {
      assert.strictEqual(logger.getLogLevel(), LogLevel.INFO);
    });

    test('should allow setting log level', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      assert.strictEqual(logger.getLogLevel(), LogLevel.DEBUG);
      
      logger.setLogLevel(LogLevel.ERROR);
      assert.strictEqual(logger.getLogLevel(), LogLevel.ERROR);
    });
  });

  suite('Debug Logging', () => {
    test('should log debug messages when log level is DEBUG', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug('Test debug message');
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] DEBUG: Test debug message/);
    });

    test('should not log debug messages when log level is INFO', () => {
      logger.setLogLevel(LogLevel.INFO);
      logger.debug('Test debug message');
      
      assert.strictEqual(mockOutputChannel.appendLine.called, false);
    });

    test('should not log debug messages when log level is ERROR', () => {
      logger.setLogLevel(LogLevel.ERROR);
      logger.debug('Test debug message');
      
      assert.strictEqual(mockOutputChannel.appendLine.called, false);
    });
  });

  suite('Info Logging', () => {
    test('should log info messages with timestamp when log level is DEBUG', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      logger.info('Test info message');
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] INFO: Test info message/);
    });

    test('should log info messages with timestamp when log level is INFO', () => {
      logger.setLogLevel(LogLevel.INFO);
      logger.info('Test info message');
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] INFO: Test info message/);
    });

    test('should not log info messages when log level is ERROR', () => {
      logger.setLogLevel(LogLevel.ERROR);
      logger.info('Test info message');
      
      assert.strictEqual(mockOutputChannel.appendLine.called, false);
    });
  });

  suite('Error Logging', () => {
    test('should log error messages with timestamp', () => {
      logger.error('Test error message');
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] ERROR: Test error message/);
    });

    test('should log error messages with Error object details', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      logger.error('Test error message', error);
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] ERROR: Test error message/);
      assert.ok(logMessage.includes('Error Details: Test error'));
      assert.ok(logMessage.includes('Stack Trace:'));
      assert.ok(logMessage.includes('Error: Test error'));
    });

    test('should log error messages with Error object without stack trace', () => {
      const error = new Error('Test error');
      delete error.stack;
      
      logger.error('Test error message', error);
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] ERROR: Test error message/);
      assert.ok(logMessage.includes('Error Details: Test error'));
      assert.ok(!logMessage.includes('Stack Trace:'));
    });

    test('should log error messages at all log levels', () => {
      // Test DEBUG level
      logger.setLogLevel(LogLevel.DEBUG);
      logger.error('Debug level error');
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);

      // Reset and test INFO level
      mockOutputChannel.appendLine.resetHistory();
      logger.setLogLevel(LogLevel.INFO);
      logger.error('Info level error');
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);

      // Reset and test ERROR level
      mockOutputChannel.appendLine.resetHistory();
      logger.setLogLevel(LogLevel.ERROR);
      logger.error('Error level error');
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
    });
  });

  suite('Process Output Logging', () => {
    test('should log process stdout with proper formatting', () => {
      logger.logProcessOutput('adb connect 192.168.1.100:5555', 'connected to 192.168.1.100:5555');
      
      assert.strictEqual(mockOutputChannel.appendLine.callCount, 3); // header, content, blank line
      
      const headerCall = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(headerCall, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] PROCESS STDOUT: adb connect 192\.168\.1\.100:5555/);
      
      const contentCall = mockOutputChannel.appendLine.getCall(1).args[0];
      assert.strictEqual(contentCall, '  connected to 192.168.1.100:5555');
      
      const blankCall = mockOutputChannel.appendLine.getCall(2).args[0];
      assert.strictEqual(blankCall, '');
    });

    test('should log process stderr with proper formatting', () => {
      logger.logProcessOutput('adb connect invalid', 'cannot connect to invalid', true);
      
      assert.strictEqual(mockOutputChannel.appendLine.callCount, 3);
      
      const headerCall = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(headerCall, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] PROCESS STDERR: adb connect invalid/);
      
      const contentCall = mockOutputChannel.appendLine.getCall(1).args[0];
      assert.strictEqual(contentCall, '  cannot connect to invalid');
    });

    test('should handle multiline process output', () => {
      const multilineOutput = 'Line 1\nLine 2\nLine 3';
      logger.logProcessOutput('test command', multilineOutput);
      
      assert.strictEqual(mockOutputChannel.appendLine.callCount, 5); // header + 3 lines + blank
      assert.strictEqual(mockOutputChannel.appendLine.getCall(1).args[0], '  Line 1');
      assert.strictEqual(mockOutputChannel.appendLine.getCall(2).args[0], '  Line 2');
      assert.strictEqual(mockOutputChannel.appendLine.getCall(3).args[0], '  Line 3');
    });

    test('should handle empty process output', () => {
      logger.logProcessOutput('test command', '');
      
      assert.strictEqual(mockOutputChannel.appendLine.callCount, 2); // header + blank line
      
      const headerCall = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(headerCall, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] PROCESS STDOUT: test command/);
      
      const blankCall = mockOutputChannel.appendLine.getCall(1).args[0];
      assert.strictEqual(blankCall, '');
    });
  });

  suite('Progress Notifications', () => {
    test('should show progress notification and log message', async () => {
      const mockProgress = Promise.resolve();
      withProgressStub.returns(mockProgress);
      
      const result = logger.showProgress('Connecting to device...');
      
      assert.strictEqual(withProgressStub.calledOnce, true);
      const progressCall = withProgressStub.getCall(0);
      assert.deepStrictEqual(progressCall.args[0], {
        location: vscode.ProgressLocation.Notification,
        title: 'Connecting to device...',
        cancellable: false
      });
      
      // Check that info message was logged
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] INFO: Progress: Connecting to device\.\.\./);
      
      assert.strictEqual(result, mockProgress);
    });

    test('should show cancellable progress notification', async () => {
      const mockProgress = Promise.resolve();
      withProgressStub.returns(mockProgress);
      
      logger.showProgressWithCancel('Long operation...', true);
      
      assert.strictEqual(withProgressStub.calledOnce, true);
      const progressCall = withProgressStub.getCall(0);
      assert.deepStrictEqual(progressCall.args[0], {
        location: vscode.ProgressLocation.Notification,
        title: 'Long operation...',
        cancellable: true
      });
    });
  });

  suite('Success Notifications', () => {
    test('should show success notification and log message', () => {
      logger.showSuccess('Device connected successfully');
      
      assert.strictEqual(showInformationMessageStub.calledOnce, true);
      assert.strictEqual(showInformationMessageStub.calledWith('Device connected successfully'), true);
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] INFO: SUCCESS: Device connected successfully/);
    });
  });

  suite('Error Notifications', () => {
    test('should show error notification and log message', () => {
      logger.showError('Failed to connect to device');
      
      assert.strictEqual(showErrorMessageStub.calledOnce, true);
      assert.strictEqual(showErrorMessageStub.calledWith('Failed to connect to device'), true);
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] ERROR: USER ERROR: Failed to connect to device/);
    });

    test('should show error notification with Error object', () => {
      const error = new Error('Connection timeout');
      logger.showError('Failed to connect to device', error);
      
      assert.strictEqual(showErrorMessageStub.calledOnce, true);
      assert.strictEqual(showErrorMessageStub.calledWith('Failed to connect to device (Connection timeout)'), true);
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] ERROR: USER ERROR: Failed to connect to device/);
      assert.ok(logMessage.includes('Error Details: Connection timeout'));
    });
  });

  suite('Warning Notifications', () => {
    test('should show warning notification and log message', () => {
      logger.showWarning('Device may be offline');
      
      assert.strictEqual(showWarningMessageStub.calledOnce, true);
      assert.strictEqual(showWarningMessageStub.calledWith('Device may be offline'), true);
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] INFO: WARNING: Device may be offline/);
    });
  });

  suite('Output Channel Management', () => {
    test('should show output channel', () => {
      logger.show();
      assert.strictEqual(mockOutputChannel.show.calledOnce, true);
    });

    test('should clear output channel and log clear message', () => {
      logger.clear();
      assert.strictEqual(mockOutputChannel.clear.calledOnce, true);
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.match(logMessage, /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] INFO: Log cleared/);
    });

    test('should dispose output channel', () => {
      logger.dispose();
      assert.strictEqual(mockOutputChannel.dispose.calledOnce, true);
    });
  });

  suite('Timestamp Formatting', () => {
    test('should format timestamps consistently', () => {
      // Mock Date to ensure consistent timestamp
      const originalDate = Date;
      const mockDate = new Date('2023-12-01T10:30:45.123Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
      
      logger.info('Test message');
      
      assert.strictEqual(mockOutputChannel.appendLine.calledOnce, true);
      const logMessage = mockOutputChannel.appendLine.getCall(0).args[0];
      assert.strictEqual(logMessage, '[2023-12-01 10:30:45.123] INFO: Test message');
      
      // Restore Date
      global.Date = originalDate;
    });
  });
});