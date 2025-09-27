import * as path from 'path';
import * as fs from 'fs/promises';
import { ValidationResult, BinaryInfo } from '../types';
import { PlatformUtils } from '../utils/platformUtils';
import { ConfigManager } from './configManager';

/**
 * Manages bundled binaries and platform-specific binary resolution
 */
export class BinaryManager {
  private extensionPath: string;
  private configManager: ConfigManager;

  constructor(extensionPath: string, configManager: ConfigManager) {
    this.extensionPath = extensionPath;
    this.configManager = configManager;
  }

  /**
   * Get the path to the ADB binary (bundled or custom)
   */
  getAdbPath(): string {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath('adb');
  }

  /**
   * Get the path to the scrcpy binary (bundled or custom)
   */
  getScrcpyPath(): string {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath('scrcpy');
  }

  /**
   * Validate that required binaries exist and are executable
   */
  async validateBinaries(): Promise<ValidationResult> {
    const errors: string[] = [];
    let adbValid = false;
    let scrcpyValid = false;

    try {
      // Validate ADB binary
      const adbPath = this.getAdbPath();
      adbValid = await this.validateBinary(adbPath, 'adb');
      if (!adbValid) {
        errors.push(`ADB binary not found or not executable: ${adbPath}`);
      }
    } catch (error) {
      errors.push(`Error validating ADB binary: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      // Validate scrcpy binary
      const scrcpyPath = this.getScrcpyPath();
      scrcpyValid = await this.validateBinary(scrcpyPath, 'scrcpy');
      if (!scrcpyValid) {
        errors.push(`Scrcpy binary not found or not executable: ${scrcpyPath}`);
      }
    } catch (error) {
      errors.push(`Error validating scrcpy binary: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      adbValid,
      scrcpyValid,
      errors
    };
  }

  /**
   * Extract bundled binaries if needed (placeholder for future implementation)
   */
  async extractBinaries(): Promise<void> {
    // This method is a placeholder for future implementation
    // where binaries might be extracted from archives or downloaded
    const platform = PlatformUtils.getCurrentPlatform();
    const binariesDir = path.join(this.extensionPath, 'binaries', platform);
    
    try {
      await fs.access(binariesDir);
    } catch {
      // Create binaries directory if it doesn't exist
      await fs.mkdir(binariesDir, { recursive: true });
    }
  }

  /**
   * Get information about binary paths and their sources
   */
  getBinaryInfo(): { adb: BinaryInfo; scrcpy: BinaryInfo } {
    const customAdbPath = this.configManager.getCustomAdbPath();
    const customScrcpyPath = this.configManager.getCustomScrcpyPath();

    return {
      adb: {
        path: this.getAdbPath(),
        isCustom: !!customAdbPath,
        bundledPath: this.getBundledBinaryPath('adb')
      },
      scrcpy: {
        path: this.getScrcpyPath(),
        isCustom: !!customScrcpyPath,
        bundledPath: this.getBundledBinaryPath('scrcpy')
      }
    };
  }

  /**
   * Check if bundled binaries directory exists for current platform
   */
  async hasBundledBinaries(): Promise<boolean> {
    const platform = PlatformUtils.getCurrentPlatform();
    const binariesDir = path.join(this.extensionPath, 'binaries', platform);
    
    try {
      const stats = await fs.stat(binariesDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get the path to a bundled binary
   */
  private getBundledBinaryPath(binaryName: string): string {
    const platform = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path.join(
      this.extensionPath,
      'binaries',
      platform,
      `${binaryName}${extension}`
    );
  }

  /**
   * Validate that a binary exists and is executable
   */
  private async validateBinary(binaryPath: string, binaryName: string): Promise<boolean> {
    try {
      // Check if file exists
      const stats = await fs.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }

      // On Unix systems, check if file is executable
      if (PlatformUtils.getCurrentPlatform() !== 'win32') {
        try {
          await fs.access(binaryPath, fs.constants.X_OK);
        } catch {
          // Try to make it executable
          try {
            await PlatformUtils.makeExecutable(binaryPath);
          } catch {
            return false;
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}

