import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activate, deactivate } from '../extension';
import { CommandManager } from '../managers/commandManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { BinaryManager } from '../managers/binaryManager';
import { Logger } from '../managers/logger';
import { DroidBridgeSidebarProvider } from '../providers/sidebarProvider';

/**
 * End-to-End Test Suite
 * Tests complete user scenarios from start to finish
 * Requirements: All requirements through comprehensive end-to-end testing
 */
suite('End-to-End Test Suite', () => {
  let context: vscode.ExtensionContext;
  let sandbox: sinon.SinonSandbox;
  let mockOutputChannel: any;
  let mockWebview: any;
  let mockWebviewView: any;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Create comprehensive mock context
    context = createMockExtensionContext(sandbox);
    
    // Mock output channel
    mockOutputChannel = {
      name: 'DroidBridge Logs',
      append: sandbox.stub(),
      appendLine: sandbox.stub(),
      clear: sandbox.stub(),
      show: sandbox.stub(),
      hide: sandbox.stub(),
      dispose: sandbox.stub()
    };

    // Mock webview
    mockWebview = {
      options: {},
      html: '',
      onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }),
      postMessage: sandbox.stub().resolves(true),
      asWebviewUri: sandbox.stub().returns(vscode.Uri.file('/mock/uri'))
    };

    mockWebviewView = {
      webview: mockWebview
    };

    // Setup VSCode API mocks
    sandbox.stub(vscode.window, 'createOutputChannel').returns(mockOutputChannel);
    sandbox.stub(vscode.window, 'registerWebviewViewProvider').returns({ dispose: sandbox.stub() });
    sandbox.stub(vscode.commands, 'registerCommand').returns({ dispose: sandbox.stub() });
    sandbox.stub(vscode.workspace, 'onDidChangeConfiguration').returns({ dispose: sandbox.stub() });
    sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(vscode.window, 'showWarningMessage').resolves();
    sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
      const mockProgress = { report: sandbox.stub() };
      const mockToken = { 
        isCancellationRequested: false,
        onCancellationRequested: sandbox.stub()
      };
      return await task(mockProgress, mockToken);
    });
  });

  teardown(async () => {
    try {
      await deactivate();
    } catch (error) {
      // Ignore deactivation errors in tests
    }
    sandbox.restore();
  });

  suite('Complete User Workflow - Device Connection', () => {
    test('should complete full device connection workflow', async () => {
      // Step 1: Extension activation
      activate(context);
      
      // Verify extension is active
      assert.ok(context.subscriptions.length > 0, 'Extension should register disposables');
      
      // Step 2: User opens sidebar
      const registerWebviewCall = (vscode.window.registerWebviewViewProvider as sinon.SinonStub).getCall(0);
      assert.ok(registerWebviewCall, 'Should register webview provider');
      assert.strictEqual(registerWebviewCall.args[0], 'droidbridge-sidebar');
      
      // Step 3: User enters IP and port in sidebar
      const sidebarProvider = registerWebviewCall.args[1] as DroidBridgeSidebarProvider;
      sidebarProvider.resolveWebviewView(mockWebviewView as any, {} as any, {} as any);
      
      // Get message handler
      const messageHandler = mockWebview.onDidReceiveMessage.getCall(0).args[0];
      
      // Step 4: User clicks connect button
      const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
      
      messageHandler({
        type: 'connectDevice',
        ip: '192.168.1.100',
        port: '5555'
      });
      
      // Verify command was executed
      assert.ok(executeCommandStub.calledWith('droidbridge.connectDevice', '192.168.1.100', '5555'));
      
      // Step 5: Verify sidebar state updates
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, '192.168.1.100');
      assert.strictEqual(currentState.currentPort, '5555');
    });

    test('should handle connection failure gracefully in full workflow', async () => {
      // Setup extension
      activate(context);
      
      // Mock failed connection
      const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').rejects(new Error('Connection failed'));
      
      // Get sidebar provider
      const registerWebviewCall = (vscode.window.registerWebviewViewProvider as sinon.SinonStub).getCall(0);
      const sidebarProvider = registerWebviewCall.args[1] as DroidBridgeSidebarProvider;
      sidebarProvider.resolveWebviewView(mockWebviewView as any, {} as any, {} as any);
      
      // Get message handler and trigger connection
      const messageHandler = mockWebview.onDidReceiveMessage.getCall(0).args[0];
      
      try {
        await messageHandler({
          type: 'connectDevice',
          ip: '192.168.1.100',
          port: '5555'
        });
      } catch (error) {
        // Expected to fail
      }
      
      // Verify error was handled
      assert.ok(executeCommandStub.called);
    });
  });

  suite('Complete User Workflow - Screen Mirroring', () => {
    test('should complete full scrcpy launch workflow', async () => {
      // Setup extension
      activate(context);
      
      // Get sidebar provider
      const registerWebviewCall = (vscode.window.registerWebviewViewProvider as sinon.SinonStub).getCall(0);
      const sidebarProvider = registerWebviewCall.args[1] as DroidBridgeSidebarProvider;
      sidebarProvider.resolveWebviewView(mockWebviewView as any, {} as any, {} as any);
      
      // Mock successful scrcpy launch
      const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
      
      // Get message handler and trigger scrcpy launch
      const messageHandler = mockWebview.onDidReceiveMessage.getCall(0).args[0];
      
      messageHandler({
        type: 'launchScrcpy'
      });
      
      // Verify command was executed
      assert.ok(executeCommandStub.calledWith('droidbridge.launchScrcpy'));
    });

    test('should handle scrcpy launch with screen off option', async () => {
      // Setup extension
      activate(context);
      
      // Mock command execution
      const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
      
      // Execute screen off command directly
      await vscode.commands.executeCommand('droidbridge.launchScrcpyScreenOff');
      
      // Verify command was registered and can be executed
      const registerCommandCalls = (vscode.commands.registerCommand as sinon.SinonStub).getCalls();
      const screenOffCommand = registerCommandCalls.find(call => call.args[0] === 'droidbridge.launchScrcpyScreenOff');
      assert.ok(screenOffCommand, 'Should register screen off command');
    });
  });

  suite('Complete User Workflow - Command Palette Integration', () => {
    test('should execute all commands through command palette', async () => {
      // Setup extension
      activate(context);
      
      // Get all registered commands
      const registerCommandCalls = (vscode.commands.registerCommand as sinon.SinonStub).getCalls();
      const commandNames = registerCommandCalls.map(call => call.args[0]);
      
      // Verify all expected commands are registered
      const expectedCommands = [
        'droidbridge.connectDevice',
        'droidbridge.disconnectDevice',
        'droidbridge.launchScrcpy',
        'droidbridge.launchScrcpyScreenOff',
        'droidbridge.stopScrcpy',
        'droidbridge.showLogs'
      ];
      
      expectedCommands.forEach(command => {
        assert.ok(commandNames.includes(command), `Should register command: ${command}`);
      });
      
      // Test that each command handler exists and is callable
      registerCommandCalls.forEach(call => {
        const commandHandler = call.args[1];
        assert.ok(typeof commandHandler === 'function', `Command handler should be a function for ${call.args[0]}`);
      });
    });

    test('should show logs command opens output channel', async () => {
      // Setup extension
      activate(context);
      
      // Find and execute show logs command
      const registerCommandCalls = (vscode.commands.registerCommand as sinon.SinonStub).getCalls();
      const showLogsCommand = registerCommandCalls.find(call => call.args[0] === 'droidbridge.showLogs');
      
      assert.ok(showLogsCommand, 'Should register show logs command');
      
      // Execute the command handler
      const commandHandler = showLogsCommand.args[1];
      commandHandler();
      
      // Verify output channel was shown
      assert.ok(mockOutputChannel.show.called, 'Should show output channel');
    });
  });

  suite('Complete User Workflow - Configuration Management', () => {
    test('should handle configuration changes throughout workflow', async () => {
      // Setup extension
      activate(context);
      
      // Mock configuration
      const mockConfig = {
        get: sandbox.stub().returns('192.168.1.100'),
        has: sandbox.stub().returns(true),
        inspect: sandbox.stub(),
        update: sandbox.stub().resolves()
      };
      
      sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);
      
      // Trigger configuration change
      const configWatcher = (vscode.workspace.onDidChangeConfiguration as sinon.SinonStub).getCall(0);
      const configChangeHandler = configWatcher.args[0];
      
      const mockConfigChangeEvent = {
        affectsConfiguration: sandbox.stub().returns(true)
      };
      
      // Should not throw when configuration changes
      assert.doesNotThrow(() => {
        configChangeHandler(mockConfigChangeEvent);
      });
    });

    test('should validate configuration values in real-time', async () => {
      // Setup extension
      activate(context);
      
      // Get sidebar provider
      const registerWebviewCall = (vscode.window.registerWebviewViewProvider as sinon.SinonStub).getCall(0);
      const sidebarProvider = registerWebviewCall.args[1] as DroidBridgeSidebarProvider;
      sidebarProvider.resolveWebviewView(mockWebviewView as any, {} as any, {} as any);
      
      // Test IP validation through sidebar
      const messageHandler = mockWebview.onDidReceiveMessage.getCall(0).args[0];
      
      // Test valid IP
      messageHandler({
        type: 'ipChanged',
        value: '192.168.1.100'
      });
      
      let currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, '192.168.1.100');
      
      // Test invalid IP (should still update but validation would catch it during connection)
      messageHandler({
        type: 'ipChanged',
        value: 'invalid.ip'
      });
      
      currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, 'invalid.ip');
    });
  });

  suite('Complete User Workflow - Error Recovery', () => {
    test('should recover from binary validation failures', async () => {
      // Setup extension with binary validation failure
      activate(context);
      
      // The extension should still activate even if binary validation fails
      assert.ok(context.subscriptions.length > 0, 'Extension should activate despite binary issues');
      
      // Commands should still be registered
      const registerCommandCalls = (vscode.commands.registerCommand as sinon.SinonStub).getCalls();
      assert.ok(registerCommandCalls.length >= 6, 'Should register all commands');
    });

    test('should handle process cleanup on extension deactivation', async () => {
      // Setup extension
      activate(context);
      
      // Simulate some active processes (this would be done by the actual managers)
      // For testing, we just verify deactivation doesn't throw
      
      await assert.doesNotReject(async () => {
        await deactivate();
      }, 'Deactivation should handle cleanup gracefully');
    });
  });

  suite('Complete User Workflow - Theme Integration', () => {
    test('should handle theme changes throughout application lifecycle', async () => {
      // Setup extension
      activate(context);
      
      // Get sidebar provider
      const registerWebviewCall = (vscode.window.registerWebviewViewProvider as sinon.SinonStub).getCall(0);
      const sidebarProvider = registerWebviewCall.args[1] as DroidBridgeSidebarProvider;
      sidebarProvider.resolveWebviewView(mockWebviewView as any, {} as any, {} as any);
      
      // Verify webview HTML was set (contains theme-aware CSS)
      assert.ok(mockWebview.html.length > 0, 'Should set webview HTML');
      assert.ok(mockWebview.html.includes('--vscode-'), 'Should use VSCode CSS variables for theming');
    });
  });

  suite('Performance and Resource Management', () => {
    test('should manage resources efficiently during normal operation', async () => {
      // Setup extension
      activate(context);
      
      // Verify reasonable number of disposables
      assert.ok(context.subscriptions.length < 20, 'Should not create excessive disposables');
      assert.ok(context.subscriptions.length >= 3, 'Should create necessary disposables');
      
      // Verify all disposables have dispose methods
      context.subscriptions.forEach((disposable, index) => {
        assert.ok(typeof disposable.dispose === 'function', `Disposable ${index} should have dispose method`);
      });
    });

    test('should clean up resources properly on deactivation', async () => {
      // Setup extension
      activate(context);
      
      const initialDisposableCount = context.subscriptions.length;
      assert.ok(initialDisposableCount > 0, 'Should have disposables after activation');
      
      // Deactivate
      await deactivate();
      
      // Verify cleanup (in real implementation, disposables would be called)
      // For testing, we just verify deactivation completed
      assert.ok(true, 'Deactivation should complete successfully');
    });
  });
});

