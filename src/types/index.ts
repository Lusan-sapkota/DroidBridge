import { ChildProcess } from 'child_process';

/**
 * Represents the connection state to an Android device via ADB
 */
export interface ConnectionState {
  connected: boolean;
  deviceIp?: string;
  devicePort?: string;
  lastConnected?: Date;
  connectionError?: string;
}

/**
 * Represents the state of a scrcpy screen mirroring session
 */
export interface ScrcpyState {
  running: boolean;
  process?: ChildProcess;
  startTime?: Date;
  options?: ScrcpyOptions;
}

/**
 * Configuration options for scrcpy
 */
export interface ScrcpyOptions {
  bitrate?: number;
  maxSize?: number;
  crop?: string;
  recordFile?: string;
}

/**
 * Represents an item in the DroidBridge sidebar tree view
 */
export interface SidebarItem {
  id: string;
  label: string;
  type: 'section' | 'input' | 'button' | 'status';
  value?: string;
  enabled?: boolean;
  icon?: string;
  command?: string;
}

/**
 * Overall extension state containing all component states
 */
export interface ExtensionState {
  connection: ConnectionState;
  scrcpy: ScrcpyState;
  initialized: boolean;
  binariesValidated: boolean;
}

/**
 * Result of executing a process command
 */
export interface ProcessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Result of binary validation
 */
export interface ValidationResult {
  adbValid: boolean;
  scrcpyValid: boolean;
  errors: string[];
}

/**
 * Context information for connection operations
 */
export interface ConnectionContext {
  ip: string;
  port: string;
  timeout?: number;
}

/**
 * Information about a binary path and its source
 */
export interface BinaryInfo {
  path: string;
  isCustom: boolean;
  bundledPath: string;
}