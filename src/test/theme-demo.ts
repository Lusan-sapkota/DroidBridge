
import * as vscode from 'vscode';
import { ThemeManager, ThemeKind } from '../utils/themeManager';

export async function runThemeDemo(): Promise<void> {
  const themeManager = ThemeManager.getInstance();
  
  console.log('=== DroidBridge Theme Integration Demo ===');
  
  console.log(`Current theme: ${ThemeKind[themeManager.getCurrentTheme()]}`);
  console.log(`Is dark theme: ${themeManager.isDarkTheme()}`);
  console.log(`Is light theme: ${themeManager.isLightTheme()}`);
  console.log(`CSS class: ${themeManager.getThemeCssClass()}`);
  
  const disposable = themeManager.onThemeChanged((newTheme: ThemeKind) => {
    console.log(`Theme changed to: ${ThemeKind[newTheme]}`);
    console.log(`New CSS class: ${themeManager.getThemeCssClass()}`);
    console.log(`Is dark: ${themeManager.isDarkTheme()}`);
    console.log(`Is light: ${themeManager.isLightTheme()}`);
  });
  
  const result = await vscode.window.showInformationMessage(
    'DroidBridge Theme Demo: Check the console for theme information. Try switching themes to see real-time updates!',
    'Show Theme Info',
    'Test Icon Paths',
    'Done'
  );
  
  if (result === 'Show Theme Info') {
    await showThemeInfo(themeManager);
  } else if (result === 'Test Icon Paths') {
    await testIconPaths(themeManager);
  }
  
  disposable.dispose();
  console.log('Theme demo completed');
}

async function showThemeInfo(themeManager: ThemeManager): Promise<void> {
  const themeInfo = `
Current Theme Information:
- Theme: ${ThemeKind[themeManager.getCurrentTheme()]}
- CSS Class: ${themeManager.getThemeCssClass()}
- Is Dark: ${themeManager.isDarkTheme()}
- Is Light: ${themeManager.isLightTheme()}
- Theme Variables: ${themeManager.getThemeVariables()}
  `.trim();
  
  await vscode.window.showInformationMessage(themeInfo);
}

async function testIconPaths(themeManager: ThemeManager): Promise<void> {
  const extensionUri = vscode.Uri.file('/test/extension');
  
  const plugIcon = themeManager.getThemeSpecificIcon('plug', extensionUri);
  const deviceIcon = themeManager.getThemeSpecificIcon('device-mobile', extensionUri);
  
  const iconInfo = `
Icon Paths for Current Theme:
- Plug Icon: ${plugIcon.fsPath}
- Device Icon: ${deviceIcon.fsPath}
- Theme Folder: ${themeManager.isDarkTheme() ? 'dark' : 'light'}
  `.trim();
  
  console.log(iconInfo);
  await vscode.window.showInformationMessage('Icon paths logged to console');
}

export function registerThemeDemoCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('droidbridge.themeDemo', runThemeDemo);
  context.subscriptions.push(disposable);
}

export async function testThemeSwitching(): Promise<void> {
  const themeManager = ThemeManager.getInstance();
  
  console.log('Testing theme switching...');
  
  const disposable = themeManager.onThemeChanged((theme) => {
    console.log(`Theme switched to: ${ThemeKind[theme]}`);
  });

  themeManager.refreshTheme();
  console.log('Theme refresh completed');
  
  setTimeout(() => {
    disposable.dispose();
    console.log('Theme switching test completed');
  }, 1000);
}

export function validateThemeIntegration(): boolean {
  try {
    const themeManager = ThemeManager.getInstance();
    
    const currentTheme = themeManager.getCurrentTheme();
    const isDark = themeManager.isDarkTheme();
    const isLight = themeManager.isLightTheme();
    const cssClass = themeManager.getThemeCssClass();
    const variables = themeManager.getThemeVariables();
    
    const isValidTheme = Object.values(ThemeKind).includes(currentTheme);
    const hasValidCssClass = typeof cssClass === 'string' && cssClass.startsWith('vscode-');
    const hasValidVariables = typeof variables === 'string' && variables.includes(':root');
    const themeConsistency = (isDark && !isLight) || (!isDark && isLight);
    
    const isValid = isValidTheme && hasValidCssClass && hasValidVariables && themeConsistency;
    
    console.log('Theme Integration Validation:', {
      isValidTheme,
      hasValidCssClass,
      hasValidVariables,
      themeConsistency,
      overall: isValid
    });
    
    return isValid;
  } catch (error) {
    console.error('Theme integration validation failed:', error);
    return false;
  }
}