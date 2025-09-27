import * as os from 'os';
import * as path from 'path';
import { SpawnOptions } from 'child_process';

/**
 * Platform-specific utilities for cross-platform compatibility
 */
export class PlatformUtils {
  /**
   * Get the binary file extension for the current platform
   */
  static getBinaryExtension(): string {
    return os.platform() === 'win32' ? '.exe' : '';
  }

  /**
   * Get the binary path with platform-appropriate extension
   */
  static getBinaryPath(name: string): string {
    return `${name}${this.getBinaryExtension()}`;
  }

  /**
   * Make a file executable (Unix systems only)
   */
  static async makeExecutable(filePath: string): Promise<void> {
    if (os.platform() !== 'win32') {
      const fs = await import('fs/promises');
      try {
        // Check current permissions
        const stats = await fs.stat(filePath);
        const currentMode = stats.mode;
        
        // Add execute permissions for owner, group, and others if not already present
        const executableMode = currentMode | 0o111;
        
        if (currentMode !== executableMode) {
          await fs.chmod(filePath, executableMode);
        }
      } catch (error) {
        throw new Error(`Failed to make ${filePath} executable: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Check if a file has executable permissions (Unix systems only)
   */
  static async isExecutable(filePath: string): Promise<boolean> {
    if (os.platform() === 'win32') {
      // On Windows, check if file exists and has .exe extension or is in PATH
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

  /**
   * Get platform-specific spawn options for process execution
   */
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
          // Ensure proper handling of Windows paths
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
        
      case 'darwin':
        return {
          ...baseOptions,
          // macOS specific options
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
        
      case 'linux':
        return {
          ...baseOptions,
          // Linux specific options
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
        
      default:
        return baseOptions;
    }
  }

  /**
   * Get the current platform identifier
   */
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

  /**
   * Get platform-specific architecture identifier
   */
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

  /**
   * Get platform-specific binary directory name
   */
  static getPlatformBinaryDir(): string {
    const platform = this.getCurrentPlatform();
    const arch = this.getCurrentArchitecture();
    
    // For now, we'll use simple platform names, but this could be extended
    // to include architecture-specific directories if needed
    return platform;
  }

  /**
   * Normalize file paths for the current platform
   */
  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Check if the current platform supports a specific feature
   */
  static supportsFeature(feature: 'executable-permissions' | 'shell-execution' | 'process-signals'): boolean {
    const platform = os.platform();
    
    switch (feature) {
      case 'executable-permissions':
        return platform !== 'win32';
      case 'shell-execution':
        return true; // All platforms support shell execution
      case 'process-signals':
        return platform !== 'win32'; // Windows has limited signal support
      default:
        return false;
    }
  }

  /**
   * Get platform-specific process termination signal
   */
  static getTerminationSignal(): NodeJS.Signals {
    return os.platform() === 'win32' ? 'SIGTERM' : 'SIGTERM';
  }

  /**
   * Get platform-specific force kill signal
   */
  static getForceKillSignal(): NodeJS.Signals {
    return os.platform() === 'win32' ? 'SIGKILL' : 'SIGKILL';
  }

  /**
   * Get platform-specific temporary directory
   */
  static getTempDir(): string {
    return os.tmpdir();
  }

  /**
   * Check if running on a supported platform
   */
  static isSupportedPlatform(): boolean {
    try {
      this.getCurrentPlatform();
      return true;
    } catch {
      return false;
    }
  }
}