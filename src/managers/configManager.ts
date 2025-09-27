import * as vscode from 'vscode';

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Configuration values with validation
 */
export interface ValidatedConfig {
  defaultIp: string;
  defaultPort: string;
  customAdbPath?: string;
  customScrcpyPath?: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Manages extension configuration and settings
 */
export class ConfigManager {
  private static readonly CONFIG_SECTION = 'droidbridge';
  private static readonly DEFAULT_IP = '192.168.1.100';
  private static readonly DEFAULT_PORT = '5555';

  /**
   * Get the default IP address for ADB connections
   */
  getDefaultIp(): string {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const ip = config.get<string>('defaultIp', ConfigManager.DEFAULT_IP);
    return ip.trim() || ConfigManager.DEFAULT_IP;
  }

  /**
   * Get the default port for ADB connections
   */
  getDefaultPort(): string {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const port = config.get<string>('defaultPort', ConfigManager.DEFAULT_PORT);
    return port.trim() || ConfigManager.DEFAULT_PORT;
  }

  /**
   * Get custom ADB binary path if configured
   */
  getCustomAdbPath(): string | undefined {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const path = config.get<string>('adbPath', '');
    return path.trim() || undefined;
  }

  /**
   * Get custom scrcpy binary path if configured
   */
  getCustomScrcpyPath(): string | undefined {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const path = config.get<string>('scrcpyPath', '');
    return path.trim() || undefined;
  }

  /**
   * Get all configuration values with validation
   */
  getValidatedConfig(): ValidatedConfig {
    const defaultIp = this.getDefaultIp();
    const defaultPort = this.getDefaultPort();
    const customAdbPath = this.getCustomAdbPath();
    const customScrcpyPath = this.getCustomScrcpyPath();

    const errors: string[] = [];

    // Validate IP address
    if (!this.validateIpAddress(defaultIp)) {
      errors.push(`Invalid IP address: ${defaultIp}`);
    }

    // Validate port
    if (!this.validatePort(defaultPort)) {
      errors.push(`Invalid port: ${defaultPort}`);
    }

    return {
      defaultIp,
      defaultPort,
      customAdbPath,
      customScrcpyPath,
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate an IP address format
   * Supports IPv4 addresses including localhost and private network ranges
   */
  validateIpAddress(ip: string): boolean {
    if (!ip || typeof ip !== 'string') {
      return false;
    }

    const trimmedIp = ip.trim();
    
    // Check for localhost
    if (trimmedIp === 'localhost' || trimmedIp === '127.0.0.1') {
      return true;
    }

    // IPv4 regex pattern - more strict to reject leading zeros
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
    
    if (!ipv4Regex.test(trimmedIp)) {
      return false;
    }

    // Additional validation for edge cases and leading zeros
    const parts = trimmedIp.split('.');
    return parts.every(part => {
      // Reject leading zeros (except for '0' itself)
      if (part.length > 1 && part.startsWith('0')) {
        return false;
      }
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * Validate a port number
   * Must be between 1 and 65535 (inclusive)
   */
  validatePort(port: string | number): boolean {
    if (port === null || port === undefined) {
      return false;
    }

    let portNum: number;
    
    if (typeof port === 'string') {
      const trimmedPort = port.trim();
      if (trimmedPort === '') {
        return false;
      }
      
      // Check if string contains decimal point (reject decimals)
      if (trimmedPort.includes('.')) {
        return false;
      }
      
      // Check if string is a valid integer (no leading/trailing non-digits)
      if (!/^\d+$/.test(trimmedPort)) {
        return false;
      }
      
      // Reject leading zeros (except for '0' itself)
      if (trimmedPort.length > 1 && trimmedPort.startsWith('0')) {
        return false;
      }
      
      portNum = parseInt(trimmedPort, 10);
    } else {
      portNum = port;
    }

    return !isNaN(portNum) && Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;
  }

  /**
   * Validate IP and port combination
   */
  validateConnection(ip: string, port: string): ConfigValidationResult {
    const errors: string[] = [];

    if (!this.validateIpAddress(ip)) {
      errors.push(`Invalid IP address: ${ip}. Must be a valid IPv4 address or 'localhost'.`);
    }

    if (!this.validatePort(port)) {
      errors.push(`Invalid port: ${port}. Must be a number between 1 and 65535.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration with fallback to defaults
   */
  getConfigWithDefaults(): { ip: string; port: string } {
    const ip = this.getDefaultIp();
    const port = this.getDefaultPort();

    return {
      ip: this.validateIpAddress(ip) ? ip : ConfigManager.DEFAULT_IP,
      port: this.validatePort(port) ? port : ConfigManager.DEFAULT_PORT
    };
  }

  /**
   * Register a callback for configuration changes
   */
  onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ConfigManager.CONFIG_SECTION)) {
        callback();
      }
    });
  }

  /**
   * Update configuration value
   */
  async updateConfig(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    await config.update(key, value, target);
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    await Promise.all([
      config.update('defaultIp', undefined, vscode.ConfigurationTarget.Workspace),
      config.update('defaultPort', undefined, vscode.ConfigurationTarget.Workspace),
      config.update('adbPath', undefined, vscode.ConfigurationTarget.Workspace),
      config.update('scrcpyPath', undefined, vscode.ConfigurationTarget.Workspace)
    ]);
  }
}