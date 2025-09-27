import * as vscode from 'vscode';

/**
 * Theme types supported by VSCode
 */
export enum ThemeKind {
  Light = 1,
  Dark = 2,
  HighContrast = 3,
  HighContrastLight = 4
}

/**
 * Theme manager for handling theme detection and icon switching
 * Implements requirements 10.1, 10.2, 10.3, 10.4
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeKind;
  private themeChangeListeners: Array<(theme: ThemeKind) => void> = [];
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    this.currentTheme = this.detectCurrentTheme();
    this.setupThemeChangeListener();
  }

  /**
   * Get the singleton instance of ThemeManager
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Detect the current VSCode theme
   * Implements requirement 10.1, 10.2: Automatic theme detection
   */
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

  /**
   * Set up listener for theme changes
   * Implements requirement 10.3: Theme change listeners
   */
  private setupThemeChangeListener(): void {
    const disposable = vscode.window.onDidChangeActiveColorTheme((colorTheme) => {
      const newTheme = this.mapColorThemeKindToThemeKind(colorTheme.kind);
      
      if (newTheme !== this.currentTheme) {
        const oldTheme = this.currentTheme;
        this.currentTheme = newTheme;
        
        // Notify all listeners about the theme change
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

  /**
   * Map VSCode ColorThemeKind to our ThemeKind
   */
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

  /**
   * Get the current theme
   */
  public getCurrentTheme(): ThemeKind {
    return this.currentTheme;
  }

  /**
   * Check if the current theme is dark
   */
  public isDarkTheme(): boolean {
    return this.currentTheme === ThemeKind.Dark || this.currentTheme === ThemeKind.HighContrast;
  }

  /**
   * Check if the current theme is light
   */
  public isLightTheme(): boolean {
    return this.currentTheme === ThemeKind.Light || this.currentTheme === ThemeKind.HighContrastLight;
  }

  /**
   * Get the appropriate icon path for the current theme
   * Implements requirement 10.4: Automatic icon switching
   */
  public getThemeSpecificIcon(iconName: string, extensionUri: vscode.Uri): vscode.Uri {
    const themeFolder = this.isDarkTheme() ? 'dark' : 'light';
    return vscode.Uri.joinPath(extensionUri, 'media', 'icons', themeFolder, `${iconName}.svg`);
  }

  /**
   * Get the theme-specific icon URI for webview usage
   */
  public getWebviewIconUri(iconName: string, extensionUri: vscode.Uri, webview: vscode.Webview): vscode.Uri {
    const iconPath = this.getThemeSpecificIcon(iconName, extensionUri);
    return webview.asWebviewUri(iconPath);
  }

  /**
   * Get CSS class name for current theme
   */
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

  /**
   * Register a listener for theme changes
   * Implements requirement 10.3: Theme change listeners and UI updates
   */
  public onThemeChanged(listener: (theme: ThemeKind) => void): vscode.Disposable {
    this.themeChangeListeners.push(listener);
    
    // Return a disposable to remove the listener
    return {
      dispose: () => {
        const index = this.themeChangeListeners.indexOf(listener);
        if (index >= 0) {
          this.themeChangeListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get theme-specific CSS variables as a string
   * Implements requirement 10.5: CSS variable usage for consistent theming
   */
  public getThemeVariables(): string {
    // These variables are automatically provided by VSCode's webview context
    // This method can be used to add custom theme-specific variables if needed
    return `
      :root {
        --theme-kind: '${this.getThemeCssClass()}';
        --is-dark-theme: ${this.isDarkTheme() ? 'true' : 'false'};
        --is-light-theme: ${this.isLightTheme() ? 'true' : 'false'};
      }
    `;
  }

  /**
   * Refresh the current theme detection
   * Useful for manual theme refresh
   */
  public refreshTheme(): void {
    const newTheme = this.detectCurrentTheme();
    if (newTheme !== this.currentTheme) {
      const oldTheme = this.currentTheme;
      this.currentTheme = newTheme;
      
      // Notify listeners
      this.themeChangeListeners.forEach(listener => {
        try {
          listener(newTheme);
        } catch (error) {
          console.error('Error in theme change listener during refresh:', error);
        }
      });
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
    this.themeChangeListeners = [];
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  public static resetInstance(): void {
    if (ThemeManager.instance) {
      ThemeManager.instance.dispose();
      ThemeManager.instance = undefined as any;
    }
  }
}