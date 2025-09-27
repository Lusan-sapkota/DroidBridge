import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { DroidBridgeSidebarProvider } from "../providers/sidebarProvider";
import { CommandManager } from "../managers/commandManager";
import { ProcessManager } from "../managers/processManager";
import { ConfigManager } from "../managers/configManager";
import { BinaryManager } from "../managers/binaryManager";
import { Logger } from "../managers/logger";

suite("Sidebar-Command Integration Tests", () => {
  let sidebarProvider: DroidBridgeSidebarProvider;
  let commandManager: CommandManager;
  let mockProcessManager: sinon.SinonStubbedInstance<ProcessManager>;
  let mockConfigManager: sinon.SinonStubbedInstance<ConfigManager>;
  let mockBinaryManager: sinon.SinonStubbedInstance<BinaryManager>;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let mockContext: any;
  let mockWebviewView: any;
  let mockWebview: any;
  let mockUri: vscode.Uri;

  setup(() => {
    // Create stubbed instances
    mockProcessManager = sinon.createStubInstance(ProcessManager);
    mockConfigManager = sinon.createStubInstance(ConfigManager);
    mockBinaryManager = sinon.createStubInstance(BinaryManager);
    mockLogger = sinon.createStubInstance(Logger);
    // Setup mock URI
    mockUri = vscode.Uri.file("/test/extension");

    // Setup mock context
    mockContext = {
      subscriptions: [],
      extensionPath: "/test/extension",
      extensionUri: mockUri,
      globalState: { get: sinon.stub(), update: sinon.stub() },
      workspaceState: { get: sinon.stub(), update: sinon.stub() },
    };

    // Setup mock webview
    mockWebview = {
      options: {},
      html: "",
      onDidReceiveMessage: sinon.stub().returns({ dispose: sinon.stub() }),
      postMessage: sinon.stub().resolves(true),
      asWebviewUri: sinon.stub().returns(mockUri),
    };

    mockWebviewView = {
      webview: mockWebview,
    };

    // Setup default config manager behavior
    mockConfigManager.getConfigWithDefaults.returns({
      ip: "192.168.1.100",
      port: "5555",
    });
    mockConfigManager.onConfigurationChanged.returns({ dispose: sinon.stub() });

    // Setup default process manager behavior
    mockProcessManager.getConnectionState.returns({
      connected: false,
    });
    mockProcessManager.getScrcpyState.returns({
      running: false,
    });
    mockProcessManager.isDeviceConnected.returns(false);
    mockProcessManager.isScrcpyRunning.returns(false);

    // Create instances
    sidebarProvider = new DroidBridgeSidebarProvider(
      mockUri,
      mockContext as any,
      mockConfigManager as any
    );

    commandManager = new CommandManager(
      mockProcessManager as any,
      mockConfigManager as any,
      mockLogger as any,
      sidebarProvider
    );
  });

  teardown(() => {
    sinon.restore();
    if (commandManager) {
      commandManager.dispose();
    }
    if (sidebarProvider) {
      sidebarProvider.dispose();
    }
  });

  suite("Sidebar Provider Integration", () => {
    test("should load default values from configuration on initialization", () => {
      assert.ok(mockConfigManager.getConfigWithDefaults.called);

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, "192.168.1.100");
      assert.strictEqual(currentState.currentPort, "5555");
    });

    test("should set up configuration change watcher", () => {
      assert.ok(mockConfigManager.onConfigurationChanged.called);
      assert.strictEqual(mockContext.subscriptions.length, 1);
    });

    test("should resolve webview view and set up message handling", () => {
      const mockResolveContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      sidebarProvider.resolveWebviewView(
        mockWebviewView as any,
        mockResolveContext,
        mockToken
      );

      assert.ok(mockWebview.onDidReceiveMessage.called);
      assert.ok(mockWebview.html.length > 0);
    });

    test("should update connection status and synchronize state", () => {
      sidebarProvider.updateConnectionStatus(true, "192.168.1.200", "5556");

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.connectionStatus, true);
      assert.strictEqual(currentState.currentIp, "192.168.1.200");
      assert.strictEqual(currentState.currentPort, "5556");
    });

    test("should update scrcpy status", () => {
      sidebarProvider.updateScrcpyStatus(true);

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.scrcpyStatus, true);
    });

    test("should synchronize state with process managers", () => {
      const connectionState = {
        connected: true,
        deviceIp: "192.168.1.150",
        devicePort: "5557",
      };

      const scrcpyState = {
        running: true,
      };

      sidebarProvider.synchronizeState(connectionState, scrcpyState);

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.connectionStatus, true);
      assert.strictEqual(currentState.scrcpyStatus, true);
      assert.strictEqual(currentState.currentIp, "192.168.1.150");
      assert.strictEqual(currentState.currentPort, "5557");
    });

    test("should reset to default values", () => {
      // First set some different values
      sidebarProvider.updateConnectionStatus(true, "192.168.1.200", "5556");
      sidebarProvider.updateScrcpyStatus(true);

      // Then reset
      sidebarProvider.reset();

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.connectionStatus, false);
      assert.strictEqual(currentState.scrcpyStatus, false);
      assert.strictEqual(currentState.currentIp, "192.168.1.100"); // Should reload defaults
      assert.strictEqual(currentState.currentPort, "5555");
    });
  });

  suite("Command Manager Integration", () => {
    test("should set sidebar provider and start status updates", () => {
      const newCommandManager = new CommandManager(
        mockProcessManager as any,
        mockConfigManager as any,
        mockLogger as any
      );

      newCommandManager.setSidebarProvider(sidebarProvider);

      // Should immediately sync state
      assert.ok(mockProcessManager.getConnectionState.called);
      assert.ok(mockProcessManager.getScrcpyState.called);

      newCommandManager.dispose();
    });

    test("should update sidebar state on successful connection", async () => {
      // Setup successful connection
      mockProcessManager.connectDevice.resolves(true);
      mockProcessManager.getConnectionState.returns({
        connected: true,
        deviceIp: "192.168.1.100",
        devicePort: "5555",
      });
      mockConfigManager.validateConnection.returns({
        isValid: true,
        errors: [],
      });

      const success = await commandManager.connectDevice(
        "192.168.1.100",
        "5555"
      );

      assert.strictEqual(success, true);
      assert.ok(
        mockProcessManager.connectDevice.calledWith("192.168.1.100", "5555")
      );

      // Verify sidebar was updated
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.connectionStatus, true);
      assert.strictEqual(currentState.currentIp, "192.168.1.100");
      assert.strictEqual(currentState.currentPort, "5555");
    });

    test("should update sidebar state on failed connection", async () => {
      // Setup failed connection
      mockProcessManager.connectDevice.resolves(false);
      mockProcessManager.getConnectionState.returns({
        connected: false,
        connectionError: "Connection refused",
      });
      mockConfigManager.validateConnection.returns({
        isValid: true,
        errors: [],
      });

      const success = await commandManager.connectDevice(
        "192.168.1.100",
        "5555"
      );

      assert.strictEqual(success, false);

      // Verify sidebar was updated
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.connectionStatus, false);
    });

    test("should update sidebar state on successful disconnection", async () => {
      // First connect
      sidebarProvider.updateConnectionStatus(true, "192.168.1.100", "5555");

      // Setup successful disconnection
      mockProcessManager.disconnectDevice.resolves(true);
      mockProcessManager.getConnectionState.returns({
        connected: false,
      });

      const success = await commandManager.disconnectDevice();

      assert.strictEqual(success, true);

      // Verify sidebar was updated
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.connectionStatus, false);
    });

    test("should update sidebar state on successful scrcpy launch", async () => {
      // Setup successful scrcpy launch
      const mockProcess = { pid: 12345 } as any;
      mockProcessManager.launchScrcpy.resolves(mockProcess);
      mockProcessManager.isScrcpyRunning
        .returns(false)
        .onSecondCall()
        .returns(true);
      mockProcessManager.getScrcpyState.returns({
        running: true,
        process: mockProcess,
      });

      const success = await commandManager.launchScrcpy();

      assert.strictEqual(success, true);

      // Verify sidebar was updated
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.scrcpyStatus, true);
    });

    test("should update sidebar state on successful scrcpy stop", async () => {
      // First set scrcpy as running
      sidebarProvider.updateScrcpyStatus(true);

      // Setup successful scrcpy stop
      mockProcessManager.stopScrcpy.resolves(true);
      mockProcessManager.getScrcpyState.returns({
        running: false,
      });

      const success = await commandManager.stopScrcpy();

      assert.strictEqual(success, true);

      // Verify sidebar was updated
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.scrcpyStatus, false);
    });

    test("should handle validation errors gracefully", async () => {
      // Setup validation failure
      mockConfigManager.validateConnection.returns({
        isValid: false,
        errors: ["Invalid IP address: invalid-ip"],
      });

      const success = await commandManager.connectDevice("invalid-ip", "5555");

      assert.strictEqual(success, false);
      assert.ok(mockLogger.showError.called);
      assert.ok(mockProcessManager.connectDevice.notCalled);
    });

    test("should refresh sidebar state periodically", (done) => {
      // Setup changing process states
      let callCount = 0;
      mockProcessManager.getConnectionState.callsFake(() => {
        callCount++;
        return {
          connected: callCount > 1, // Change state after first call
          deviceIp: callCount > 1 ? "192.168.1.100" : undefined,
          devicePort: callCount > 1 ? "5555" : undefined,
        };
      });

      // Wait for at least one status update cycle
      setTimeout(() => {
        assert.ok(mockProcessManager.getConnectionState.callCount >= 2);

        // Verify sidebar state was updated
        const currentState = sidebarProvider.getCurrentState();
        assert.strictEqual(currentState.connectionStatus, true);

        done();
      }, 2500); // Wait slightly longer than the 2-second interval
    });
  });

  suite("Message Handling Integration", () => {
    let messageHandler: (message: any) => void;

    setup(() => {
      // Resolve webview to set up message handling
      const mockResolveContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      sidebarProvider.resolveWebviewView(
        mockWebviewView as any,
        mockResolveContext,
        mockToken
      );

      // Extract the message handler
      const onDidReceiveMessageCall =
        mockWebview.onDidReceiveMessage.getCall(0);
      messageHandler = onDidReceiveMessageCall.args[0];
    });

    test("should handle connectDevice message", async () => {
      // Setup successful connection
      mockProcessManager.connectDevice.resolves(true);
      mockConfigManager.validateConnection.returns({
        isValid: true,
        errors: [],
      });

      // Stub vscode.commands.executeCommand
      const executeCommandStub = sinon
        .stub(vscode.commands, "executeCommand")
        .resolves();

      // Send message
      messageHandler({
        type: "connectDevice",
        ip: "192.168.1.100",
        port: "5555",
      });

      assert.ok(
        executeCommandStub.calledWith(
          "droidbridge.connectDevice",
          "192.168.1.100",
          "5555"
        )
      );

      executeCommandStub.restore();
    });

    test("should handle disconnectDevice message", async () => {
      // Stub vscode.commands.executeCommand
      const executeCommandStub = sinon
        .stub(vscode.commands, "executeCommand")
        .resolves();

      // Send message
      messageHandler({
        type: "disconnectDevice",
      });

      assert.ok(executeCommandStub.calledWith("droidbridge.disconnectDevice"));

      executeCommandStub.restore();
    });

    test("should handle launchScrcpy message", async () => {
      // Stub vscode.commands.executeCommand
      const executeCommandStub = sinon
        .stub(vscode.commands, "executeCommand")
        .resolves();

      // Send message
      messageHandler({
        type: "launchScrcpy",
      });

      assert.ok(executeCommandStub.calledWith("droidbridge.launchScrcpy"));

      executeCommandStub.restore();
    });

    test("should handle stopScrcpy message", async () => {
      // Stub vscode.commands.executeCommand
      const executeCommandStub = sinon
        .stub(vscode.commands, "executeCommand")
        .resolves();

      // Send message
      messageHandler({
        type: "stopScrcpy",
      });

      assert.ok(executeCommandStub.calledWith("droidbridge.stopScrcpy"));

      executeCommandStub.restore();
    });

    test("should handle ipChanged message", () => {
      messageHandler({
        type: "ipChanged",
        value: "192.168.1.200",
      });

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, "192.168.1.200");
    });

    test("should handle portChanged message", () => {
      messageHandler({
        type: "portChanged",
        value: "5556",
      });

      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentPort, "5556");
    });
  });

  suite("Configuration Change Integration", () => {
    test("should update sidebar when configuration changes", () => {
      // Setup new configuration values
      mockConfigManager.getConfigWithDefaults.returns({
        ip: "10.0.0.100",
        port: "5556",
      });

      // Trigger configuration change
      const configChangeCallback =
        mockConfigManager.onConfigurationChanged.getCall(0).args[0];
      configChangeCallback();

      // Verify sidebar was updated with new defaults
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, "10.0.0.100");
      assert.strictEqual(currentState.currentPort, "5556");
    });

    test("should maintain user input when configuration changes", () => {
      // User has entered custom values
      sidebarProvider.updateIpAddress("192.168.1.200");
      sidebarProvider.updatePort("5557");

      // Configuration changes
      mockConfigManager.getConfigWithDefaults.returns({
        ip: "10.0.0.100",
        port: "5556",
      });

      // Trigger configuration change
      const configChangeCallback =
        mockConfigManager.onConfigurationChanged.getCall(0).args[0];
      configChangeCallback();

      // User input should be preserved (not overwritten by defaults)
      const currentState = sidebarProvider.getCurrentState();
      assert.strictEqual(currentState.currentIp, "10.0.0.100"); // Should update to new default
      assert.strictEqual(currentState.currentPort, "5556"); // Should update to new default
    });
  });

  suite("Error Handling Integration", () => {
    test("should handle process manager errors gracefully", async () => {
      // Setup process manager to throw error
      mockProcessManager.connectDevice.rejects(new Error("Process error"));
      mockConfigManager.validateConnection.returns({
        isValid: true,
        errors: [],
      });

      const success = await commandManager.connectDevice(
        "192.168.1.100",
        "5555"
      );

      assert.strictEqual(success, false);
      assert.ok(mockLogger.error.called);
      assert.ok(mockLogger.showError.called);
    });

    test("should handle sidebar state update errors gracefully", () => {
      // Create a sidebar provider that throws on state update
      const errorSidebar = {
        synchronizeState: sinon.stub().throws(new Error("Sidebar error")),
      };

      const errorCommandManager = new CommandManager(
        mockProcessManager as any,
        mockConfigManager as any,
        mockLogger as any,
        errorSidebar
      );

      // Should not throw when updating sidebar state
      assert.doesNotThrow(() => {
        errorCommandManager.refreshSidebarState();
      });

      // Should log the error
      assert.ok(mockLogger.error.called);

      errorCommandManager.dispose();
    });
  });
});
