import * as vscode from 'vscode';

export enum ThemeKind {
  Light = 1,
  Dark = 2,
  HighContrast = 3,
  HighContrastLight = 4
}

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeKind;
  private themeChangeListeners: Array<(theme: ThemeKind) => void> = [];
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    this.currentTheme = this.detectCurrentTheme();
    this.setupThemeChangeListener();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private detectCurrentTheme(): ThemeKind {
    const colorTheme = vscode.window.activeColorTheme;
    
    switch (colorTheme.kind) {
      case vscode.ColorThemeKind.Light:
        return ThemeKind.Light;
      case vscode.ColorThemeKind.Dark:
        return ThemeKind.Dark;
      case vscode.ColorThemeKind.HighContrast:
        return ThemeKind.HighContrast;
      case vscode.ColorThemeKind.HighContrastLight:
        return ThemeKind.HighContrastLight;
      default:
        return ThemeKind.Dark; // Default fallback
    }
  }

  private setupThemeChangeListener(): void {
    const disposable = vscode.window.onDidChangeActiveColorTheme((colorTheme) => {
      const newTheme = this.mapColorThemeKindToThemeKind(colorTheme.kind);
      
      if (newTheme !== this.currentTheme) {
        const oldTheme = this.currentTheme;
        this.currentTheme = newTheme;
        
        this.themeChangeListeners.forEach(listener => {
          try {
            listener(newTheme);
          } catch (error) {
            console.error('Error in theme change listener:', error);
          }
        });
      }
    });
    
    this.disposables.push(disposable);
  }

  private mapColorThemeKindToThemeKind(kind: vscode.ColorThemeKind): ThemeKind {
    switch (kind) {
      case vscode.ColorThemeKind.Light:
        return ThemeKind.Light;
      case vscode.ColorThemeKind.Dark:
        return ThemeKind.Dark;
      case vscode.ColorThemeKind.HighContrast:
        return ThemeKind.HighContrast;
      case vscode.ColorThemeKind.HighContrastLight:
        return ThemeKind.HighContrastLight;
      default:
        return ThemeKind.Dark;
    }
  }

  public getCurrentTheme(): ThemeKind {
    return this.currentTheme;
  }

  public isDarkTheme(): boolean {
    return this.currentTheme === ThemeKind.Dark || this.currentTheme === ThemeKind.HighContrast;
  }

  public isLightTheme(): boolean {
    return this.currentTheme === ThemeKind.Light || this.currentTheme === ThemeKind.HighContrastLight;
  }

  public getThemeSpecificIcon(iconName: string, extensionUri: vscode.Uri): vscode.Uri {
    const themeFolder = this.isDarkTheme() ? 'dark' : 'light';
    return vscode.Uri.joinPath(extensionUri, 'media', 'icons', themeFolder, `${iconName}.svg`);
  }

  public getWebviewIconUri(iconName: string, extensionUri: vscode.Uri, webview: vscode.Webview): vscode.Uri {
    const iconPath = this.getThemeSpecificIcon(iconName, extensionUri);
    return webview.asWebviewUri(iconPath);
  }

  public getThemeCssClass(): string {
    switch (this.currentTheme) {
      case ThemeKind.Light:
        return 'vscode-light';
      case ThemeKind.Dark:
        return 'vscode-dark';
      case ThemeKind.HighContrast:
        return 'vscode-high-contrast';
      case ThemeKind.HighContrastLight:
        return 'vscode-high-contrast-light';
      default:
        return 'vscode-dark';
    }
  }

  public onThemeChanged(listener: (theme: ThemeKind) => void): vscode.Disposable {
    this.themeChangeListeners.push(listener);
    
    return {
      dispose: () => {
        const index = this.themeChangeListeners.indexOf(listener);
        if (index >= 0) {
          this.themeChangeListeners.splice(index, 1);
        }
      }
    };
  }

  public getThemeVariables(): string {
    return `
      :root {
        --theme-kind: '${this.getThemeCssClass()}';
        --is-dark-theme: ${this.isDarkTheme() ? 'true' : 'false'};
        --is-light-theme: ${this.isLightTheme() ? 'true' : 'false'};
      }
    `;
  }

  public refreshTheme(): void {
    const newTheme = this.detectCurrentTheme();
    if (newTheme !== this.currentTheme) {
      const oldTheme = this.currentTheme;
      this.currentTheme = newTheme;
      
      this.themeChangeListeners.forEach(listener => {
        try {
          listener(newTheme);
        } catch (error) {
          console.error('Error in theme change listener during refresh:', error);
        }
      });
    }
  }

  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    this.themeChangeListeners = [];
  }

  public static resetInstance(): void {
    if (ThemeManager.instance) {
      ThemeManager.instance.dispose();
      ThemeManager.instance = undefined as any;
    }
  }
}