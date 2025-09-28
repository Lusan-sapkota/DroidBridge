import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PlatformUtils } from '../utils/platformUtils';
import { getBinaryConfig } from '../config/binaryConfig';

const execAsync = promisify(exec);

export interface BinaryDetectionResult {
  found: boolean;
  path?: string;
  version?: string;
  source: 'system' | 'downloaded' | 'custom' | 'not-found';
}

export interface BinaryRequirement {
  name: 'adb' | 'scrcpy';
  required: boolean;
  downloadUrl?: string;
  minVersion?: string;
}

/**
 * Detects installed binaries on the system and manages smart downloading
 */
export class BinaryDetector {
  private static readonly BINARY_REQUIREMENTS: BinaryRequirement[] = [
    {
      name: 'adb',
      required: true,
      downloadUrl: getBinaryConfig('adb')?.downloadUrls.github
    },
    {
      name: 'scrcpy',
      required: true,
      downloadUrl: getBinaryConfig('scrcpy')?.downloadUrls.github
    }
  ];

  private downloadDir: string;

  constructor(extensionPath: string) {
    this.downloadDir = path.join(extensionPath, 'downloaded-binaries');
  }

  /**
   * Detect all required binaries and determine what needs to be downloaded
   */
  async detectBinaries(): Promise<Map<string, BinaryDetectionResult>> {
    const results = new Map<string, BinaryDetectionResult>();

    for (const requirement of BinaryDetector.BINARY_REQUIREMENTS) {
      const result = await this.detectSingleBinary(requirement.name);
      results.set(requirement.name, result);
    }

    return results;
  }

  /**
   * Detect a single binary on the system
   */
  async detectSingleBinary(binaryName: 'adb' | 'scrcpy'): Promise<BinaryDetectionResult> {
    // First check if it's available in system PATH
    const systemResult = await this.checkSystemPath(binaryName);
    if (systemResult.found) {
      return systemResult;
    }

    // Check if we have a downloaded version
    const downloadedResult = await this.checkDownloadedBinary(binaryName);
    if (downloadedResult.found) {
      return downloadedResult;
    }

    // Check common installation paths
    const commonPathResult = await this.checkCommonPaths(binaryName);
    if (commonPathResult.found) {
      return commonPathResult;
    }

    return {
      found: false,
      source: 'not-found'
    };
  }

  /**
   * Get missing binaries that need to be downloaded
   */
  async getMissingBinaries(): Promise<BinaryRequirement[]> {
    const detectionResults = await this.detectBinaries();
    const missing: BinaryRequirement[] = [];

    for (const requirement of BinaryDetector.BINARY_REQUIREMENTS) {
      const result = detectionResults.get(requirement.name);
      if (!result?.found && requirement.required) {
        missing.push(requirement);
      }
    }

    return missing;
  }

  /**
   * Check if binary exists in system PATH
   */
  private async checkSystemPath(binaryName: string): Promise<BinaryDetectionResult> {
    try {
      const command = PlatformUtils.getCurrentPlatform() === 'win32' ? 'where' : 'which';
      const { stdout } = await execAsync(`${command} ${binaryName}`);
      
      const binaryPath = stdout.trim().split('\n')[0];
      if (binaryPath) {
        const version = await this.getBinaryVersion(binaryName, binaryPath);
        return {
          found: true,
          path: binaryPath,
          version,
          source: 'system'
        };
      }
    } catch (error) {
      // Binary not found in PATH
    }

    return { found: false, source: 'not-found' };
  }

  /**
   * Check if we have a downloaded version of the binary
   */
  private async checkDownloadedBinary(binaryName: string): Promise<BinaryDetectionResult> {
    try {
      const platform = PlatformUtils.getCurrentPlatform();
      const extension = PlatformUtils.getBinaryExtension();
      const binaryPath = path.join(this.downloadDir, platform, `${binaryName}${extension}`);
      
      await fs.access(binaryPath);
      
      // Verify it's executable
      if (PlatformUtils.supportsFeature('executable-permissions')) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          return { found: false, source: 'not-found' };
        }
      }

      const version = await this.getBinaryVersion(binaryName, binaryPath);
      return {
        found: true,
        path: binaryPath,
        version,
        source: 'downloaded'
      };
    } catch (error) {
      return { found: false, source: 'not-found' };
    }
  }

  /**
   * Check common installation paths for binaries
   */
  private async checkCommonPaths(binaryName: string): Promise<BinaryDetectionResult> {
    const platform = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    
    let commonPaths: string[] = [];

    switch (platform) {
      case 'win32':
        commonPaths = [
          `C:\\Program Files\\${binaryName}\\${binaryName}${extension}`,
          `C:\\Program Files (x86)\\${binaryName}\\${binaryName}${extension}`,
          `C:\\${binaryName}\\${binaryName}${extension}`,
          `C:\\tools\\${binaryName}\\${binaryName}${extension}`
        ];
        break;
      case 'darwin':
        commonPaths = [
          `/usr/local/bin/${binaryName}`,
          `/opt/homebrew/bin/${binaryName}`,
          `/Applications/${binaryName}/${binaryName}`,
          `${process.env.HOME}/bin/${binaryName}`
        ];
        break;
      case 'linux':
        commonPaths = [
          `/usr/bin/${binaryName}`,
          `/usr/local/bin/${binaryName}`,
          `/opt/${binaryName}/${binaryName}`,
          `${process.env.HOME}/.local/bin/${binaryName}`,
          `${process.env.HOME}/bin/${binaryName}`
        ];
        break;
    }

    for (const binaryPath of commonPaths) {
      try {
        await fs.access(binaryPath);
        
        // Verify it's executable on Unix systems
        if (PlatformUtils.supportsFeature('executable-permissions')) {
          const isExecutable = await PlatformUtils.isExecutable(binaryPath);
          if (!isExecutable) {
            continue;
          }
        }

        const version = await this.getBinaryVersion(binaryName, binaryPath);
        return {
          found: true,
          path: binaryPath,
          version,
          source: 'system'
        };
      } catch (error) {
        // Continue to next path
      }
    }

    return { found: false, source: 'not-found' };
  }

  /**
   * Get version information for a binary
   */
  private async getBinaryVersion(binaryName: string, binaryPath: string): Promise<string | undefined> {
    try {
      let versionCommand: string;
      
      switch (binaryName) {
        case 'adb':
          versionCommand = `"${binaryPath}" version`;
          break;
        case 'scrcpy':
          versionCommand = `"${binaryPath}" --version`;
          break;
        default:
          return undefined;
      }

      const { stdout } = await execAsync(versionCommand);
      
      // Extract version from output
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : stdout.trim().split('\n')[0];
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get the download directory path
   */
  getDownloadDir(): string {
    return this.downloadDir;
  }

  /**
   * Get binary requirements
   */
  static getBinaryRequirements(): BinaryRequirement[] {
    return [...BinaryDetector.BINARY_REQUIREMENTS];
  }
}