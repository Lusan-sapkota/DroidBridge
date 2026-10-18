import * as vscode from 'vscode';
import { ScrcpyOptions } from '../types';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidatedConfig {
  defaultIp: string;
  defaultPort: string;
  customAdbPath?: string;
  customScrcpyPath?: string;
  isValid: boolean;
  errors: string[];
}

export class ConfigManager {
  private static readonly CONFIG_SECTION = 'droidbridge';
  private static readonly DEFAULT_IP = '192.168.1.100';
  private static readonly DEFAULT_PORT = '5555';

  getDefaultIp(): string {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const ip = config.get<string>('defaultIp', ConfigManager.DEFAULT_IP);
    return ip.trim() || ConfigManager.DEFAULT_IP;
  }

  getDefaultPort(): string {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const port = config.get<string>('defaultPort', ConfigManager.DEFAULT_PORT);
    return port.trim() || ConfigManager.DEFAULT_PORT;
  }

  getCustomAdbPath(): string | undefined {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const path = config.get<string>('adbPath', '');
    return path.trim() || undefined;
  }

  getCustomScrcpyPath(): string | undefined {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const path = config.get<string>('scrcpyPath', '');
    return path.trim() || undefined;
  }

  getValidatedConfig(): ValidatedConfig {
    const defaultIp = this.getDefaultIp();
    const defaultPort = this.getDefaultPort();
    const customAdbPath = this.getCustomAdbPath();
    const customScrcpyPath = this.getCustomScrcpyPath();

    const errors: string[] = [];

    if (!this.validateIpAddress(defaultIp)) {
      errors.push(`Invalid IP address: ${defaultIp}`);
    }

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

  validateIpAddress(ip: string): boolean {
    if (!ip || typeof ip !== 'string') {
      return false;
    }

    const trimmedIp = ip.trim();
    
    if (trimmedIp === 'localhost' || trimmedIp === '127.0.0.1') {
      return true;
    }

    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
    
    if (!ipv4Regex.test(trimmedIp)) {
      return false;
    }

    const parts = trimmedIp.split('.');
    return parts.every(part => {
      if (part.length > 1 && part.startsWith('0')) {
        return false;
      }
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

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
      
      if (trimmedPort.includes('.')) {
        return false;
      }
      
      if (!/^\d+$/.test(trimmedPort)) {
        return false;
      }
      
      if (trimmedPort.length > 1 && trimmedPort.startsWith('0')) {
        return false;
      }
      
      portNum = parseInt(trimmedPort, 10);
    } else {
      portNum = port;
    }

    return !isNaN(portNum) && Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;
  }

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

  getScrcpyOptions(): ScrcpyOptions {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    const maxSize = config.get<number>('scrcpy.maxSize', 1024);
    const bitrate = config.get<string>('scrcpy.bitrate', '8M').trim();
    return {
      maxSize: maxSize > 0 ? maxSize : undefined,
      bitrate: bitrate || undefined,
      alwaysOnTop: config.get<boolean>('scrcpy.alwaysOnTop', true),
    };
  }

  getConfigWithDefaults(): { ip: string; port: string } {
    const ip = this.getDefaultIp();
    const port = this.getDefaultPort();

    return {
      ip: this.validateIpAddress(ip) ? ip : ConfigManager.DEFAULT_IP,
      port: this.validatePort(port) ? port : ConfigManager.DEFAULT_PORT
    };
  }

  onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ConfigManager.CONFIG_SECTION)) {
        callback();
      }
    });
  }

  async updateConfig(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    await config.update(key, value, target);
  }

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