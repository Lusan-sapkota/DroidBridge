import * as vscode from 'vscode';

/**
 * Represents a connection history entry
 */
export interface ConnectionHistoryEntry {
  id: string;
  ip: string;
  port: string;
  name?: string;
  lastConnected: Date;
  connectionCount: number;
}

/**
 * Manages connection history for DroidBridge
 */
export class ConnectionHistoryManager {
  private static readonly STORAGE_KEY = 'droidbridge.connectionHistory';
  private static readonly MAX_HISTORY_ENTRIES = 10;
  
  private context: vscode.ExtensionContext;
  private history: ConnectionHistoryEntry[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadHistory();
  }

  /**
   * Load connection history from storage
   */
  private loadHistory(): void {
    const stored = this.context.globalState.get<ConnectionHistoryEntry[]>(ConnectionHistoryManager.STORAGE_KEY, []);
    this.history = stored.map(entry => ({
      ...entry,
      lastConnected: new Date(entry.lastConnected)
    }));
  }

  /**
   * Save connection history to storage
   */
  private async saveHistory(): Promise<void> {
    await this.context.globalState.update(ConnectionHistoryManager.STORAGE_KEY, this.history);
  }

  /**
   * Add or update a connection in history
   */
  async addConnection(ip: string, port: string, name?: string): Promise<void> {
    const id = `${ip}:${port}`;
    const existingIndex = this.history.findIndex(entry => entry.id === id);

    if (existingIndex >= 0) {
      // Update existing entry
      this.history[existingIndex].lastConnected = new Date();
      this.history[existingIndex].connectionCount++;
      if (name) {
        this.history[existingIndex].name = name;
      }
      
      // Move to front
      const entry = this.history.splice(existingIndex, 1)[0];
      this.history.unshift(entry);
    } else {
      // Add new entry
      const newEntry: ConnectionHistoryEntry = {
        id,
        ip,
        port,
        name,
        lastConnected: new Date(),
        connectionCount: 1
      };
      
      this.history.unshift(newEntry);
      
      // Limit history size
      if (this.history.length > ConnectionHistoryManager.MAX_HISTORY_ENTRIES) {
        this.history = this.history.slice(0, ConnectionHistoryManager.MAX_HISTORY_ENTRIES);
      }
    }

    await this.saveHistory();
  }

  /**
   * Remove a connection from history
   */
  async removeConnection(id: string): Promise<void> {
    this.history = this.history.filter(entry => entry.id !== id);
    await this.saveHistory();
  }

  /**
   * Clear all connection history
   */
  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
  }

  /**
   * Get all connection history entries
   */
  getHistory(): ConnectionHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get a specific connection by ID
   */
  getConnection(id: string): ConnectionHistoryEntry | undefined {
    return this.history.find(entry => entry.id === id);
  }

  /**
   * Update the name of a connection
   */
  async updateConnectionName(id: string, name: string): Promise<void> {
    const entry = this.history.find(e => e.id === id);
    if (entry) {
      entry.name = name;
      await this.saveHistory();
    }
  }

  /**
   * Get recent connections (last 5)
   */
  getRecentConnections(): ConnectionHistoryEntry[] {
    return this.history.slice(0, 5);
  }
}