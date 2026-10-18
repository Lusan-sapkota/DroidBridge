import * as path from 'path';
import * as fs from 'fs/promises';
import { ValidationResult, BinaryInfo } from '../types';
import { PlatformUtils } from '../utils/platformUtils';
import { ConfigManager } from './configManager';
import { BinaryDetector, BinaryDetectionResult, BinaryRequirement } from './binaryDetector';
import { BinaryDownloader, DownloadResult, DownloadProgress } from './binaryDownloader';

export class BinaryManager {
  private extensionPath: string;
  private configManager: ConfigManager;
  private binaryDetector: BinaryDetector;
  private binaryDownloader: BinaryDownloader;
  private detectionCache: Map<string, BinaryDetectionResult> = new Map();
  private downloadProgressCallback?: (progress: DownloadProgress) => void;

  constructor(extensionPath: string, configManager: ConfigManager) {
    this.extensionPath = extensionPath;
    this.configManager = configManager;
    this.binaryDetector = new BinaryDetector(extensionPath);
    this.binaryDownloader = new BinaryDownloader(this.binaryDetector.getDownloadDir());
  }

  setDownloadProgressCallback(callback: (progress: DownloadProgress) => void): void {
    this.downloadProgressCallback = callback;
    this.binaryDownloader.setProgressCallback(callback);
  }

  async getAdbPath(): Promise<string> {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    
    const detection = await this.getOrDetectBinary('adb');
    if (detection.found && detection.path) {
      return detection.path;
    }
    
    throw new Error('ADB binary not found. Please install ADB or set a custom path in settings.');
  }

  async getScrcpyPath(): Promise<string> {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    
    const detection = await this.getOrDetectBinary('scrcpy');
    if (detection.found && detection.path) {
      return detection.path;
    }
    
    throw new Error('Scrcpy binary not found. Please install scrcpy or set a custom path in settings.');
  }

  getAdbPathSync(): string {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath('adb');
  }

  getScrcpyPathSync(): string {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath('scrcpy');
  }

