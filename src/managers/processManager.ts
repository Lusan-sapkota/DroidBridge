import { ChildProcess, spawn } from "child_process";
import { ProcessResult, ScrcpyOptions, ConnectionState } from "../types";
import { BinaryManager } from "./binaryManager";
import { Logger } from "./logger";

/**
 * Manages external process execution for ADB and scrcpy operations
 */
export class ProcessManager {
  private scrcpyProcess: ChildProcess | null = null;
  private managedProcesses: Set<ChildProcess> = new Set();
  private binaryManager: BinaryManager;
  private logger: Logger;
  private connectionState: ConnectionState;

  constructor(binaryManager: BinaryManager, logger: Logger) {
    this.binaryManager = binaryManager;
    this.logger = logger;
    this.connectionState = {
      connected: false,
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

      const process = spawn(adbPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });

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
      // Validate IP and port format
      if (!this.isValidIpAddress(ip)) {
        const error = `Invalid IP address format: ${ip}`;
        this.logger.error(error);
        this.connectionState = {
          connected: false,
          connectionError: error,
        };
        return false;
      }

      if (!this.isValidPort(port)) {
        const error = `Invalid port number: ${port}. Port must be between 1 and 65535.`;
        this.logger.error(error);
        this.connectionState = {
          connected: false,
          connectionError: error,
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
    if (this.isScrcpyRunning()) {
      throw new Error(
        "Scrcpy is already running. Stop the current instance first."
      );
    }

    const scrcpyPath = this.binaryManager.getScrcpyPath();
    const args = this.buildScrcpyArgs(options);

    this.logger.info(`Launching scrcpy: ${scrcpyPath} ${args.join(" ")}`);

    return new Promise((resolve, reject) => {
      const process = spawn(scrcpyPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        detached: false,
      });

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
          resolve(process);
        }
      };

      process.stdout?.on("data", onData);
      process.stderr?.on("data", onData);

      process.on("close", (code: number | null) => {
        this.managedProcesses.delete(process);
        if (this.scrcpyProcess === process) {
          this.scrcpyProcess = null;
        }
        this.logger.info(`Scrcpy process closed with exit code: ${code}`);
      });

      process.on("error", (error: Error) => {
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
          reject(new Error("Scrcpy failed to start within timeout period"));
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

      this.logger.info("Stopping scrcpy process");

      const cleanup = () => {
        this.managedProcesses.delete(process);
        this.scrcpyProcess = null;
        resolve(true);
      };

      // Set up timeout for forceful termination
      const timeout = setTimeout(() => {
        if (process && !process.killed) {
          this.logger.info("Force killing scrcpy process");
          process.kill("SIGKILL");
        }
        cleanup();
      }, 3000);

      process.on("close", () => {
        clearTimeout(timeout);
        cleanup();
      });

      // Try graceful termination first
      if (process && !process.killed) {
        process.kill("SIGTERM");
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
            process.kill("SIGTERM");

            // Force kill after timeout
            setTimeout(() => {
              if (!process.killed) {
                process.kill("SIGKILL");
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
