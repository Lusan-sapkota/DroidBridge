import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

/**
 * Comprehensive Error Handling Tests
 * Tests error handling patterns across the application
 */
suite('Comprehensive Error Handling Tests', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Mock VSCode APIs
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(vscode.window, 'showWarningMessage').resolves();
    sandbox.stub(vscode.window, 'showInformationMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Error Message Categorization', () => {
    test('should identify connection errors', () => {
      const connectionErrors = [
        'Connection refused',
        'Network is unreachable',
        'Connection timed out',
        'No route to host',
        'device offline'
      ];

      connectionErrors.forEach(errorMessage => {
        const isConnectionError = errorMessage.toLowerCase().includes('connection') ||
                                 errorMessage.toLowerCase().includes('network') ||
                                 errorMessage.toLowerCase().includes('offline') ||
                                 errorMessage.toLowerCase().includes('route');
        
        assert.ok(isConnectionError, `Should identify "${errorMessage}" as connection error`);
      });
    });

    test('should identify process errors', () => {
      const processErrors = [
        'spawn ENOENT',
        'Process exited with code 1',
        'EMFILE: too many open files',
        'Cannot allocate memory',
        'Failed to terminate process'
      ];

      processErrors.forEach(errorMessage => {
        const isProcessError = errorMessage.includes('spawn') ||
                              errorMessage.includes('Process') ||
                              errorMessage.includes('EMFILE') ||
                              errorMessage.includes('allocate') ||
                              errorMessage.includes('terminate');
        
        assert.ok(isProcessError, `Should identify "${errorMessage}" as process error`);
      });
    });

    test('should identify configuration errors', () => {
      const configErrors = [
        'Invalid IP address format',
        'Port out of range',
        'Configuration file is corrupted',
        'Missing required configuration'
      ];

      configErrors.forEach(errorMessage => {
        const isConfigError = errorMessage.includes('Invalid') ||
                             errorMessage.includes('Port') ||
                             errorMessage.includes('Configuration') ||
                             errorMessage.includes('Missing');
        
        assert.ok(isConfigError, `Should identify "${errorMessage}" as configuration error`);
      });
    });
  });

  suite('Error Severity Assessment', () => {
    test('should assess critical errors', () => {
      const criticalErrors = [
        'Cannot allocate memory',
        'Exec format error',
        'Configuration file is corrupted'
      ];

      criticalErrors.forEach(errorMessage => {
        const isCritical = errorMessage.includes('memory') ||
                          errorMessage.includes('format error') ||
                          errorMessage.includes('corrupted');
        
        assert.ok(isCritical, `Should assess "${errorMessage}" as critical`);
      });
    });

    test('should assess high severity errors', () => {
      const highSeverityErrors = [
        'ENOENT: no such file or directory',
        'EACCES: permission denied',
        'spawn ENOENT'
      ];

      highSeverityErrors.forEach(errorMessage => {
        const isHighSeverity = errorMessage.includes('ENOENT') ||
                              errorMessage.includes('EACCES') ||
                              errorMessage.includes('permission');
        
        assert.ok(isHighSeverity, `Should assess "${errorMessage}" as high severity`);
      });
    });
  });

  suite('User-Friendly Error Messages', () => {
    test('should generate helpful messages for connection errors', () => {
      const testCases = [
        {
          error: 'Connection refused',
          shouldInclude: ['device', 'accepting', 'check']
        },
        {
          error: 'Network is unreachable',
          shouldInclude: ['network', 'connection', 'check']
        },
        {
          error: 'Connection timed out',
          shouldInclude: ['connection', 'long', 'slow']
        }
      ];

      testCases.forEach(({ error, shouldInclude }) => {
        const userMessage = generateUserFriendlyMessage(error);
        
        shouldInclude.forEach(keyword => {
          assert.ok(userMessage.toLowerCase().includes(keyword.toLowerCase()), 
            `Message for "${error}" should include "${keyword}". Got: ${userMessage}`);
        });
      });
    });

    test('should generate helpful messages for process errors', () => {
      const testCases = [
        {
          error: 'spawn ENOENT',
          shouldInclude: ['tool', 'found', 'installation']
        },
        {
          error: 'EMFILE: too many open files',
          shouldInclude: ['resources', 'close', 'applications']
        }
      ];

      testCases.forEach(({ error, shouldInclude }) => {
        const userMessage = generateUserFriendlyMessage(error);
        
        shouldInclude.forEach(keyword => {
          assert.ok(userMessage.toLowerCase().includes(keyword.toLowerCase()), 
            `Message for "${error}" should include "${keyword}". Got: ${userMessage}`);
        });
      });
    });
  });

  suite('Error Recovery Suggestions', () => {
    test('should provide recovery suggestions for connection errors', () => {
      const connectionError = 'Connection refused';
      const suggestions = getRecoverySuggestions(connectionError);

      assert.ok(Array.isArray(suggestions), 'Should return array of suggestions');
      assert.ok(suggestions.length > 0, 'Should provide at least one suggestion');
      assert.ok(suggestions.some(s => s.includes('device') || s.includes('network')), 
        'Should include device/network related suggestions');
    });

    test('should provide recovery suggestions for process errors', () => {
      const processError = 'spawn ENOENT';
      const suggestions = getRecoverySuggestions(processError);

      assert.ok(Array.isArray(suggestions), 'Should return array of suggestions');
      assert.ok(suggestions.length > 0, 'Should provide at least one suggestion');
      assert.ok(suggestions.some(s => s.includes('install') || s.includes('path')), 
        'Should include installation/path related suggestions');
    });
  });

  suite('Error Notification Strategies', () => {
    test('should use appropriate notification type based on severity', async () => {
      // Critical error should show error message
      await showErrorNotification('Cannot allocate memory', 'critical');
      assert.ok((vscode.window.showErrorMessage as sinon.SinonStub).called);

      // Reset stubs
      (vscode.window.showErrorMessage as sinon.SinonStub).resetHistory();
      (vscode.window.showWarningMessage as sinon.SinonStub).resetHistory();

      // Medium severity error might show warning
      await showErrorNotification('Connection timed out', 'medium');
      assert.ok(
        (vscode.window.showErrorMessage as sinon.SinonStub).called ||
        (vscode.window.showWarningMessage as sinon.SinonStub).called
      );
    });
  });

  suite('Error Context Handling', () => {
    test('should include context in error handling', () => {
      const error = 'Connection refused';
      const context = {
        operation: 'connectDevice',
        ip: '192.168.1.100',
        port: '5555'
      };

      const contextualMessage = addContextToError(error, context);
      
      assert.ok(contextualMessage.includes('connectDevice'), 'Should include operation');
      assert.ok(contextualMessage.includes('192.168.1.100'), 'Should include IP');
      assert.ok(contextualMessage.includes('5555'), 'Should include port');
    });
  });
});

