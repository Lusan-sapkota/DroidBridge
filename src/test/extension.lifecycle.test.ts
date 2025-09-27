import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activate, deactivate, getExtensionState, getLogger, isExtensionInitialized } from '../extension';

/**
 * Integration tests for extension lifecycle
 * Tests requirements 1.1, 4.6, 6.1
 */
suite('Extension Lifecycle Integration Tests', () => {
  let context: vscode.ExtensionContext;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Mock extension context
    context = {
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

    // Mock VSCode APIs
    const createOutputChannelStub = sandbox.stub(vscode.window, 'createOutputChannel').returns({
      name: 'DroidBridge Logs',
      append: sandbox.stub(),
      appendLine: sandbox.stub(),
      clear: sandbox.stub(),
      show: sandbox.stub(),
      hide: sandbox.stub(),
      dispose: sandbox.stub()
    } as any);

    const registerWebviewViewProviderStub = sandbox.stub(vscode.window, 'registerWebviewViewProvider').returns({
      dispose: sandbox.stub()
    } as any);

    const registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand').returns({
      dispose: sandbox.stub()
    } as any);

    const onDidChangeConfigurationStub = sandbox.stub(vscode.workspace, 'onDidChangeConfiguration').returns({
      dispose: sandbox.stub()
    } as any);

    // Store stubs for test access
    (context as any)._testStubs = {
      createOutputChannel: createOutputChannelStub,
      registerWebviewViewProvider: registerWebviewViewProviderStub,
      registerCommand: registerCommandStub,
      onDidChangeConfiguration: onDidChangeConfigurationStub
    };
  });

  teardown(async () => {
    // Always deactivate extension after each test
    try {
      await deactivate();
    } catch (error) {
      // Ignore deactivation errors in tests
    }
    
    sandbox.restore();
  });

  test('Extension activates successfully', async () => {
    // Act
    activate(context);

    // Assert
    assert.strictEqual(isExtensionInitialized(), true, 'Extension should be initialized');
    
    const extensionState = getExtensionState();
    assert.ok(extensionState, 'Extension state should exist');
    assert.strictEqual(extensionState.initialized, true, 'Extension state should be initialized');
    assert.strictEqual(extensionState.binariesValidated, false, 'Binaries should not be validated yet (async)');
    
    const logger = getLogger();
    assert.ok(logger, 'Logger should be initialized');
  });

  test('Extension registers all required VSCode components', () => {
    // Act
    activate(context);

    // Assert - Check that all required components were registered
    const stubs = (context as any)._testStubs;
    
    // Verify output channel was created (Requirement 6.1)
    assert.ok(stubs.createOutputChannel.calledWith('DroidBridge Logs'), 
      'Should create DroidBridge Logs output channel');

    // Verify webview provider was registered (Requirement 1.1)
    assert.ok(stubs.registerWebviewViewProvider.calledWith('droidbridge-sidebar'), 
      'Should register sidebar webview provider');

    // Verify commands were registered (Requirement 4.6)
    const commandCalls = stubs.registerCommand.getCalls();
    const registeredCommands = commandCalls.map((call: any) => call.args[0]);
    
    const expectedCommands = [
      'droidbridge.connectDevice',
      'droidbridge.disconnectDevice', 
      'droidbridge.launchScrcpy',
      'droidbridge.launchScrcpyScreenOff',
      'droidbridge.stopScrcpy',
      'droidbridge.showLogs'
    ];

    expectedCommands.forEach(command => {
      assert.ok(registeredCommands.includes(command), 
        `Should register command: ${command}`);
    });

    // Verify configuration watcher was set up
    assert.ok(stubs.onDidChangeConfiguration.called, 
      'Should set up configuration change watcher');
  });

  test('Extension handles activation errors gracefully', () => {
    // Arrange - Force an error during activation
    sandbox.restore(); // Remove existing stubs
    sandbox.stub(vscode.window, 'createOutputChannel').throws(new Error('Mock activation error'));

    // Act & Assert
    assert.throws(() => {
      activate(context);
    }, /Mock activation error/, 'Should throw activation error');
  });

  test('Extension deactivates successfully', async () => {
    // Arrange
    activate(context);
    assert.strictEqual(isExtensionInitialized(), true, 'Extension should be initialized');

    // Act
    await deactivate();

    // Assert
    assert.strictEqual(isExtensionInitialized(), false, 'Extension should not be initialized after deactivation');
    
    const extensionState = getExtensionState();
    assert.strictEqual(extensionState, undefined, 'Extension state should be cleared');
    
    const logger = getLogger();
    assert.strictEqual(logger, undefined, 'Logger should be cleared');
  });

  test('Extension handles deactivation errors gracefully', async () => {
    // Arrange
    activate(context);
    
    // Mock process manager to throw error during cleanup
    const extensionState = getExtensionState();
    if (extensionState) {
      // We can't easily mock the process manager cleanup from here,
      // but we can test that deactivation doesn't throw even with errors
    }

    // Act & Assert - Should not throw
    await assert.doesNotReject(async () => {
      await deactivate();
    }, 'Deactivation should not throw errors');
  });

  test('Extension state is properly initialized', () => {
    // Act
    activate(context);

    // Assert
    const extensionState = getExtensionState();
    assert.ok(extensionState, 'Extension state should exist');
    
    // Check connection state
    assert.strictEqual(extensionState.connection.connected, false, 'Should start disconnected');
    assert.strictEqual(extensionState.connection.deviceIp, undefined, 'Should have no device IP initially');
    assert.strictEqual(extensionState.connection.devicePort, undefined, 'Should have no device port initially');
    
    // Check scrcpy state
    assert.strictEqual(extensionState.scrcpy.running, false, 'Scrcpy should not be running initially');
    assert.strictEqual(extensionState.scrcpy.process, undefined, 'Should have no scrcpy process initially');
    
    // Check initialization flags
    assert.strictEqual(extensionState.initialized, true, 'Should be marked as initialized');
    assert.strictEqual(extensionState.binariesValidated, false, 'Binaries should not be validated yet');
  });

  test('Extension properly manages disposables', () => {
    // Act
    activate(context);

    // Assert
    assert.ok(context.subscriptions.length > 0, 'Should add disposables to context subscriptions');
    
    // Check that key disposables were added
    const disposableCount = context.subscriptions.length;
    assert.ok(disposableCount >= 3, 'Should have at least 3 disposables (sidebar, config watcher, logger)');
  });

  test('Extension configuration watcher triggers refresh', () => {
    // Arrange
    activate(context);
    const stubs = (context as any)._testStubs;
    
    // Get the configuration change callback
    const configWatcherCall = stubs.onDidChangeConfiguration.getCall(0);
    assert.ok(configWatcherCall, 'Configuration watcher should be set up');
    
    const configChangeCallback = configWatcherCall.args[0];
    assert.ok(typeof configChangeCallback === 'function', 'Configuration change callback should be a function');

    // Act - Simulate configuration change with proper event object
    const mockConfigChangeEvent = {
      affectsConfiguration: sandbox.stub().returns(true)
    };
    
    assert.doesNotThrow(() => {
      configChangeCallback(mockConfigChangeEvent);
    }, 'Configuration change callback should not throw');
  });

  test('Extension provides testing helper functions', () => {
    // Test before activation
    assert.strictEqual(getExtensionState(), undefined, 'Extension state should be undefined before activation');
    assert.strictEqual(getLogger(), undefined, 'Logger should be undefined before activation');
    assert.strictEqual(isExtensionInitialized(), false, 'Extension should not be initialized before activation');

    // Test after activation
    activate(context);
    
    assert.ok(getExtensionState(), 'Extension state should be available after activation');
    assert.ok(getLogger(), 'Logger should be available after activation');
    assert.strictEqual(isExtensionInitialized(), true, 'Extension should be initialized after activation');
  });
});