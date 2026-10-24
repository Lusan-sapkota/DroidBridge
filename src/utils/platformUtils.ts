import * as os from 'os';
import * as path from 'path';
import { SpawnOptions } from 'child_process';

export class PlatformUtils {
  static getBinaryExtension(): string {
    return os.platform() === 'win32' ? '.exe' : '';
  }

  static getBinaryPath(name: string): string {
    return `${name}${this.getBinaryExtension()}`;
  }

  static async makeExecutable(filePath: string): Promise<void> {
    if (os.platform() !== 'win32') {
      const fs = await import('fs/promises');
      try {
        const stats = await fs.stat(filePath);
        const currentMode = stats.mode;
        
        const executableMode = currentMode | 0o111;
        
        if (currentMode !== executableMode) {
          await fs.chmod(filePath, executableMode);
        }
      } catch (error) {
        throw new Error(`Failed to make ${filePath} executable: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  static async isExecutable(filePath: string): Promise<boolean> {
    if (os.platform() === 'win32') {
      const fs = await import('fs/promises');
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    }

    const fs = await import('fs/promises');
    try {
      await fs.access(filePath, fs.constants.F_OK | fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  static getPlatformSpecificOptions(options: Partial<SpawnOptions> = {}): SpawnOptions {
    const baseOptions: SpawnOptions = {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    };

    const platform = os.platform();
    
    switch (platform) {
      case 'win32':
        return {
          ...baseOptions,
          shell: true,
          windowsHide: true,
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
        
      case 'darwin':
        return {
          ...baseOptions,
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
        
      case 'linux':
        return {
          ...baseOptions,
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
        
      default:
        return baseOptions;
    }
  }

  static getCurrentPlatform(): string {
    const platform = os.platform();
    switch (platform) {
      case 'win32':
        return 'win32';
      case 'darwin':
        return 'darwin';
      case 'linux':
        return 'linux';
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static getCurrentArchitecture(): string {
    const arch = os.arch();
    switch (arch) {
      case 'x64':
        return 'x64';
      case 'arm64':
        return 'arm64';
      case 'ia32':
        return 'x86';
      default:
        return arch;
    }
  }

  static getPlatformBinaryDir(): string {
    const platform = this.getCurrentPlatform();
    const arch = this.getCurrentArchitecture();
    
    return platform;
  }

  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  static supportsFeature(feature: 'executable-permissions' | 'shell-execution' | 'process-signals'): boolean {
    const platform = os.platform();
    
    switch (feature) {
      case 'executable-permissions':
        return platform !== 'win32';
      case 'shell-execution':
        return true;
      case 'process-signals':
        return platform !== 'win32';
      default:
        return false;
    }
  }

  static getTerminationSignal(): NodeJS.Signals {
    return os.platform() === 'win32' ? 'SIGTERM' : 'SIGTERM';
  }

  static getForceKillSignal(): NodeJS.Signals {
    return os.platform() === 'win32' ? 'SIGKILL' : 'SIGKILL';
  }

  static getTempDir(): string {
    return os.tmpdir();
  }

  static isSupportedPlatform(): boolean {
    try {
      this.getCurrentPlatform();
      return true;
    } catch {
      return false;
    }
  }
}