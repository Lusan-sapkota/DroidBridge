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

export class BinaryDownloader {
  private downloadDir: string;
  private progressCallback?: (progress: DownloadProgress) => void;

  constructor(downloadDir: string) {
    this.downloadDir = downloadDir;
  }

  setProgressCallback(callback: (progress: DownloadProgress) => void): void {
    this.progressCallback = callback;
  }

  async downloadBinaries(requirements: BinaryRequirement[]): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];

    await this.ensureDownloadDirectory();

    for (const requirement of requirements) {
      const result = await this.downloadSingleBinary(requirement);
      results.push(result);
    }

    return results;
  }

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

      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      await this.downloadFile(downloadUrl, outputPath, requirement.name);

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

  async isBinaryDownloaded(binaryName: string): Promise<boolean> {
    try {
      const outputPath = this.getOutputPath(binaryName);
      await fs.access(outputPath);
      
      if (PlatformUtils.supportsFeature('executable-permissions')) {
        return await PlatformUtils.isExecutable(outputPath);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  getDownloadedBinaryPath(binaryName: string): string {
    return this.getOutputPath(binaryName);
  }

  async cleanupDownloads(): Promise<void> {
    try {
      await fs.rm(this.downloadDir, { recursive: true, force: true });
    } catch (error) {
    }
  }

  private getDownloadUrl(requirement: BinaryRequirement): string {
    const platform = PlatformUtils.getCurrentPlatform();
    const arch = PlatformUtils.getCurrentArchitecture();
    
    const configUrl = getDownloadUrl(requirement.name, 'github');
    if (configUrl) {
      const fileName = getBinaryPattern(requirement.name, platform, arch);
      return `${configUrl}/${fileName}`;
    }
    
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

  private getOutputPath(binaryName: string): string {
    const platform = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path.join(this.downloadDir, platform, `${binaryName}${extension}`);
  }

  private async ensureDownloadDirectory(): Promise<void> {
    const platform = PlatformUtils.getCurrentPlatform();
    const platformDir = path.join(this.downloadDir, platform);
    await fs.mkdir(platformDir, { recursive: true });
  }

  private async downloadFile(url: string, outputPath: string, binaryName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
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
          fs.unlink(outputPath).catch(() => {});
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