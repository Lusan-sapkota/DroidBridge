import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { DroidBridgeSidebarProvider } from '../providers/sidebarProvider';
import { ConfigManager } from '../managers/configManager';
import { ThemeManager, ThemeKind } from '../utils/themeManager';

suite('Theme Integration Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;
  let mockExtensionUri: vscode.Uri;
  let configManager: ConfigManager;
  let sidebarProvider: DroidBridgeSidebarProvider;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Reset theme manager singleton
    ThemeManager.resetInstance();
    
    // Mock extension context
    mockContext = {
      subscriptions: [],
      extensionPath: '/test/extension',
      globalState: {
        get: sandbox.stub(),
        update: sandbox.stub()
      },
      workspaceState: {
        get: sandbox.stub(),
        update: sandbox.stub()
      }
    } as any;
    
    mockExtensionUri = vscode.Uri.file('/test/extension');
    
    // Mock VSCode configuration
    sandbox.stub(vscode.workspace, 'getConfiguration').returns({
      get: sandbox.stub().callsFake((key: string) => {
        switch (key) {
          case 'defaultIp': return '192.168.1.100';
          case 'defaultPort': return '5555';
          case 'adbPath': return '';
          case 'scrcpyPath': return '';
          default: return undefined;
        }
      }),
      has: sandbox.stub().returns(false),
      inspect: sandbox.stub().returns(undefined),
      update: sandbox.stub().resolves()
    } as any);
    
    sandbox.stub(vscode.workspace, 'onDidChangeConfiguration').returns({
      dispose: sandbox.stub()
    });
    
    configManager = new ConfigManager();
  });

  teardown(() => {
    if (sidebarProvider) {
      sidebarProvider.dispose();
    }
    sandbox.restore();
    ThemeManager.resetInstance();
  });

  test('should initialize with correct theme on creation', () => {
    // Mock VSCode API for light theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    // Verify theme manager is initialized
    const themeManager = ThemeManager.getInstance();
    assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.Light);
    assert.strictEqual(themeManager.isLightTheme(), true);
  });

  test('should update webview when theme changes', (done) => {
    let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
    
    // Mock VSCode API - start with light theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
      onDidChangeCallback = callback;
      return { dispose: () => {} };
    });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    // Mock webview
    const mockWebview = {
      html: '',
      options: {},
      onDidReceiveMessage: sandbox.stub().returns({ dispose: () => {} }),
      postMessage: sandbox.stub(),
      asWebviewUri: sandbox.stub().returns(vscode.Uri.parse('vscode-webview://test'))
    };
    
    const mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidDispose: sandbox.stub().returns({ dispose: () => {} }),
      onDidChangeVisibility: sandbox.stub().returns({ dispose: () => {} })
    } as any;

    // Resolve webview view
    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    // Verify initial HTML contains light theme class
    assert.strictEqual(mockWebview.html.includes('vscode-light'), true);
    
    // Set up expectation for theme change message
    mockWebview.postMessage.callsFake((message) => {
      if (message.type === 'themeChanged') {
        assert.strictEqual(message.theme, ThemeKind.Dark);
        assert.strictEqual(message.isDark, true);
        assert.strictEqual(message.isLight, false);
        assert.strictEqual(message.themeCssClass, 'vscode-dark');
        done();
      }
    });

    // Simulate theme change to dark
    onDidChangeCallback({
      kind: vscode.ColorThemeKind.Dark
    } as vscode.ColorTheme);
  });

  test('should use correct icons for light theme', () => {
    // Mock VSCode API for light theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    // Mock webview
    const mockWebview = {
      html: '',
      options: {},
      onDidReceiveMessage: sandbox.stub().returns({ dispose: () => {} }),
      postMessage: sandbox.stub(),
      asWebviewUri: sandbox.stub().callsFake((uri) => {
        return vscode.Uri.parse(`vscode-webview://${uri.path}`);
      })
    };
    
    const mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidDispose: sandbox.stub().returns({ dispose: () => {} }),
      onDidChangeVisibility: sandbox.stub().returns({ dispose: () => {} })
    } as any;

    // Resolve webview view
    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    // Verify HTML contains light theme icons
    assert.strictEqual(mockWebview.html.includes('light/plug.svg'), true);
    assert.strictEqual(mockWebview.html.includes('light/device-mobile.svg'), true);
    assert.strictEqual(mockWebview.html.includes('vscode-light'), true);
  });

  test('should use correct icons for dark theme', () => {
    // Mock VSCode API for dark theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Dark
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    // Mock webview
    const mockWebview = {
      html: '',
      options: {},
      onDidReceiveMessage: sandbox.stub().returns({ dispose: () => {} }),
      postMessage: sandbox.stub(),
      asWebviewUri: sandbox.stub().callsFake((uri) => {
        return vscode.Uri.parse(`vscode-webview://${uri.path}`);
      })
    };
    
    const mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidDispose: sandbox.stub().returns({ dispose: () => {} }),
      onDidChangeVisibility: sandbox.stub().returns({ dispose: () => {} })
    } as any;

    // Resolve webview view
    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    // Verify HTML contains dark theme icons
    assert.strictEqual(mockWebview.html.includes('dark/plug.svg'), true);
    assert.strictEqual(mockWebview.html.includes('dark/device-mobile.svg'), true);
    assert.strictEqual(mockWebview.html.includes('vscode-dark'), true);
  });

  test('should handle high contrast themes correctly', () => {
    // Mock VSCode API for high contrast theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.HighContrast
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    const themeManager = ThemeManager.getInstance();
    assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.HighContrast);
    assert.strictEqual(themeManager.isDarkTheme(), true);
    assert.strictEqual(themeManager.getThemeCssClass(), 'vscode-high-contrast');
  });

  test('should handle high contrast light themes correctly', () => {
    // Mock VSCode API for high contrast light theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.HighContrastLight
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    const themeManager = ThemeManager.getInstance();
    assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.HighContrastLight);
    assert.strictEqual(themeManager.isLightTheme(), true);
    assert.strictEqual(themeManager.getThemeCssClass(), 'vscode-high-contrast-light');
  });

  test('should dispose theme listeners correctly', () => {
    // Mock VSCode API
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    const mockDisposable = { dispose: sandbox.stub() };
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns(mockDisposable);

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    // Verify disposable was added to context subscriptions
    assert.strictEqual(mockContext.subscriptions.length > 0, true);
    
    // Dispose sidebar provider
    sidebarProvider.dispose();
    
    // Verify theme manager disposable was called
    // Note: We can't directly verify the theme manager's dispose was called
    // because it's a singleton, but we can verify the sidebar's dispose works
    assert.doesNotThrow(() => sidebarProvider.dispose());
  });

  test('should regenerate HTML with new theme on theme change', (done) => {
    let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
    
    // Mock VSCode API - start with light theme
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
      onDidChangeCallback = callback;
      return { dispose: () => {} };
    });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    // Mock webview
    const mockWebview = {
      html: '',
      options: {},
      onDidReceiveMessage: sandbox.stub().returns({ dispose: () => {} }),
      postMessage: sandbox.stub(),
      asWebviewUri: sandbox.stub().callsFake((uri) => {
        return vscode.Uri.parse(`vscode-webview://${uri.path}`);
      })
    };
    
    const mockWebviewView = {
      webview: mockWebview,
      visible: true,
      onDidDispose: sandbox.stub().returns({ dispose: () => {} }),
      onDidChangeVisibility: sandbox.stub().returns({ dispose: () => {} })
    } as any;

    // Resolve webview view
    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    // Store initial HTML
    const initialHtml = mockWebview.html;
    assert.strictEqual(initialHtml.includes('light/'), true);
    assert.strictEqual(initialHtml.includes('vscode-light'), true);
    
    // Set up a way to capture the new HTML
    let htmlUpdated = false;
    Object.defineProperty(mockWebview, 'html', {
      set: function(value) {
        if (!htmlUpdated && value.includes('dark/') && value.includes('vscode-dark')) {
          htmlUpdated = true;
          assert.strictEqual(value.includes('dark/plug.svg'), true);
          assert.strictEqual(value.includes('dark/device-mobile.svg'), true);
          assert.strictEqual(value.includes('vscode-dark'), true);
          done();
        }
      },
      get: function() {
        return initialHtml;
      }
    });

    // Simulate theme change to dark
    onDidChangeCallback({
      kind: vscode.ColorThemeKind.Dark
    } as vscode.ColorTheme);
  });
});