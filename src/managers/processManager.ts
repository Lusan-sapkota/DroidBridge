import { ChildProcess, spawn } from "child_process";
import { ProcessResult, ScrcpyOptions, ConnectionState, ScrcpyState } from "../types";
import { BinaryManager } from "./binaryManager";
import { Logger } from "./logger";
import { ErrorHandler } from "../utils/errorHandler";
import { PlatformUtils } from "../utils/platformUtils";

export interface QrPairingSessionResult {
  success: boolean;
  message?: string;
  payload?: string;
  host?: string;
  port?: string;
  code?: string;
  ssid?: string;
  adbPort?: string;
  expiresInSeconds?: number;
  process?: ChildProcess;
  rawOutput?: string;
}

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
  private qrPairingProcess: ChildProcess | null = null;
  private qrPairingTimeout?: NodeJS.Timeout;

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
  async pairDevice(pairingCode: string, host: string, port: string): Promise<{ success: boolean; message: string }> {
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
      
      // Only treat as failure if there's a clear failure message AND no success message
      const indicatesFailure = /failed|unable|timeout|refused|unreachable|invalid|incorrect/i.test(combined) && !indicatesSuccess;
      
      // Ignore protocol faults that occur after successful pairing
      const isProtocolFaultAfterSuccess = indicatesSuccess && /protocol fault/i.test(stderr);

      this.logger.info(`Pairing result - Exit: ${result.exitCode}, Success: ${result.success}`);
      this.logger.info(`Stdout: ${stdout}`);
      this.logger.info(`Stderr: ${stderr}`);
      this.logger.info(`Success detected: ${indicatesSuccess}, Failure detected: ${indicatesFailure}, Protocol fault: ${isProtocolFaultAfterSuccess}`);

      if (indicatesSuccess) {
        this.logger.info(`Successfully paired with ${target}`);
        const cleanMessage = stdout.split('\n').find(line => line.includes('Successfully paired')) || 'Paired successfully';
        return { success: true, message: cleanMessage };
      }

      // If we get here, pairing failed
      let errorMsg = stderr || stdout || 'Pairing failed';
      if (combined.includes('timeout') || (!stdout && !stderr)) {
        errorMsg = 'Pairing timed out. Check if the pairing code is still valid and the device is reachable.';
      } else if (combined.includes('refused')) {
        errorMsg = 'Connection refused. Ensure Wireless debugging is enabled and the pairing service is active.';
      } else if (combined.includes('unreachable')) {
        errorMsg = 'Host unreachable. Check the IP address and ensure both devices are on the same network.';
      } else if (combined.includes('invalid') || combined.includes('incorrect')) {
        errorMsg = 'Invalid pairing code. The 6-digit code may have expired. Generate a new one on your device.';
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
   * Parse a QR payload exported from Android Wireless debugging.
   * Supported forms observed across Android versions:
   * 1. host:pairPort:code
   * 2. host:pairPort code
   * 3. adbpair://host:pairPort?code=XXXXXX&adb_port=YYYY&ipaddr=AAA.BBB.CCC.DDD
   * 4. host:pairPort:code:adbPort  (some OEM / older tooling conventions)
   * 5. WIFIADB:host:pairPort:code:adbPort (rare prefix variants – ignored prefix)
   * Returns pairing service host/port/code and optional device IP + adbPort for auto-connect.
   */
  parseQrPairingPayload(payload: string): { host: string; port: string; code: string; adbPort?: string; deviceIp?: string } | undefined {
    if (!payload) {
      return undefined;
    }
    const trimmed = payload.trim();

    // If it looks like a URL with adbpair scheme
    try {
      if (/^adbpair:\/\//i.test(trimmed)) {
        const url = new URL(trimmed);
        const host = url.hostname;
        const port = url.port || '37123';
        const code = url.searchParams.get('code') || '';
        const adbPort = url.searchParams.get('adb_port') || undefined;
        const deviceIp = url.searchParams.get('ipaddr') || undefined;
        if (/^[0-9]{6}$/.test(code) && host && port) {
          return { host, port, code, adbPort, deviceIp };
        }
      }
    } catch {/* ignore URL parse errors */}

    // Remove known optional prefixes like WIFIADB:
    const noPrefix = trimmed.replace(/^(?:WIFIADB:)/i, '');

    // Pattern 4: host:pairPort:code:adbPort
    let m = noPrefix.match(/^(?<host>[a-zA-Z0-9_.-]+):(?<pairPort>\d+):(?<code>\d{6}):(?<adbPort>\d{2,5})$/);
    if (m?.groups) {
      return { host: m.groups.host, port: m.groups.pairPort, code: m.groups.code, adbPort: m.groups.adbPort };
    }

    // Pattern 1: host:pairPort:code
    m = noPrefix.match(/^(?<host>[a-zA-Z0-9_.-]+):(?<pairPort>\d+):(?<code>\d{6})$/);
    if (m?.groups) {
      return { host: m.groups.host, port: m.groups.pairPort, code: m.groups.code };
    }

    // Pattern 2: host:pairPort code
    m = noPrefix.match(/^(?<host>[a-zA-Z0-9_.-]+):(?<pairPort>\d+)\s+(?<code>\d{6})$/);
    if (m?.groups) {
      return { host: m.groups.host, port: m.groups.pairPort, code: m.groups.code };
    }

    return undefined;
  }

  /**
   * Starts a QR pairing session. First tries `adb pair --qr`, but falls back to generating
   * a manual QR if the ADB version doesn't support it or prompts for manual input.
   */
  async startQrPairingSession(): Promise<QrPairingSessionResult> {
    if (this.qrPairingProcess) {
      return {
        success: false,
        message: "A QR pairing session is already running. Cancel it before starting a new one."
      };
    }

    let adbPath: string;
    try {
      adbPath = await this.binaryManager.getAdbPath();
    } catch (error) {
      adbPath = (this.binaryManager as any).getAdbPathSync?.() || this.binaryManager.getBundledBinaryPath?.('adb') || 'adb';
    }

    // First try to use adb pair --qr
    const qrResult = await this.tryAdbQrPairing(adbPath);
    if (qrResult.success) {
      return qrResult;
    }

    // Fallback: generate manual QR with dummy/example values
    this.logger.info("ADB QR pairing not supported or failed. Generating manual QR with example values.");
    
    const fallbackHost = "192.168.1.50";  // Example IP
    const fallbackPort = "37153";         // Common pairing port
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString(); // Random 6-digit code
    const fallbackSsid = "ADB-Pair";
    
    const payload = `WIFI:T:ADB;S:${fallbackSsid};P:${fallbackCode};IP:${fallbackHost}:${fallbackPort};;`;
    
    return {
      success: true,
      message: "Generated example QR. Replace host/port/code with actual values from your device's Wireless debugging screen.",
      payload,
      host: fallbackHost,
      port: fallbackPort,
      code: fallbackCode,
      ssid: fallbackSsid,
      expiresInSeconds: 60
    };
  }

  private async tryAdbQrPairing(adbPath: string): Promise<QrPairingSessionResult> {
    return new Promise<QrPairingSessionResult>((resolve) => {
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.logger.info("Trying QR pairing with `adb pair --qr`");
      const process = spawn(adbPath, ["pair", "--qr"], spawnOptions);
      this.qrPairingProcess = process;
      this.managedProcesses.add(process);

      let resolved = false;
      let stdout = "";
      let stderr = "";

      const finalize = (result: QrPairingSessionResult) => {
        if (!resolved) {
          resolved = true;
          this.qrPairingProcess = null;
          this.managedProcesses.delete(process);
          resolve(result);
        }
      };

      const handleChunk = (chunk: string) => {
        stdout += chunk;
        this.logger.logProcessOutput("adb", chunk);

        // Check if ADB is asking for manual input (fallback indicator)
        if (chunk.includes("Enter pairing code") || chunk.includes("Pairing code:")) {
          this.logger.info("ADB is requesting manual pairing code input - QR mode not supported");
          process.kill(PlatformUtils.getTerminationSignal());
          finalize({ success: false, message: "ADB QR mode not supported by this version" });
          return;
        }

        const parsed = this.extractQrSessionInfo(stdout);
        if (parsed && parsed.payload) {
          finalize({ success: true, process, rawOutput: stdout, ...parsed });
        }
      };

      process.stdout?.on("data", (data: Buffer) => handleChunk(data.toString()));
      process.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        this.logger.logProcessOutput("adb", text);
        handleChunk(text);
      });

      process.on("close", (code: number | null) => {
        if (!resolved) {
          finalize({
            success: false,
            message: "ADB QR pairing session ended without producing a QR payload",
            rawOutput: stdout || stderr,
          });
        }
      });

      process.on("error", (error: Error) => {
        this.logger.error(`ADB QR pairing error: ${error.message}`, error);
        finalize({ success: false, message: error.message, rawOutput: stdout || stderr });
      });

      // Quick timeout for detecting if QR is supported
      setTimeout(() => {
        if (!resolved) {
          this.logger.info("ADB QR pairing timed out - likely not supported");
          process.kill(PlatformUtils.getTerminationSignal());
          finalize({ success: false, message: "ADB QR pairing timeout - unsupported" });
        }
      }, 5000);
    });
  }

  /** Cancel any running `adb pair --qr` session */
  async stopQrPairingSession(): Promise<void> {
    if (!this.qrPairingProcess) {
      return;
    }

    this.logger.info("Stopping active QR pairing session");
    const process = this.qrPairingProcess;
    this.qrPairingProcess = null;

    if (this.qrPairingTimeout) {
      clearTimeout(this.qrPairingTimeout);
      this.qrPairingTimeout = undefined;
    }

    if (process) {
      this.managedProcesses.delete(process);
    }

    if (process && !process.killed) {
      const terminationSignal = PlatformUtils.getTerminationSignal();
      process.kill(terminationSignal);
      setTimeout(() => {
        if (!process.killed) {
          process.kill(PlatformUtils.getForceKillSignal());
        }
      }, 2000);
    }
  }

  /** Indicates if an `adb pair --qr` session is currently running */
  isQrPairingSessionActive(): boolean {
    return !!this.qrPairingProcess;
  }

  private extractQrSessionInfo(output: string): Omit<QrPairingSessionResult, "success"> | undefined {
    if (!output) {
      return undefined;
    }

    // Combine multiline ASCII art into a single searchable string
    const cleaned = output.replace(/\u001b\[[0-9;]*m/g, ""); // strip ANSI codes

    const wifiMatch = cleaned.match(/WIFI:[\s\S]*?;;/);
    const codeMatch = cleaned.match(/Pairing code:\s*(\d{6})/i) || cleaned.match(/Code:\s*(\d{6})/i);
    const hostMatch = cleaned.match(/IP (?:Address|addr):\s*([\d.]+)/i) || cleaned.match(/Host:\s*([\d.]+)/i);
    const portMatch = cleaned.match(/Port:\s*(\d{2,5})/i) || cleaned.match(/pairing port:\s*(\d{2,5})/i);
    const ssidMatch = cleaned.match(/SSID:\s*([\w\-]+)/i);
    const expiryMatch = cleaned.match(/Expires in (\d+)s/i);

    let payload = wifiMatch ? wifiMatch[0].replace(/\s+/g, "") : undefined;

    let host: string | undefined;
    let port: string | undefined;
    let code: string | undefined;
    let ssid: string | undefined;

    if (payload) {
      const payloadHost = payload.match(/IP:([^;]+)/);
      const payloadCode = payload.match(/P:(\d{6})/);
      const payloadSsid = payload.match(/S:([^;]+)/);
      if (payloadHost?.[1]) {
        host = payloadHost[1].split(":")[0];
        const portPart = payloadHost[1].split(":")[1];
        if (portPart) {
          port = portPart;
        }
      }
      if (payloadCode?.[1]) {
        code = payloadCode[1];
      }
      if (payloadSsid?.[1]) {
        ssid = payloadSsid[1];
      }
    }

    if (codeMatch?.[1]) {
      code = codeMatch[1];
    }
    if (hostMatch?.[1]) {
      host = hostMatch[1];
    }
    if (portMatch?.[1]) {
      port = portMatch[1];
    }
    if (ssidMatch?.[1]) {
      ssid = ssidMatch[1];
    }

    if (!payload && host && port && code) {
      payload = `WIFI:T:ADB;S:${ssid || "ADB-Pair"};P:${code};IP:${host}:${port};;`;
    }

    if (!payload) {
      return undefined;
    }

    const expiresInSeconds = expiryMatch?.[1] ? parseInt(expiryMatch[1], 10) : undefined;

    return { payload, host, port, code, ssid, expiresInSeconds };
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
