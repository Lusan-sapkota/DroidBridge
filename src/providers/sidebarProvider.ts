import * as vscode from 'vscode';
import { SidebarItem } from '../types';

/**
 * Provides the tree data for the DroidBridge sidebar view
 */
export class DroidBridgeSidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined | null | void> = new vscode.EventEmitter<SidebarItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private connectionStatus: boolean = false;
  private scrcpyStatus: boolean = false;

  /**
   * Get the tree item representation of an element
   */
  getTreeItem(element: SidebarItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    
    if (element.icon) {
      item.iconPath = new vscode.ThemeIcon(element.icon);
    }
    
    if (element.command) {
      item.command = {
        command: element.command,
        title: element.label
      };
    }

    return item;
  }

  /**
   * Get the children of an element (or root elements if element is undefined)
   */
  getChildren(element?: SidebarItem): Thenable<SidebarItem[]> {
    if (!element) {
      // Return root elements
      return Promise.resolve([
        {
          id: 'connect-section',
          label: 'Connect',
          type: 'section',
          icon: 'plug'
        },
        {
          id: 'scrcpy-section',
          label: 'Scrcpy',
          type: 'section',
          icon: 'device-mobile'
        }
      ]);
    }

    // Return children based on section
    if (element.id === 'connect-section') {
      return Promise.resolve([
        {
          id: 'connection-status',
          label: this.connectionStatus ? '✅ Connected' : '❌ Disconnected',
          type: 'status'
        },
        {
          id: 'connect-button',
          label: 'Connect Device',
          type: 'button',
          command: 'droidbridge.connectDevice',
          icon: 'plug'
        },
        {
          id: 'disconnect-button',
          label: 'Disconnect Device',
          type: 'button',
          command: 'droidbridge.disconnectDevice',
          icon: 'debug-disconnect'
        }
      ]);
    }

    if (element.id === 'scrcpy-section') {
      return Promise.resolve([
        {
          id: 'scrcpy-status',
          label: this.scrcpyStatus ? '▶️ Running' : '⏹️ Stopped',
          type: 'status'
        },
        {
          id: 'launch-scrcpy-button',
          label: 'Launch Scrcpy',
          type: 'button',
          command: 'droidbridge.launchScrcpy',
          icon: 'play'
        },
        {
          id: 'stop-scrcpy-button',
          label: 'Stop Scrcpy',
          type: 'button',
          command: 'droidbridge.stopScrcpy',
          icon: 'stop'
        }
      ]);
    }

    return Promise.resolve([]);
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Update the connection status and refresh the view
   */
  updateConnectionStatus(connected: boolean): void {
    this.connectionStatus = connected;
    this.refresh();
  }

  /**
   * Update the scrcpy status and refresh the view
   */
  updateScrcpyStatus(running: boolean): void {
    this.scrcpyStatus = running;
    this.refresh();
  }
}