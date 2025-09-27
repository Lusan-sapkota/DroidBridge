import { ChildProcess, spawn } from 'child_process';
import { ProcessResult, ScrcpyOptions } from '../types';
import { BinaryManager } from './binaryManager';
import { Logger } from './logger';

/**
 * Manages external process execution for ADB and scrcpy operations
 */
export class ProcessManager {
  private scrcpyProcess: ChildProcess | null = null;
  private managedProcesses: Set<ChildProcess> = new Set();
  private binaryManager: BinaryManager;
  private logger: Logger;

  constructor(binaryManager: BinaryManager, logger: Logger) {
    this.binaryManager = binaryManager;
    this.logger = logger;
  }

  /**
   * Execute an ADB command with the given arguments
   */
  async executeAdbCommand(args: string[]): Promise<ProcessResult> {
    const adbPath = this.binaryManager.getAdbPath();
    
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      this.logger.info(`Executing ADB command: ${adbPath} ${args.join(' ')}`);
      
      const process = spawn(adbPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.managedProcesses.add(process);

      process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        this.logger.logProcessOutput('adb', output);
      });

      process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        this.logger.logProcessOutput('adb', output);
      });

      process.on('close', (code: number | null) => {
        this.managedProcesses.delete(process);
        const exitCode = code ?? -1;
        const success = exitCode === 0;
        
        const result: ProcessResult = {
          success,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode
        };

        this.logger.info(`ADB command completed with exit code: ${exitCode}`);
        resolve(result);
      });

      process.on('error', (error: Error) => {
        this.managedProcesses.delete(process);
        this.logger.error(`ADB process error: ${error.message}`, error);
        
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: -1
        });
      });
    });
  }

  /**
   * Launch scrcpy with optional configuration
   */
  async launchScrcpy(options?: ScrcpyOptions): Promise<ChildProcess> {
    if (this.isScrcpyRunning()) {
      throw new Error('Scrcpy is already running. Stop the current instance first.');
    }

    const scrcpyPath = this.binaryManager.getScrcpyPath();
    const args = this.buildScrcpyArgs(options);
    
    this.logger.info(`Launching scrcpy: ${scrcpyPath} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const process = spawn(scrcpyPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      this.scrcpyProcess = process;
      this.managedProcesses.add(process);

      let hasResolved = false;

      // Handle process startup
      const onData = (data: Buffer) => {
        const output = data.toString();
        this.logger.logProcessOutput('scrcpy', output);
        
        // Consider scrcpy successfully started if we get any output
        if (!hasResolved) {
          hasResolved = true;
          resolve(process);
        }
      };

      process.stdout?.on('data', onData);
      process.stderr?.on('data', onData);

      process.on('close', (code: number | null) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
        }
        this.logger.info(`Scrcpy process closed with exit code: ${code}`);
      });

      process.on('error', (error: Error) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
        }
        this.logger.error(`Scrcpy process error: ${error.message}`, error);
        
        if (!hasResolved) {
          hasResolved = true;
          reject(error);
        }
      });

      // Timeout for process startup
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error('Scrcpy failed to start within timeout period'));
        }
      }, 5000);
    });
  }

  /**
   * Stop the current scrcpy process
   */
  async stopScrcpy(): Promise<boolean> {
    if (!this.scrcpyProcess) {
      return true; // Already stopped
    }

    return new Promise((resolve) => {
      const process = this.scrcpyProcess!;
      
      this.logger.info('Stopping scrcpy process');

      const cleanup = () => {
        this.managedProcesses.delete(process);
        this.scrcpyProcess = null;
        resolve(true);
      };

      // Set up timeout for forceful termination
      const timeout = setTimeout(() => {
        if (process && !process.killed) {
          this.logger.info('Force killing scrcpy process');
          process.kill('SIGKILL');
        }
        cleanup();
      }, 3000);

      process.on('close', () => {
        clearTimeout(timeout);
        cleanup();
      });

      // Try graceful termination first
      if (process && !process.killed) {
        process.kill('SIGTERM');
      } else {
        clearTimeout(timeout);
        cleanup();
      }
    });
  }

  /**
   * Check if scrcpy is currently running
   */
  isScrcpyRunning(): boolean {
    return this.scrcpyProcess !== null && !this.scrcpyProcess.killed;
  }

  /**
   * Clean up all managed processes
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up all managed processes');
    
    const cleanupPromises: Promise<void>[] = [];

    // Stop scrcpy if running
    if (this.isScrcpyRunning()) {
      cleanupPromises.push(this.stopScrcpy().then(() => {}));
    }

    // Kill any remaining managed processes
    for (const process of this.managedProcesses) {
      if (!process.killed) {
        cleanupPromises.push(new Promise((resolve) => {
          process.on('close', () => resolve());
          process.kill('SIGTERM');
          
          // Force kill after timeout
          setTimeout(() => {
            if (!process.killed) {
              process.kill('SIGKILL');
            }
            resolve();
          }, 2000);
        }));
      }
    }

    await Promise.all(cleanupPromises);
    this.managedProcesses.clear();
    this.scrcpyProcess = null;
    
    this.logger.info('Process cleanup completed');
  }

  /**
   * Build command line arguments for scrcpy based on options
   */
  private buildScrcpyArgs(options?: ScrcpyOptions): string[] {
    const args: string[] = [];

    if (options?.bitrate) {
      args.push('--bit-rate', options.bitrate.toString());
    }

    if (options?.maxSize) {
      args.push('--max-size', options.maxSize.toString());
    }

    if (options?.crop) {
      args.push('--crop', options.crop);
    }

    if (options?.recordFile) {
      args.push('--record', options.recordFile);
    }

    return args;
  }
}