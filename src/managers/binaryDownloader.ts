import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { PlatformUtils } from '../utils/platformUtils';
import { BinaryRequirement } from './binaryDetector';
import { getBinaryPattern, getDownloadUrl } from '../config/binaryConfig';

export interface DownloadProgress {
  binary: string;
  downloaded: number;
  total: number;
  percentage: number;
}

export interface DownloadResult {
  success: boolean;
  binary: string;
  path?: string;
  error?: string;
}

/**
 * Downloads and manages binary files from external sources
 */
export class BinaryDownloader {
  private downloadDir: string;
  private progressCallback?: (progress: DownloadProgress) => void;

  constructor(downloadDir: string) {
    this.downloadDir = downloadDir;
  }

  /**
   * Set progress callback for download updates
   */
  setProgressCallback(callback: (progress: DownloadProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Download multiple binaries
   */
  async downloadBinaries(requirements: BinaryRequirement[]): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];

    // Ensure download directory exists
    await this.ensureDownloadDirectory();

    for (const requirement of requirements) {
      const result = await this.downloadSingleBinary(requirement);
      results.push(result);
    }

    return results;
  }

  /**
   * Download a single binary
   */
  async downloadSingleBinary(requirement: BinaryRequirement): Promise<DownloadResult> {
    try {
      if (!requirement.downloadUrl) {
        return {
          success: false,
          binary: requirement.name,
          error: 'No download URL provided'
        };
      }

      const downloadUrl = this.getDownloadUrl(requirement);
      const outputPath = this.getOutputPath(requirement.name);

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Download the binary
      await this.downloadFile(downloadUrl, outputPath, requirement.name);

      // Make executable on Unix systems
      if (PlatformUtils.supportsFeature('executable-permissions')) {
        await PlatformUtils.makeExecutable(outputPath);
      }

      return {
        success: true,
        binary: requirement.name,
        path: outputPath
      };
    } catch (error) {
      return {
        success: false,
        binary: requirement.name,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if a binary is already downloaded
   */
  async isBinaryDownloaded(binaryName: string): Promise<boolean> {
    try {
      const outputPath = this.getOutputPath(binaryName);
      await fs.access(outputPath);
      
      // Check if it's executable on Unix systems
      if (PlatformUtils.supportsFeature('executable-permissions')) {
        return await PlatformUtils.isExecutable(outputPath);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the path where a binary would be downloaded
   */
  getDownloadedBinaryPath(binaryName: string): string {
    return this.getOutputPath(binaryName);
  }

  /**
   * Clean up downloaded binaries
   */
  async cleanupDownloads(): Promise<void> {
    try {
      await fs.rm(this.downloadDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  }

  /**
   * Get download URLs based on platform and binary
   */
  private getDownloadUrl(requirement: BinaryRequirement): string {
    const platform = PlatformUtils.getCurrentPlatform();
    const arch = PlatformUtils.getCurrentArchitecture();
    
    // Try to get configured download URL
    const configUrl = getDownloadUrl(requirement.name, 'github');
    if (configUrl) {
      const fileName = getBinaryPattern(requirement.name, platform, arch);
      return `${configUrl}/${fileName}`;
    }
    
    // Fallback to requirement URL
    if (requirement.downloadUrl) {
      const extension = PlatformUtils.getBinaryExtension();
      const fileName = `${requirement.name}-${platform}-${arch}${extension}`;
      
      if (requirement.downloadUrl.includes('github.com')) {
        return `${requirement.downloadUrl}/${fileName}`;
      } else {
        return `${requirement.downloadUrl}/${fileName}`;
      }
    }
    
    throw new Error(`No download URL configured for ${requirement.name}`);
  }

  /**
   * Get the output path for a binary
   */
  private getOutputPath(binaryName: string): string {
    const platform = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path.join(this.downloadDir, platform, `${binaryName}${extension}`);
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDownloadDirectory(): Promise<void> {
    const platform = PlatformUtils.getCurrentPlatform();
    const platformDir = path.join(this.downloadDir, platform);
    await fs.mkdir(platformDir, { recursive: true });
  }

  /**
   * Download a file from URL to local path
   */
  private async downloadFile(url: string, outputPath: string, binaryName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.downloadFile(redirectUrl, outputPath, binaryName)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        const fileStream = createWriteStream(outputPath);
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          
          if (this.progressCallback && totalSize > 0) {
            this.progressCallback({
              binary: binaryName,
              downloaded: downloadedSize,
              total: totalSize,
              percentage: Math.round((downloadedSize / totalSize) * 100)
            });
          }
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (error) => {
          fs.unlink(outputPath).catch(() => {}); // Clean up on error
          reject(error);
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }
}