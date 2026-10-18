import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ThemeManager, ThemeKind } from '../utils/themeManager';

suite('ThemeManager Tests', () => {
  let sandbox: sinon.SinonSandbox;
  let mockExtensionUri: vscode.Uri;

  setup(() => {
    sandbox = sinon.createSandbox();
    mockExtensionUri = vscode.Uri.file('/test/extension');
    
    ThemeManager.resetInstance();
  });

  teardown(() => {
    sandbox.restore();
    ThemeManager.resetInstance();
  });

  suite('Theme Detection', () => {
    test('should detect light theme correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.Light);
      assert.strictEqual(themeManager.isLightTheme(), true);
      assert.strictEqual(themeManager.isDarkTheme(), false);
    });

    test('should detect dark theme correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Dark
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.Dark);
      assert.strictEqual(themeManager.isLightTheme(), false);
      assert.strictEqual(themeManager.isDarkTheme(), true);
    });

    test('should detect high contrast theme correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.HighContrast
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.HighContrast);
      assert.strictEqual(themeManager.isLightTheme(), false);
      assert.strictEqual(themeManager.isDarkTheme(), true);
    });

    test('should detect high contrast light theme correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.HighContrastLight
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.HighContrastLight);
      assert.strictEqual(themeManager.isLightTheme(), true);
      assert.strictEqual(themeManager.isDarkTheme(), false);
    });
  });

  suite('Theme Change Listeners', () => {
    test('should register and call theme change listeners', (done) => {
      let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
      
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
        onDidChangeCallback = callback;
        return { dispose: () => {} };
      });

      const themeManager = ThemeManager.getInstance();
      
      const disposable = themeManager.onThemeChanged((theme) => {
        assert.strictEqual(theme, ThemeKind.Dark);
        disposable.dispose();
        done();
      });

      onDidChangeCallback({
        kind: vscode.ColorThemeKind.Dark
      } as vscode.ColorTheme);
    });

    test('should not call listeners if theme does not change', () => {
      let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
      let listenerCalled = false;
      
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
        onDidChangeCallback = callback;
        return { dispose: () => {} };
      });

      const themeManager = ThemeManager.getInstance();
      
      const disposable = themeManager.onThemeChanged(() => {
        listenerCalled = true;
      });

      onDidChangeCallback({
        kind: vscode.ColorThemeKind.Light
      } as vscode.ColorTheme);

      assert.strictEqual(listenerCalled, false);
      disposable.dispose();
    });

    test('should handle listener errors gracefully', () => {
      let onDidChangeCallback: (theme: vscode.ColorTheme) => void = () => {};
      
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').callsFake((callback) => {
        onDidChangeCallback = callback;
        return { dispose: () => {} };
      });

      const themeManager = ThemeManager.getInstance();
      
      const disposable1 = themeManager.onThemeChanged(() => {
        throw new Error('Test error');
      });

      let secondListenerCalled = false;
      const disposable2 = themeManager.onThemeChanged(() => {
        secondListenerCalled = true;
      });

      assert.doesNotThrow(() => {
        onDidChangeCallback({
          kind: vscode.ColorThemeKind.Dark
        } as vscode.ColorTheme);
      });

      assert.strictEqual(secondListenerCalled, true);
      
      disposable1.dispose();
      disposable2.dispose();
    });
  });

  suite('Icon Path Resolution', () => {
    test('should return correct light theme icon path', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      const iconPath = themeManager.getThemeSpecificIcon('device-mobile', mockExtensionUri);
      
      assert.strictEqual(iconPath.path.includes('light/device-mobile.svg'), true);
    });

    test('should return correct dark theme icon path', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Dark
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      const iconPath = themeManager.getThemeSpecificIcon('plug', mockExtensionUri);
      
      assert.strictEqual(iconPath.path.includes('dark/plug.svg'), true);
    });

    test('should return webview icon URI correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const mockWebview = {
        asWebviewUri: sandbox.stub().returns(vscode.Uri.parse('vscode-webview://test'))
      } as any;

      const themeManager = ThemeManager.getInstance();
      const iconUri = themeManager.getWebviewIconUri('device-mobile', mockExtensionUri, mockWebview);
      
      assert.strictEqual(mockWebview.asWebviewUri.calledOnce, true);
      assert.strictEqual(iconUri.toString(), 'vscode-webview://test');
    });
  });

  suite('CSS Class Generation', () => {
    test('should return correct CSS class for light theme', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getThemeCssClass(), 'vscode-light');
    });

    test('should return correct CSS class for dark theme', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Dark
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getThemeCssClass(), 'vscode-dark');
    });

    test('should return correct CSS class for high contrast theme', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.HighContrast
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getThemeCssClass(), 'vscode-high-contrast');
    });

    test('should return correct CSS class for high contrast light theme', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.HighContrastLight
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getThemeCssClass(), 'vscode-high-contrast-light');
    });
  });

  suite('Theme Variables', () => {
    test('should generate theme variables correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Dark
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      const variables = themeManager.getThemeVariables();
      
      assert.strictEqual(variables.includes('--theme-kind: \'vscode-dark\''), true);
      assert.strictEqual(variables.includes('--is-dark-theme: true'), true);
      assert.strictEqual(variables.includes('--is-light-theme: false'), true);
    });
  });

  suite('Singleton Pattern', () => {
    test('should return same instance on multiple calls', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const instance1 = ThemeManager.getInstance();
      const instance2 = ThemeManager.getInstance();
      
      assert.strictEqual(instance1, instance2);
    });

    test('should create new instance after reset', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const instance1 = ThemeManager.getInstance();
      ThemeManager.resetInstance();
      const instance2 = ThemeManager.getInstance();
      
      assert.notStrictEqual(instance1, instance2);
    });
  });

  suite('Disposal', () => {
    test('should dispose resources correctly', () => {
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      sandbox.stub(vscode.window, 'activeColorTheme').value(mockColorTheme);
      const mockDisposable = { dispose: sandbox.stub() };
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns(mockDisposable);

      const themeManager = ThemeManager.getInstance();
      themeManager.dispose();
      
      assert.strictEqual(mockDisposable.dispose.calledOnce, true);
    });
  });

  suite('Manual Theme Refresh', () => {
    test('should refresh theme and notify listeners', (done) => {
      let onDidChangeCallback: (theme: vscode.ColorTheme) => void;
      
      const mockColorTheme = {
        kind: vscode.ColorThemeKind.Light
      };
      const activeColorThemeStub = sandbox.stub(vscode.window, 'activeColorTheme');
      activeColorThemeStub.value(mockColorTheme);
      
      sandbox.stub(vscode.window, 'onDidChangeActiveColorTheme').returns({ dispose: () => {} });

      const themeManager = ThemeManager.getInstance();
      
      assert.strictEqual(themeManager.getCurrentTheme(), ThemeKind.Light);
      
      const disposable = themeManager.onThemeChanged((theme) => {
        assert.strictEqual(theme, ThemeKind.Dark);
        disposable.dispose();
        done();
      });

      activeColorThemeStub.value({
        kind: vscode.ColorThemeKind.Dark
      });

      themeManager.refreshTheme();
    });
  });
});