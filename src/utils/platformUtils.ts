import * as os from 'os';
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
  static async makeExecutable(path: string): Promise<void> {
    if (os.platform() !== 'win32') {
      const fs = await import('fs/promises');
      try {
        await fs.chmod(path, 0o755);
      } catch (error) {
        throw new Error(`Failed to make ${path} executable: ${error}`);
      }
    }
  }

  /**
   * Get platform-specific spawn options
   */
  static getPlatformSpecificOptions(): SpawnOptions {
    const options: SpawnOptions = {
      stdio: ['pipe', 'pipe', 'pipe']
    };

    if (os.platform() === 'win32') {
      options.shell = true;
    }

    return options;
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
}