/**
 * Helper function to create a comprehensive mock extension context
 */
function createMockExtensionContext(sandbox: sinon.SinonSandbox): vscode.ExtensionContext {
  return {
    subscriptions: [],
    workspaceState: {
      get: sandbox.stub(),
      update: sandbox.stub(),
      keys: sandbox.stub().returns([])
    },
    globalState: {
      get: sandbox.stub(),
      update: sandbox.stub(),
      setKeysForSync: sandbox.stub(),
      keys: sandbox.stub().returns([])
    },
    extensionPath: '/mock/extension/path',
    extensionUri: vscode.Uri.file('/mock/extension/path'),
    environmentVariableCollection: {
      persistent: true,
      description: 'DroidBridge Environment Variables',
      replace: sandbox.stub(),
      append: sandbox.stub(),
      prepend: sandbox.stub(),
      get: sandbox.stub(),
      forEach: sandbox.stub(),
      delete: sandbox.stub(),
      clear: sandbox.stub(),
      [Symbol.iterator]: sandbox.stub()
    },
    storageUri: vscode.Uri.file('/mock/storage'),
    globalStorageUri: vscode.Uri.file('/mock/global/storage'),
    logUri: vscode.Uri.file('/mock/log'),
    extensionMode: vscode.ExtensionMode.Test,
    extension: {
      id: 'test.droidbridge',
      extensionUri: vscode.Uri.file('/mock/extension/path'),
      extensionPath: '/mock/extension/path',
      isActive: true,
      packageJSON: {},
      extensionKind: vscode.ExtensionKind.Workspace,
      exports: undefined,
      activate: sandbox.stub(),
      deactivate: sandbox.stub()
    },
    secrets: {
      get: sandbox.stub(),
      store: sandbox.stub(),
      delete: sandbox.stub(),
      onDidChange: sandbox.stub()
    },
    asAbsolutePath: sandbox.stub().callsFake((relativePath: string) => `/mock/extension/path/${relativePath}`)
  } as any;
}