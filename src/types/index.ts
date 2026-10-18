import { ChildProcess } from 'child_process';

export interface ConnectionState {
  connected: boolean;
  deviceIp?: string;
  devicePort?: string;
  lastConnected?: Date;
  connectionError?: string;
}

export interface ScrcpyState {
  running: boolean;
  process?: ChildProcess;
  startTime?: Date;
  options?: ScrcpyOptions;
}

export interface ScrcpyOptions {
  bitrate?: number | string;
  maxSize?: number;
  crop?: string;
  recordFile?: string;
  alwaysOnTop?: boolean;
}

export interface SidebarItem {
  id: string;
  label: string;
  type: 'section' | 'input' | 'button' | 'status';
  value?: string;
  enabled?: boolean;
  icon?: string;
  command?: string;
}

export interface ExtensionState {
  connection: ConnectionState;
  scrcpy: ScrcpyState;
  initialized: boolean;
  binariesValidated: boolean;
}

export interface ProcessResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ValidationResult {
  adbValid: boolean;
  scrcpyValid: boolean;
  errors: string[];
}

export interface ConnectionContext {
  ip: string;
  port: string;
  timeout?: number;
}

export interface BinaryInfo {
  path: string;
  isCustom: boolean;
  bundledPath: string;
}