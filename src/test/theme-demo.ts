/**
 * Theme Integration Demo
 * 
 * This file demonstrates the theme integration functionality
 * and can be used for testing theme switching behavior.
 */

import * as vscode from 'vscode';
import { ThemeManager, ThemeKind } from '../utils/themeManager';

/**
 * Demo function to showcase theme integration
 */
export async function runThemeDemo(): Promise<void> {
  const themeManager = ThemeManager.getInstance();
  
  console.log('=== DroidBridge Theme Integration Demo ===');
  
  // Display current theme information
  console.log(`Current theme: ${ThemeKind[themeManager.getCurrentTheme()]}`);
  console.log(`Is dark theme: ${themeManager.isDarkTheme()}`);
  console.log(`Is light theme: ${themeManager.isLightTheme()}`);
  console.log(`CSS class: ${themeManager.getThemeCssClass()}`);
  
  // Register a theme change listener for demo purposes
  const disposable = themeManager.onThemeChanged((newTheme: ThemeKind) => {
    console.log(`Theme changed to: ${ThemeKind[newTheme]}`);
    console.log(`New CSS class: ${themeManager.getThemeCssClass()}`);
    console.log(`Is dark: ${themeManager.isDarkTheme()}`);
    console.log(`Is light: ${themeManager.isLightTheme()}`);
  });
  
  // Show information message to user
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
  
  // Clean up the listener
  disposable.dispose();
  console.log('Theme demo completed');
}

/**
 * Show detailed theme information
 */
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

/**
 * Test icon path resolution for different themes
 */
async function testIconPaths(themeManager: ThemeManager): Promise<void> {
  // Mock extension URI for testing
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

/**
 * Command to run the theme demo
 */
export function registerThemeDemoCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('droidbridge.themeDemo', runThemeDemo);
  context.subscriptions.push(disposable);
}

/**
 * Test theme switching programmatically (for development/testing)
 */
export async function testThemeSwitching(): Promise<void> {
  const themeManager = ThemeManager.getInstance();
  
  console.log('Testing theme switching...');
  
  // Listen for theme changes
  const disposable = themeManager.onThemeChanged((theme) => {
    console.log(`Theme switched to: ${ThemeKind[theme]}`);
  });
  
  // Note: We can't programmatically switch VSCode themes,
  // but we can test our theme detection and response
  
  // Test manual refresh
  themeManager.refreshTheme();
  console.log('Theme refresh completed');
  
  // Clean up
  setTimeout(() => {
    disposable.dispose();
    console.log('Theme switching test completed');
  }, 1000);
}

/**
 * Validate theme integration setup
 */
export function validateThemeIntegration(): boolean {
  try {
    const themeManager = ThemeManager.getInstance();
    
    // Test basic functionality
    const currentTheme = themeManager.getCurrentTheme();
    const isDark = themeManager.isDarkTheme();
    const isLight = themeManager.isLightTheme();
    const cssClass = themeManager.getThemeCssClass();
    const variables = themeManager.getThemeVariables();
    
    // Validate that we got reasonable values
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