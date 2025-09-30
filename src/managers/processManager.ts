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
    let adbPath: string;
    try {
      adbPath = await this.binaryManager.getAdbPath();
    } catch (error) {
      // Fallback to sync method for backward compatibility
      adbPath = (this.binaryManager as any).getAdbPathSync?.() || this.binaryManager.getBundledBinaryPath?.('adb') || 'adb';
    }

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
   * Pair with a device over Wi‑Fi (Android 11+ wireless debugging)
   * Expects pairing code (6 digits) and host:port of pairing service (usually shown in device Wireless debugging screen)
   */
  async pairDevice(pairingCode: string, host: string, port: string, attempt = 0): Promise<{ success: boolean; message: string }> {
    try {
      const code = pairingCode.trim();
      if (!/^[0-9]{6}$/.test(code)) {
        return { success: false, message: 'Invalid pairing code. Expected 6 digits.' };
      }
      const target = `${host}:${port}`;
      this.logger.info(`Attempting ADB pairing with ${target}`);
      
      // Execute with timeout to prevent hanging
      const result = await this.executeAdbCommandWithTimeout(['pair', target, code], 30000);
      
      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const combined = `${stdout} ${stderr}`.toLowerCase();
      
      // Check for successful pairing first (most important)
      const indicatesSuccess = /successfully paired|pairing code accepted/i.test(stdout);
      
      // Check for protocol fault - this specific message usually indicates failure
      const hasProtocolFault = /protocol fault.*couldn't read status message/i.test(stderr);
      const hasSuccessInFault = hasProtocolFault && /success/i.test(stderr);
      
      // Check for clear failure indicators
      const indicatesFailure = /failed|unable|timeout|refused|unreachable|invalid|incorrect/i.test(combined);
      
      // The "protocol fault (couldn't read status message): Success" pattern is usually a failure
      // despite containing "Success" - it indicates communication broke down during handshake
      let isProtocolFaultSuccess = false;
      if (hasSuccessInFault && !indicatesFailure && !indicatesSuccess) {
  this.logger.info('Protocol fault with Success detected - verifying pairing status...');
        // Give Android a moment to process the pairing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if device appears in paired devices list
        const verifyResult = await this.executeAdbCommandWithTimeout(['devices'], 5000);
        const baseIp = target.split(':')[0];
        const hasDeviceInList = verifyResult.stdout.includes(baseIp) || 
                               verifyResult.stdout.includes('device') ||
                               verifyResult.stdout.includes('unauthorized'); // unauthorized means paired but not authorized
        
        this.logger.info(`Pairing verification: devices output contains connection = ${hasDeviceInList}`);
        
        // Only consider it successful if we can actually see the device or connect to it
        if (hasDeviceInList) {
          isProtocolFaultSuccess = true;
        } else {
          // Double-check by trying a quick connection attempt
          this.logger.info('No device found in list, attempting connection verification...');
          isProtocolFaultSuccess = await this.tryQuickConnectVerification(baseIp);
          this.logger.info(`Connection verification result: ${isProtocolFaultSuccess}`);
        }
      }

      this.logger.info(`Pairing result - Exit: ${result.exitCode}, Success: ${result.success}`);
      this.logger.info(`Stdout: ${stdout}`);
      this.logger.info(`Stderr: ${stderr}`);
      this.logger.info(`Success detected: ${indicatesSuccess}, Failure detected: ${indicatesFailure}, Protocol fault with success: ${isProtocolFaultSuccess}`);

      if (indicatesSuccess || isProtocolFaultSuccess) {
        this.logger.info(`Successfully paired with ${target}`);
        const baseIp = target.split(':')[0];
        
        // For protocol fault cases, try to verify pairing worked by attempting connection
        if (isProtocolFaultSuccess && !indicatesSuccess) {
          this.logger.info('Verifying protocol fault pairing by attempting connection...');
          const verifyConnection = await this.tryQuickConnectVerification(baseIp);
          if (!verifyConnection) {
            this.logger.error('Protocol fault pairing verification failed - treating as failure');
            if (attempt < 1) {
              this.logger.info('Restarting ADB server and retrying pairing once more due to protocol fault...');
              await this.restartAdbServer();
              await new Promise(resolve => setTimeout(resolve, 1500));
              return this.pairDevice(pairingCode, host, port, attempt + 1);
            }
            return { 
              success: false, 
              message: 'Pairing failed - the protocol fault indicates communication was interrupted. The pairing code popup is likely still showing on your device. Please:\n1. Dismiss the current pairing popup\n2. Generate a new pairing code\n3. Try pairing again immediately while the code is fresh\n4. Ensure both devices stay connected to Wi-Fi during pairing' 
            };
          }
        }
        
        const cleanMessage = stdout.split('\n').find(line => line.includes('Successfully paired')) || 
                            (isProtocolFaultSuccess ? 
                              `✅ Paired successfully! The pairing code popup should have disappeared on your device. Check "Paired devices" for the ADB port, then use the Connect section above.` : 
                              `✅ Paired successfully! Check your device's "Paired devices" section for the ADB port (usually 5555), then use the Connect section above.`);
        return { success: true, message: cleanMessage };
      }

      // If we get here, pairing failed
      let errorMsg = stderr || stdout || 'Pairing failed';
      if (combined.includes('timeout') || (!stdout && !stderr)) {
        errorMsg = 'Pairing timed out. The pairing code may have expired. Generate a new pairing code on your device and try again.';
      } else if (combined.includes('refused')) {
        errorMsg = 'Connection refused. Make sure Wireless debugging is enabled and the pairing service is running on your device.';
      } else if (combined.includes('unreachable')) {
        errorMsg = 'Host unreachable. Verify the IP address and ensure both devices are connected to the same Wi-Fi network.';
      } else if (combined.includes('invalid') || combined.includes('incorrect')) {
        errorMsg = 'Invalid pairing code. The 6-digit code may have expired or been mistyped. Generate a fresh code on your device.';
      } else if (hasProtocolFault && hasSuccessInFault) {
        errorMsg = 'Pairing communication failed (protocol fault). This happens when the pairing code expires during the handshake or there\'s a network interruption. The pairing popup should still be visible on your device. Please generate a fresh pairing code and try again.';
        if (attempt < 1) {
          this.logger.info('Protocol fault detected with failure - restarting ADB server and retrying pairing once.');
          await this.restartAdbServer();
          await new Promise(resolve => setTimeout(resolve, 1500));
          return this.pairDevice(pairingCode, host, port, attempt + 1);
        }
      } else if (hasProtocolFault) {
        errorMsg = 'Protocol fault occurred during pairing. This usually means the pairing code expired or there was a network issue. Please generate a new pairing code and try again.';
      }

      this.logger.error(`Pairing failed: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error during pairing';
      this.logger.error('Pairing error', e as any);
      return { success: false, message };
    }
  }

  /**
   * Quick verification to check if pairing actually worked by attempting connection
   */
  private async tryQuickConnectVerification(ip: string): Promise<boolean> {
    const commonPorts = ['5555', '5556', '37115'];
    
    for (const port of commonPorts) {
      try {
        const result = await this.executeAdbCommandWithTimeout(['connect', `${ip}:${port}`], 5000);
        if (result.stdout.includes('connected') || result.stdout.includes('already connected')) {
          // Disconnect immediately after verification
          await this.executeAdbCommandWithTimeout(['disconnect', `${ip}:${port}`], 3000);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  /**
   * Restart the ADB server to recover from protocol faults
   */
  private async restartAdbServer(): Promise<void> {
    this.logger.info('Restarting ADB server (kill-server → start-server)');
    await this.executeAdbCommandWithTimeout(['kill-server'], 5000).catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.executeAdbCommandWithTimeout(['start-server'], 5000).catch(() => undefined);
  }

  /**
   * Attempt to auto-connect after successful pairing using common ADB ports
   */
  async tryAutoConnectAfterPairing(ip: string): Promise<{success: boolean, message: string, connectedPort?: string}> {
    const commonPorts = ['5555', '5556', '37115']; // Common ADB ports
    
    this.logger.info(`Attempting auto-connection to ${ip} on common ports...`);
    
    for (const port of commonPorts) {
      try {
        this.logger.info(`Trying ${ip}:${port}...`);
        const connected = await this.connectDevice(ip, port);
        if (connected) {
          return { 
            success: true, 
            message: `🎉 Auto-connected to ${ip}:${port}! Device is ready for debugging.`,
            connectedPort: port
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to connect to ${ip}:${port}: ${error}`);
        continue;
      }
    }
    
    return {
      success: false,
      message: `Could not auto-connect. Please check your device's "Paired devices" section for the correct port and connect manually.`
    };
  }

  /**
   * Execute ADB command with timeout to prevent hanging
   */
  private async executeAdbCommandWithTimeout(args: string[], timeoutMs: number): Promise<ProcessResult> {
    return new Promise(async (resolve) => {
      let isResolved = false;
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: false,
            stdout: '',
            stderr: 'Command timed out',
            exitCode: -1
          });
        }
      }, timeoutMs);

      try {
        const result = await this.executeAdbCommand(args);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            success: false,
            stdout: '',
            stderr: error instanceof Error ? error.message : 'Unknown error',
            exitCode: -1
          });
        }
      }
    });
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
   * Launch scrcpy optimized for sidebar embedding
   */
  async launchScrcpySidebar(options?: ScrcpyOptions): Promise<{ success: boolean; message?: string; processId?: number; windowId?: string }> {
    try {
      const sidebarOptions: ScrcpyOptions = {
        ...options,
        maxSize: 400, // Smaller resolution for sidebar
        bitrate: 2000000 // Lower bitrate for better performance in sidebar
      };
      
      this.logger.info("Launching scrcpy optimized for sidebar");
      
      const process = await this.launchScrcpyWithCustomArgs(sidebarOptions, [
        "--window-width=300",
        "--window-height=400", 
        "--window-x=0",
        "--window-y=0",
        "--stay-awake",
        "--window-title=DroidBridge Sidebar",
        "--always-on-top"
      ]);
      
      return {
        success: true,
        message: "Scrcpy launched for sidebar",
        processId: process.pid,
        windowId: `scrcpy-sidebar-${process.pid}`
      };
    } catch (error) {
      this.logger.error("Failed to launch scrcpy for sidebar", error instanceof Error ? error : undefined);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error launching scrcpy for sidebar"
      };
    }
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

    let scrcpyPath: string;
    try {
      scrcpyPath = await this.binaryManager.getScrcpyPath();
    } catch (error) {
      // Fallback to sync method for backward compatibility
      scrcpyPath = (this.binaryManager as any).getScrcpyPathSync?.() || this.binaryManager.getBundledBinaryPath?.('scrcpy') || 'scrcpy';
    }
    
    // Build base args and add device selection logic
    let args = [...this.buildScrcpyArgs(options), ...additionalArgs];
    
    // Add device selection if multiple devices are available
    const deviceArgs = await this.getDeviceSelectionArgs();
    if (deviceArgs.length > 0) {
      args = [...deviceArgs, ...args];
      this.logger.info(`Added device selection: ${deviceArgs.join(' ')}`);
    }

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
   * Get device selection arguments for scrcpy when multiple devices are available
   */
  private async getDeviceSelectionArgs(): Promise<string[]> {
    try {
      const result = await this.executeAdbCommand(["devices"]);
      
      if (!result.success) {
        this.logger.error('Failed to get device list for scrcpy selection');
        return [];
      }

      // Parse devices from ADB output
      const devices = this.parseAllDevices(result.stdout);
      
      if (devices.length <= 1) {
        return []; // No selection needed
      }

      this.logger.info(`Multiple devices found (${devices.length}), selecting device for scrcpy...`);
      
      // Prefer wireless/TCP devices over USB when both are available
      const wirelessDevice = devices.find(device => device.includes(':'));
      
      if (wirelessDevice) {
        this.logger.info(`Selected wireless device: ${wirelessDevice}`);
        return ['-s', wirelessDevice];
      }
      
      // Fallback to first device
      this.logger.info(`Selected first available device: ${devices[0]}`);
      return ['-s', devices[0]];
      
    } catch (error) {
      this.logger.error('Failed to get device selection args:', error instanceof Error ? error : new Error(String(error)));
      return []; // Continue without device selection
    }
  }

  /**
   * Parse all connected devices from ADB devices output
   */
  private parseAllDevices(stdout: string): string[] {
    const devices: string[] = [];
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('List of devices') && trimmedLine.includes('\t')) {
        const parts = trimmedLine.split('\t');
        if (parts.length >= 2 && parts[1].includes('device')) {
          devices.push(parts[0]);
        }
      }
    }
    
    return devices;
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