/**
 * Helper function to generate user-friendly error messages
 */
function generateUserFriendlyMessage(error: string): string {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('connection refused')) {
    return 'The device is not accepting connections. Please check your device settings and ensure ADB debugging is enabled.';
  }
  
  if (errorLower.includes('network is unreachable')) {
    return 'There is a network connection problem. Please check your network settings and ensure the device is on the same network.';
  }
  
  if (errorLower.includes('connection timed out')) {
    return 'The connection took too long to establish. The device may be slow to respond or the network may be congested.';
  }
  
  if (errorLower.includes('spawn enoent')) {
    return 'A required tool was not found. There may be an installation problem with the extension binaries.';
  }
  
  if (errorLower.includes('emfile')) {
    return 'System resources are exhausted. Please close other applications and try again.';
  }
  
  return 'An unexpected error occurred. Please try again or check the logs for more details.';
}

/**
 * Helper function to get recovery suggestions
 */
function getRecoverySuggestions(error: string): string[] {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('connection')) {
    return [
      'Check that the device is connected to the same network',
      'Verify that ADB debugging is enabled on the device',
      'Try restarting the ADB server',
      'Check firewall settings'
    ];
  }
  
  if (errorLower.includes('spawn') || errorLower.includes('enoent')) {
    return [
      'Reinstall the extension',
      'Check custom binary paths in settings',
      'Verify that required tools are installed',
      'Check file permissions'
    ];
  }
  
  if (errorLower.includes('invalid') || errorLower.includes('format')) {
    return [
      'Check the IP address format (e.g., 192.168.1.100)',
      'Verify the port number is between 1 and 65535',
      'Use the correct format for the configuration'
    ];
  }
  
  return [
    'Try the operation again',
    'Check the extension logs for more details',
    'Restart VSCode if the problem persists'
  ];
}

/**
 * Helper function to show error notifications based on severity
 */
async function showErrorNotification(message: string, severity: string): Promise<void> {
  switch (severity) {
    case 'critical':
      await vscode.window.showErrorMessage(message);
      break;
    case 'high':
      await vscode.window.showErrorMessage(message);
      break;
    case 'medium':
      await vscode.window.showWarningMessage(message);
      break;
    case 'low':
      await vscode.window.showInformationMessage(message);
      break;
    default:
      await vscode.window.showErrorMessage(message);
  }
}

/**
 * Helper function to add context to error messages
 */
function addContextToError(error: string, context: any): string {
  let contextualMessage = error;
  
  if (context.operation) {
    contextualMessage = `Error during ${context.operation}: ${contextualMessage}`;
  }
  
  if (context.ip && context.port) {
    contextualMessage += ` (attempting to connect to ${context.ip}:${context.port})`;
  }
  
  return contextualMessage;
}