  async ensureBinariesAvailable(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const detectionStatus = await this.getDetectionStatus();
      
      const missingBinaries: BinaryRequirement[] = [];
      for (const requirement of BinaryDetector.getBinaryRequirements()) {
        const detection = detectionStatus.get(requirement.name);
        if (!detection?.found) {
          missingBinaries.push(requirement);
        }
      }
      
      if (missingBinaries.length === 0) {
        return { success: true, errors: [] };
      }

      const downloadResults = await this.binaryDownloader.downloadBinaries(missingBinaries);
      
      for (const result of downloadResults) {
        if (!result.success) {
          errors.push(`Failed to download ${result.binary}: ${result.error}`);
        }
      }

      this.detectionCache.clear();

      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Binary management error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, errors };
    }
  }

  async validateBinaries(): Promise<ValidationResult> {
    const errors: string[] = [];
    let adbValid = false;
    let scrcpyValid = false;

    try {
      const ensureResult = await this.ensureBinariesAvailable();
      if (!ensureResult.success) {
        errors.push(...ensureResult.errors);
      }

      try {
        const adbPath = await this.getAdbPath();
        adbValid = await this.validateBinary(adbPath, 'adb');
        if (!adbValid) {
          errors.push(`ADB binary not found or not executable: ${adbPath}`);
        }
      } catch (error) {
        errors.push(`Error validating ADB binary: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        const scrcpyPath = await this.getScrcpyPath();
        scrcpyValid = await this.validateBinary(scrcpyPath, 'scrcpy');
        if (!scrcpyValid) {
          errors.push(`Scrcpy binary not found or not executable: ${scrcpyPath}`);
        }
      } catch (error) {
        errors.push(`Error validating scrcpy binary: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      errors.push(`Binary validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      adbValid,
      scrcpyValid,
      errors
    };
  }

  async getBinaryInfo(): Promise<{ adb: BinaryInfo & { source: string; version?: string }; scrcpy: BinaryInfo & { source: string; version?: string } }> {
    const customAdbPath = this.configManager.getCustomAdbPath();
    const customScrcpyPath = this.configManager.getCustomScrcpyPath();

    const adbDetection = await this.getOrDetectBinary('adb');
    const scrcpyDetection = await this.getOrDetectBinary('scrcpy');

    return {
      adb: {
        path: customAdbPath || adbDetection.path || 'Not found',
        isCustom: !!customAdbPath,
        bundledPath: this.getBundledBinaryPath('adb'),
        source: customAdbPath ? 'custom' : adbDetection.source,
        version: adbDetection.version
      },
      scrcpy: {
        path: customScrcpyPath || scrcpyDetection.path || 'Not found',
        isCustom: !!customScrcpyPath,
        bundledPath: this.getBundledBinaryPath('scrcpy'),
        source: customScrcpyPath ? 'custom' : scrcpyDetection.source,
        version: scrcpyDetection.version
      }
    };
  }

  async getDetectionStatus(): Promise<Map<string, BinaryDetectionResult>> {
    const results = new Map<string, BinaryDetectionResult>();
    
    for (const requirement of BinaryDetector.getBinaryRequirements()) {
      const detection = await this.getOrDetectBinary(requirement.name);
      results.set(requirement.name, detection);
    }
    
    return results;
  }

  async refreshDetection(): Promise<void> {
    this.detectionCache.clear();
  }

  async needsDownload(): Promise<{ needed: boolean; binaries: string[] }> {
    const detectionStatus = await this.getDetectionStatus();
    const missingBinaries: string[] = [];
    
    for (const requirement of BinaryDetector.getBinaryRequirements()) {
      const detection = detectionStatus.get(requirement.name);
      if (!detection?.found) {
        missingBinaries.push(requirement.name);
      }
    }
    
    return {
      needed: missingBinaries.length > 0,
      binaries: missingBinaries
    };
  }

  async checkBinaryIntegrity(): Promise<{ adb: boolean; scrcpy: boolean; errors: string[] }> {
    const errors: string[] = [];
    let adbIntegrity = false;
    let scrcpyIntegrity = false;

    try {
      if (!PlatformUtils.isSupportedPlatform()) {
        errors.push(`Unsupported platform: ${PlatformUtils.getCurrentPlatform()}`);
        return { adb: false, scrcpy: false, errors };
      }

      const adbPath = await this.getAdbPath();
      adbIntegrity = await this.checkSingleBinaryIntegrity(adbPath, 'adb');
      if (!adbIntegrity) {
        errors.push(`ADB binary integrity check failed: ${adbPath}`);
      }

      const scrcpyPath = await this.getScrcpyPath();
      scrcpyIntegrity = await this.checkSingleBinaryIntegrity(scrcpyPath, 'scrcpy');
      if (!scrcpyIntegrity) {
        errors.push(`Scrcpy binary integrity check failed: ${scrcpyPath}`);
      }
    } catch (error) {
      errors.push(`Binary integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { adb: adbIntegrity, scrcpy: scrcpyIntegrity, errors };
  }

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

  private async getOrDetectBinary(binaryName: 'adb' | 'scrcpy'): Promise<BinaryDetectionResult> {
    if (this.detectionCache.has(binaryName)) {
      return this.detectionCache.get(binaryName)!;
    }

    let detection = await this.binaryDetector.detectSingleBinary(binaryName);

    this.detectionCache.set(binaryName, detection);
    
    return detection;
  }

  getBundledBinaryPath(binaryName: string): string {
    const platform = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path.join(
      this.extensionPath,
      'binaries',
      platform,
      `${binaryName}${extension}`
    );
  }

  private async validateBinary(binaryPath: string, binaryName: string): Promise<boolean> {
    try {
      const stats = await fs.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }

      if (PlatformUtils.supportsFeature('executable-permissions')) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
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

  private async checkSingleBinaryIntegrity(binaryPath: string, binaryName: string): Promise<boolean> {
    try {
      const stats = await fs.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }

      if (stats.size === 0) {
        return false;
      }

      const platform = PlatformUtils.getCurrentPlatform();
      
      if (platform === 'win32') {
        const expectedExtension = PlatformUtils.getBinaryExtension();
        if (expectedExtension && !binaryPath.endsWith(expectedExtension)) {
          return false;
        }
      } else {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          try {
            await PlatformUtils.makeExecutable(binaryPath);
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

