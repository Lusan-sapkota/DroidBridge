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
    
    ThemeManager.resetInstance();
    
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
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    const themeManager = ThemeManager.getInstance();
    assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.Light);
    assert.strictEqual(themeManager.isLightTheme(), true);
  });

  test('should update webview when theme changes', (done) => {
    let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
    
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
      onDidChangeCallback = callback;
      return { dispose: () => {} };
    });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
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

    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    assert.strictEqual(mockWebview.html.includes('vscode-light'), true);
    
    mockWebview.postMessage.callsFake((message) => {
      if (message.type === 'themeChanged') {
        assert.strictEqual(message.theme, ThemeKind.Dark);
        assert.strictEqual(message.isDark, true);
        assert.strictEqual(message.isLight, false);
        assert.strictEqual(message.themeCssClass, 'vscode-dark');
        done();
      }
    });

    onDidChangeCallback({
      kind: vscode.ColorThemeKind.Dark
    } as vscode.ColorTheme);
  });

  test('should use correct icons for light theme', () => {
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
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

    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    assert.strictEqual(mockWebview.html.includes('light/plug.svg'), true);
    assert.strictEqual(mockWebview.html.includes('light/device-mobile.svg'), true);
    assert.strictEqual(mockWebview.html.includes('vscode-light'), true);
  });

  test('should use correct icons for dark theme', () => {
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Dark
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
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

    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    assert.strictEqual(mockWebview.html.includes('dark/plug.svg'), true);
    assert.strictEqual(mockWebview.html.includes('dark/device-mobile.svg'), true);
    assert.strictEqual(mockWebview.html.includes('vscode-dark'), true);
  });

  test('should handle high contrast themes correctly', () => {
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
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    const mockDisposable = { dispose: sandbox.stub() };
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns(mockDisposable);

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
    assert.strictEqual(mockContext.subscriptions.length > 0, true);
    
    sidebarProvider.dispose();
    
    assert.doesNotThrow(() => sidebarProvider.dispose());
  });

  test('should regenerate HTML with new theme on theme change', (done) => {
    let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
    
    const mockColorTheme = {
      kind: vscode.ColorThemeKind.Light
    };
    sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
    sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
      onDidChangeCallback = callback;
      return { dispose: () => {} };
    });

    sidebarProvider = new DroidBridgeSidebarProvider(mockExtensionUri, mockContext, configManager);
    
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

    sidebarProvider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    const initialHtml = mockWebview.html;
    assert.strictEqual(initialHtml.includes('light/'), true);
    assert.strictEqual(initialHtml.includes('vscode-light'), true);
    
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

    onDidChangeCallback({
      kind: vscode.ColorThemeKind.Dark
    } as vscode.ColorTheme);
  });
});