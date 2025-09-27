import { ChildProcess, spawn } from "child_process";
import { ProcessResult, ScrcpyOptions, ConnectionState, ScrcpyState } from "../types";
import { BinaryManager } from "./binaryManager";
import { Logger } from "./logger";
import { ErrorHandler } from "../utils/errorHandler";
import { PlatformUtils } from "../utils/platformUtils";

/**
 * Manages external process execution for ADB and scrcpy operations
 */
export class ProcessManager {
  private scrcpyProcess: ChildProcess | null = null;
  private managedProcesses: Set<ChildProcess> = new Set();
  private binaryManager: BinaryManager;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private connectionState: ConnectionState;
  private scrcpyState: ScrcpyState;

  constructor(binaryManager: BinaryManager, logger: Logger) {
    this.binaryManager = binaryManager;
    this.logger = logger;
    this.errorHandler = new ErrorHandler(logger);
    this.connectionState = {
      connected: false,
    };
    this.scrcpyState = {
      running: false,
    };
  }

  /**
   * Execute an ADB command with the given arguments
   */
  async executeAdbCommand(args: string[]): Promise<ProcessResult> {
    const adbPath = this.binaryManager.getAdbPath();

    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";

      this.logger.info(`Executing ADB command: ${adbPath} ${args.join(" ")}`);

      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"],
      });

      const process = spawn(adbPath, args, spawnOptions);

      this.managedProcesses.add(process);

      process.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        this.logger.logProcessOutput("adb", output);
      });

      process.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        this.logger.logProcessOutput("adb", output);
      });

      process.on("close", (code: number | null) => {
        this.managedProcesses.delete(process);
        const exitCode = code ?? -1;
        const success = exitCode === 0;

        const result: ProcessResult = {
          success,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode,
        };

        this.logger.info(`ADB command completed with exit code: ${exitCode}`);
        resolve(result);
      });

      process.on("error", (error: Error) => {
        this.managedProcesses.delete(process);
        this.logger.error(`ADB process error: ${error.message}`, error);

        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: -1,
        });
      });
    });
  }

  /**
   * Connect to an Android device via ADB using IP and port
   */
  async connectDevice(ip: string, port: string): Promise<boolean> {
    try {
      // Enhanced validation with better error handling
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, 'ip', 'IP address');
      if (!ipValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: ipValidation.error?.userMessage || 'Invalid IP address',
        };
        return false;
      }

      const portValidation = this.errorHandler.validateAndHandleInput(port, 'port', 'Port number');
      if (!portValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: portValidation.error?.userMessage || 'Invalid port number',
        };
        return false;
      }

      const target = `${ip}:${port}`;
      this.logger.info(`Attempting to connect to device at ${target}`);

      // Execute ADB connect command
      const result = await this.executeAdbCommand(["connect", target]);

      if (result.success) {
        // Check if connection was actually successful by parsing output
        const isConnected = this.parseConnectResult(result.stdout, target);
        
        if (isConnected) {
          this.connectionState = {
            connected: true,
            deviceIp: ip,
            devicePort: port,
            lastConnected: new Date(),
            connectionError: undefined,
          };
          this.logger.info(`Successfully connected to device at ${target}`);
          return true;
        } else {
          const error = this.extractConnectionError(result.stdout, result.stderr);
          this.connectionState = {
            connected: false,
            connectionError: error,
          };
          this.logger.error(`Failed to connect to device at ${target}: ${error}`);
          return false;
        }
      } else {
        const error = this.extractConnectionError(result.stdout, result.stderr);
        this.connectionState = {
          connected: false,
          connectionError: error,
        };
        this.logger.error(`ADB connect command failed: ${error}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connection attempt failed: ${errorMessage}`, error instanceof Error ? error : undefined);
      this.connectionState = {
        connected: false,
        connectionError: errorMessage,
      };
      return false;
    }
  }

  /**
   * Disconnect from the currently connected Android device
   */
  async disconnectDevice(): Promise<boolean> {
    try {
      if (!this.connectionState.connected || !this.connectionState.deviceIp || !this.connectionState.devicePort) {
        this.logger.info("No device currently connected");
        return true;
      }

      const target = `${this.connectionState.deviceIp}:${this.connectionState.devicePort}`;
      this.logger.info(`Attempting to disconnect from device at ${target}`);

      // Execute ADB disconnect command
      const result = await this.executeAdbCommand(["disconnect", target]);

      if (result.success) {
        this.connectionState = {
          connected: false,
          connectionError: undefined,
        };
        this.logger.info(`Successfully disconnected from device at ${target}`);
        return true;
      } else {
        const error = this.extractConnectionError(result.stdout, result.stderr);
        this.logger.error(`Failed to disconnect from device: ${error}`);
        // Still update connection state as disconnected since the command was attempted
        this.connectionState = {
          connected: false,
          connectionError: error,
        };
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Disconnect attempt failed: ${errorMessage}`, error instanceof Error ? error : undefined);
      this.connectionState = {
        connected: false,
        connectionError: errorMessage,
      };
      return false;
    }
  }

  /**
   * Check if a device is currently connected and reachable
   */
  async checkDeviceConnectivity(): Promise<boolean> {
    try {
      this.logger.info("Checking device connectivity");

      // Get list of connected devices
      const result = await this.executeAdbCommand(["devices"]);

      if (!result.success) {
        this.logger.error("Failed to check device connectivity");
        this.connectionState = {
          ...this.connectionState,
          connected: false,
          connectionError: "Failed to query ADB devices",
        };
        return false;
      }

      // Parse devices output to check if our device is still connected
      const isConnected = this.parseDevicesOutput(result.stdout);
      
      if (isConnected !== this.connectionState.connected) {
        this.connectionState = {
          ...this.connectionState,
          connected: isConnected,
          connectionError: isConnected ? undefined : "Device no longer connected",
        };
        this.logger.info(`Device connectivity status updated: ${isConnected ? "connected" : "disconnected"}`);
      }

      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connectivity check failed: ${errorMessage}`, error instanceof Error ? error : undefined);
      this.connectionState = {
        ...this.connectionState,
        connected: false,
        connectionError: errorMessage,
      };
      return false;
    }
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if a device is currently connected
   */
  isDeviceConnected(): boolean {
    return this.connectionState.connected;
  }

  /**
   * Launch scrcpy with optional configuration
   */
  async launchScrcpy(options?: ScrcpyOptions): Promise<ChildProcess> {
    return this.launchScrcpyWithCustomArgs(options);
  }

  /**
   * Stop the current scrcpy process
   */
  async stopScrcpy(): Promise<boolean> {
    if (!this.scrcpyProcess) {
      // Update state to ensure it's marked as not running
      this.scrcpyState = {
        running: false,
      };
      return true; // Already stopped
    }

    return new Promise((resolve) => {
      const process = this.scrcpyProcess!;

      this.logger.info("Stopping scrcpy process");

      const cleanup = () => {
        this.managedProcesses.delete(process);
        this.scrcpyProcess = null;
        
        // Update state to indicate scrcpy has stopped
        this.scrcpyState = {
          running: false,
        };
        
        this.logger.info("Scrcpy process stopped successfully");
        resolve(true);
      };

      // Set up timeout for forceful termination
      const timeout = setTimeout(() => {
        if (process && !process.killed) {
          this.logger.info("Force killing scrcpy process");
          const forceKillSignal = PlatformUtils.getForceKillSignal();
          process.kill(forceKillSignal);
        }
        cleanup();
      }, 3000);

      process.on("close", () => {
        clearTimeout(timeout);
        cleanup();
      });

      // Try graceful termination first
      if (process && !process.killed) {
        const terminationSignal = PlatformUtils.getTerminationSignal();
        process.kill(terminationSignal);
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
    const processRunning = this.scrcpyProcess !== null && !this.scrcpyProcess.killed;
    
    // Sync state with actual process status
    if (this.scrcpyState.running !== processRunning) {
      this.scrcpyState = {
        ...this.scrcpyState,
        running: processRunning,
      };
    }
    
    return processRunning;
  }

  /**
   * Get the current scrcpy state
   */
  getScrcpyState(): ScrcpyState {
    // Ensure state is synchronized with actual process status
    this.isScrcpyRunning();
    return { ...this.scrcpyState };
  }

  /**
   * Get scrcpy process uptime in milliseconds
   */
  getScrcpyUptime(): number | null {
    if (!this.isScrcpyRunning() || !this.scrcpyState.startTime) {
      return null;
    }
    
    return Date.now() - this.scrcpyState.startTime.getTime();
  }

  /**
   * Monitor scrcpy process health and update state accordingly
   */
  monitorScrcpyProcess(): void {
    if (!this.scrcpyProcess) {
      return;
    }

    const process = this.scrcpyProcess;
    
    // Check if process is still alive
    if (process.killed || process.exitCode !== null) {
      this.logger.info("Detected scrcpy process termination during monitoring");
      
      // Clean up references and update state
      this.managedProcesses.delete(process);
      this.scrcpyProcess = null;
      this.scrcpyState = {
        running: false,
      };
    }
  }

  /**
   * Clean up all managed processes
   */
  async cleanup(): Promise<void> {
    this.logger.info("Cleaning up all managed processes");

    const cleanupPromises: Promise<void>[] = [];

    // Stop scrcpy if running
    if (this.isScrcpyRunning()) {
      cleanupPromises.push(this.stopScrcpy().then(() => {}));
    }

    // Kill any remaining managed processes
    for (const process of this.managedProcesses) {
      if (!process.killed) {
        cleanupPromises.push(
          new Promise((resolve) => {
            process.on("close", () => resolve());
            const terminationSignal = PlatformUtils.getTerminationSignal();
            process.kill(terminationSignal);

            // Force kill after timeout
            setTimeout(() => {
              if (!process.killed) {
                const forceKillSignal = PlatformUtils.getForceKillSignal();
                process.kill(forceKillSignal);
              }
              resolve();
            }, 2000);
          })
        );
      }
    }

    await Promise.all(cleanupPromises);
    this.managedProcesses.clear();
    this.scrcpyProcess = null;
    
    // Reset scrcpy state
    this.scrcpyState = {
      running: false,
    };

    this.logger.info("Process cleanup completed");
  }

  /**
   * Validate IP address format
   */
  private isValidIpAddress(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Validate port number
   */
  private isValidPort(port: string): boolean {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  }

  /**
   * Parse the result of ADB connect command to determine if connection was successful
   */
  private parseConnectResult(stdout: string, target: string): boolean {
    const output = stdout.toLowerCase();
    
    // Check for success indicators
    if (output.includes("connected to") || output.includes("already connected")) {
      return true;
    }
    
    // Check for failure indicators
    if (output.includes("failed to connect") || 
        output.includes("cannot connect") || 
        output.includes("connection refused") ||
        output.includes("no route to host") ||
        output.includes("timeout")) {
      return false;
    }
    
    // If output is unclear, assume failure for safety
    return false;
  }

  /**
   * Parse ADB devices output to check if our target device is connected
   */
  private parseDevicesOutput(stdout: string): boolean {
    if (!this.connectionState.deviceIp || !this.connectionState.devicePort) {
      return false;
    }

    const target = `${this.connectionState.deviceIp}:${this.connectionState.devicePort}`;
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith(target) && trimmedLine.includes("device")) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract meaningful error message from ADB command output
   */
  private extractConnectionError(stdout: string, stderr: string): string {
    const output = (stdout + " " + stderr).toLowerCase();
    
    if (output.includes("connection refused")) {
      return "Connection refused. Make sure the device is reachable and ADB debugging is enabled.";
    }
    
    if (output.includes("no route to host")) {
      return "No route to host. Check the IP address and network connectivity.";
    }
    
    if (output.includes("timeout") || output.includes("timed out")) {
      return "Connection timeout. The device may be unreachable or busy.";
    }
    
    if (output.includes("failed to connect")) {
      return "Failed to connect to device. Verify the IP address and port are correct.";
    }
    
    if (output.includes("cannot connect")) {
      return "Cannot connect to device. Check if wireless debugging is enabled.";
    }
    
    if (output.includes("device offline")) {
      return "Device is offline. Try reconnecting the device.";
    }
    
    if (output.includes("unauthorized")) {
      return "Device unauthorized. Please accept the debugging authorization on your device.";
    }
    
    // Return the raw output if no specific error pattern is found
    const errorOutput = stderr.trim() || stdout.trim();
    return errorOutput || "Unknown connection error occurred.";
  }

  /**
   * Launch scrcpy with screen off functionality
   */
  async launchScrcpyScreenOff(options?: ScrcpyOptions): Promise<ChildProcess> {
    const screenOffOptions: ScrcpyOptions = {
      ...options,
    };
    
    // Add screen off arguments by modifying the args building process
    this.logger.info("Launching scrcpy with screen off functionality");
    
    return this.launchScrcpyWithCustomArgs(screenOffOptions, ["--turn-screen-off"]);
  }

  /**
   * Launch scrcpy with custom additional arguments
   */
  private async launchScrcpyWithCustomArgs(options?: ScrcpyOptions, additionalArgs: string[] = []): Promise<ChildProcess> {
    if (this.isScrcpyRunning()) {
      throw new Error(
        "Scrcpy is already running. Stop the current instance first."
      );
    }

    const scrcpyPath = this.binaryManager.getScrcpyPath();
    const args = [...this.buildScrcpyArgs(options), ...additionalArgs];

    this.logger.info(`Launching scrcpy: ${scrcpyPath} ${args.join(" ")}`);

    // Update state to indicate scrcpy is starting
    this.scrcpyState = {
      running: false,
      startTime: new Date(),
      options: options ? { ...options } : undefined,
    };

    return new Promise((resolve, reject) => {
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"],
        detached: false,
      });

      const process = spawn(scrcpyPath, args, spawnOptions);

      this.scrcpyProcess = process;
      this.managedProcesses.add(process);

      let hasResolved = false;

      // Handle process startup
      const onData = (data: Buffer) => {
        const output = data.toString();
        this.logger.logProcessOutput("scrcpy", output);

        // Consider scrcpy successfully started if we get any output
        if (!hasResolved) {
          hasResolved = true;
          
          // Update state to indicate scrcpy is now running
          this.scrcpyState = {
            running: true,
            process: process,
            startTime: this.scrcpyState.startTime,
            options: this.scrcpyState.options,
          };
          
          this.logger.info("Scrcpy process started successfully");
          resolve(process);
        }
      };

      process.stdout?.on("data", onData);
      process.stderr?.on("data", onData);

      process.on("close", (code: number | null) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
          
          // Update state to indicate scrcpy has stopped
          this.scrcpyState = {
            running: false,
          };
        }
        this.logger.info(`Scrcpy process closed with exit code: ${code}`);
      });

      process.on("error", (error: Error) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
          
          // Update state to indicate scrcpy failed to start
          this.scrcpyState = {
            running: false,
          };
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
          
          // Update state to indicate scrcpy failed to start
          this.scrcpyState = {
            running: false,
          };
          
          reject(new Error("Scrcpy failed to start within timeout period"));
        }
      }, 5000);
    });
  }

  /**
   * Build command line arguments for scrcpy based on options
   */
  private buildScrcpyArgs(options?: ScrcpyOptions): string[] {
    const args: string[] = [];

    if (options?.bitrate) {
      args.push("--bit-rate", options.bitrate.toString());
    }

    if (options?.maxSize) {
      args.push("--max-size", options.maxSize.toString());
    }

    if (options?.crop) {
      args.push("--crop", options.crop);
    }

    if (options?.recordFile) {
      args.push("--record", options.recordFile);
    }

    return args;
  }
}
