import * as assert from "assert";
import * as vscode from "vscode";
import { DroidBridgeSidebarProvider } from "../providers/sidebarProvider";

suite("DroidBridgeSidebarProvider Test Suite", () => {
  let provider: DroidBridgeSidebarProvider;
  let mockContext: vscode.ExtensionContext;
  let mockUri: vscode.Uri;

  setup(() => {
    mockUri = vscode.Uri.file("/test/path");
    mockContext = {
      subscriptions: [],
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        keys: () => [],
      },
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        setKeysForSync: () => {},
        keys: () => [],
      },
      extensionUri: mockUri,
      extensionPath: "/test/path",
      asAbsolutePath: (relativePath: string) => `/test/path/${relativePath}`,
      environmentVariableCollection: {} as any,
      storageUri: mockUri,
      storagePath: "/test/storage",
      globalStorageUri: mockUri,
      globalStoragePath: "/test/global",
      logUri: mockUri,
      logPath: "/test/log",
      extensionMode: vscode.ExtensionMode.Test,
      extension: {} as any,
      secrets: {} as any,
      languageModelAccessInformation: {} as any,
    };
    const mockConfigManager = {
      getConfigWithDefaults: () => ({ ip: '192.168.1.100', port: '5555' }),
      onConfigurationChanged: () => ({ dispose: () => {} })
    };
    provider = new DroidBridgeSidebarProvider(mockUri, mockContext, mockConfigManager as any);
  });

  suite("WebviewViewProvider Implementation", () => {
    test("should have correct viewType", () => {
      assert.strictEqual(
        DroidBridgeSidebarProvider.viewType,
        "droidbridge-sidebar"
      );
    });

    test("should initialize with default values", () => {
      assert.strictEqual(provider.getConnectionStatus(), false);
      assert.strictEqual(provider.getScrcpyStatus(), false);
      assert.strictEqual(typeof provider.getCurrentIp(), "string");
      assert.strictEqual(typeof provider.getCurrentPort(), "string");
    });
  });

  suite("Status Management", () => {
    test("should update connection status", () => {
      provider.updateConnectionStatus(true, "192.168.1.100", "5555");
      assert.strictEqual(provider.getConnectionStatus(), true);
      assert.strictEqual(provider.getCurrentIp(), "192.168.1.100");
      assert.strictEqual(provider.getCurrentPort(), "5555");
    });

    test("should update scrcpy status", () => {
      provider.updateScrcpyStatus(true);
      assert.strictEqual(provider.getScrcpyStatus(), true);
    });

    test("should update IP address", () => {
      provider.updateIpAddress("10.0.0.1");
      assert.strictEqual(provider.getCurrentIp(), "10.0.0.1");
    });

    test("should update port", () => {
      provider.updatePort("8080");
      assert.strictEqual(provider.getCurrentPort(), "8080");
    });

    test("should reset all status", () => {
      provider.updateConnectionStatus(true, "192.168.1.100", "5555");
      provider.updateScrcpyStatus(true);

      provider.reset();

      assert.strictEqual(provider.getConnectionStatus(), false);
      assert.strictEqual(provider.getScrcpyStatus(), false);
      assert.strictEqual(provider.getCurrentIp(), "192.168.1.100");
      assert.strictEqual(provider.getCurrentPort(), "5555");
    });
  });

  suite("State Transitions", () => {
    test("should handle connection state changes", () => {
      assert.strictEqual(provider.getConnectionStatus(), false);

      provider.updateConnectionStatus(true, "192.168.1.100", "5555");
      assert.strictEqual(provider.getConnectionStatus(), true);

      provider.updateConnectionStatus(false);
      assert.strictEqual(provider.getConnectionStatus(), false);
    });

    test("should handle scrcpy state changes", () => {
      assert.strictEqual(provider.getScrcpyStatus(), false);

      provider.updateScrcpyStatus(true);
      assert.strictEqual(provider.getScrcpyStatus(), true);

      provider.updateScrcpyStatus(false);
      assert.strictEqual(provider.getScrcpyStatus(), false);
    });
  });

  suite("Input Validation", () => {
    test("should handle empty IP and port values", () => {
      provider.updateIpAddress("");
      provider.updatePort("");

      assert.strictEqual(provider.getCurrentIp(), "");
      assert.strictEqual(provider.getCurrentPort(), "");
    });

    test("should handle whitespace in inputs", () => {
      provider.updateIpAddress("  192.168.1.100  ");
      provider.updatePort("  5555  ");

      assert.strictEqual(provider.getCurrentIp(), "  192.168.1.100  ");
      assert.strictEqual(provider.getCurrentPort(), "  5555  ");
    });
  });
});
