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
   * Extract bundled binaries if needed and ensure they are executable
   */
  async extractBinaries(): Promise<void> {
    const platform = PlatformUtils.getCurrentPlatform();
    const binariesDir = path.join(this.extensionPath, 'binaries', platform);
    
    try {
      // Ensure binaries directory exists
      await fs.mkdir(binariesDir, { recursive: true });
      
      // Get paths to expected binaries
      const adbPath = this.getBundledBinaryPath('adb');
      const scrcpyPath = this.getBundledBinaryPath('scrcpy');
      
      // Check if binaries exist and make them executable if needed
      const binariesToProcess = [
        { name: 'adb', path: adbPath },
        { name: 'scrcpy', path: scrcpyPath }
      ];
      
      for (const binary of binariesToProcess) {
        try {
          // Check if binary exists
          await fs.access(binary.path);
          
          // Make executable on Unix systems
          if (PlatformUtils.supportsFeature('executable-permissions')) {
            const isExecutable = await PlatformUtils.isExecutable(binary.path);
            if (!isExecutable) {
              await PlatformUtils.makeExecutable(binary.path);
            }
          }
        } catch (error) {
          // Binary doesn't exist - this is expected for development/testing
          // In a real deployment, binaries would be bundled with the extension
          console.warn(`Binary ${binary.name} not found at ${binary.path}. This is expected during development.`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to extract binaries: ${error instanceof Error ? error.message : String(error)}`);
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
   * Check binary integrity and platform compatibility
   */
  async checkBinaryIntegrity(): Promise<{ adb: boolean; scrcpy: boolean; errors: string[] }> {
    const errors: string[] = [];
    let adbIntegrity = false;
    let scrcpyIntegrity = false;

    try {
      // Check if platform is supported
      if (!PlatformUtils.isSupportedPlatform()) {
        errors.push(`Unsupported platform: ${PlatformUtils.getCurrentPlatform()}`);
        return { adb: false, scrcpy: false, errors };
      }

      // Check ADB binary integrity
      const adbPath = this.getAdbPath();
      adbIntegrity = await this.checkSingleBinaryIntegrity(adbPath, 'adb');
      if (!adbIntegrity) {
        errors.push(`ADB binary integrity check failed: ${adbPath}`);
      }

      // Check scrcpy binary integrity
      const scrcpyPath = this.getScrcpyPath();
      scrcpyIntegrity = await this.checkSingleBinaryIntegrity(scrcpyPath, 'scrcpy');
      if (!scrcpyIntegrity) {
        errors.push(`Scrcpy binary integrity check failed: ${scrcpyPath}`);
      }

    } catch (error) {
      errors.push(`Binary integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { adb: adbIntegrity, scrcpy: scrcpyIntegrity, errors };
  }

  /**
   * Get platform-specific binary information
   */
  getPlatformInfo(): {
    platform: string;
    architecture: string;
    binaryExtension: string;
    supportsExecutablePermissions: boolean;
  } {
    return {
      platform: PlatformUtils.getCurrentPlatform(),
      architecture: PlatformUtils.getCurrentArchitecture(),
      binaryExtension: PlatformUtils.getBinaryExtension(),
      supportsExecutablePermissions: PlatformUtils.supportsFeature('executable-permissions')
    };
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
      if (PlatformUtils.supportsFeature('executable-permissions')) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
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

  /**
   * Check integrity of a single binary file
   */
  private async checkSingleBinaryIntegrity(binaryPath: string, binaryName: string): Promise<boolean> {
    try {
      // Basic file existence and type check
      const stats = await fs.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }

      // Check file size (binaries should not be empty)
      if (stats.size === 0) {
        return false;
      }

      // Platform-specific checks
      const platform = PlatformUtils.getCurrentPlatform();
      
      if (platform === 'win32') {
        // On Windows, check if it has .exe extension for executables
        const expectedExtension = PlatformUtils.getBinaryExtension();
        if (expectedExtension && !binaryPath.endsWith(expectedExtension)) {
          return false;
        }
      } else {
        // On Unix systems, check executable permissions
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          // Try to make it executable
          try {
            await PlatformUtils.makeExecutable(binaryPath);
            // Verify it's now executable
            return await PlatformUtils.isExecutable(binaryPath);
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

