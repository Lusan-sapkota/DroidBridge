import * as fs from 'fs';
import * as vscode from 'vscode';
import { BinaryManager } from '../managers/binaryManager';
import { ConfigManager } from '../managers/configManager';
import { Logger } from '../managers/logger';

export function registerMcp(context: vscode.ExtensionContext, binaryManager: BinaryManager, configManager: ConfigManager, logger: Logger): void {
  const bundled = vscode.Uri.joinPath(context.extensionUri, 'dist', 'mcp-server.js').fsPath;
  const stable = vscode.Uri.joinPath(context.globalStorageUri, 'mcp-server.js').fsPath;
  try {
    fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
    fs.copyFileSync(bundled, stable);
    fs.copyFileSync(vscode.Uri.joinPath(context.extensionUri, 'resources', 'scrcpy-server').fsPath, vscode.Uri.joinPath(context.globalStorageUri, 'scrcpy-server').fsPath);
  } catch (error) {
    logger.error('Could not copy the MCP server to global storage', error instanceof Error ? error : undefined);
  }

  const adbPath = () => binaryManager.getAdbPath().catch(() => 'adb');
  const changed = new vscode.EventEmitter<void>();
  context.subscriptions.push(changed, configManager.onConfigurationChanged(() => changed.fire()));

  if (vscode.lm?.registerMcpServerDefinitionProvider) {
    context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider('droidbridge', {
      onDidChangeMcpServerDefinitions: changed.event,
      provideMcpServerDefinitions: async () => [
        new vscode.McpStdioServerDefinition(
          'DroidBridge Android',
          process.execPath,
          [bundled],
          { ELECTRON_RUN_AS_NODE: '1', DROIDBRIDGE_ADB: await adbPath() },
          context.extension.packageJSON.version,
        ),
      ],
    }));
  }

  context.subscriptions.push(vscode.commands.registerCommand('droidbridge.setupMcp', async () => {
    const adb = await adbPath();
    const choice = await vscode.window.showQuickPick([
      { label: 'Claude Code', detail: 'Copy a "claude mcp add" command', id: 'claude' },
      { label: 'Cursor, Claude Desktop, Windsurf and others', detail: 'Copy an mcpServers JSON entry', id: 'json' },
      { label: 'GitHub Copilot in VS Code', detail: 'Already available in Agent mode, no setup needed', id: 'copilot' },
    ], { title: 'Give an AI agent access to your Android device' });
    if (!choice) {
      return;
    }
    if (choice.id === 'copilot') {
      vscode.window.showInformationMessage('Open Copilot Chat in Agent mode and enable the "DroidBridge Android" tools from the tools picker.');
      return;
    }
    const text = choice.id === 'claude'
      ? `claude mcp add droidbridge -e DROIDBRIDGE_ADB=${JSON.stringify(adb)} -- node ${JSON.stringify(stable)}`
      : JSON.stringify({ mcpServers: { droidbridge: { command: 'node', args: [stable], env: { DROIDBRIDGE_ADB: adb } } } }, null, 2);
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage(
      choice.id === 'claude' ? 'Copied. Run it in a terminal. Requires Node.js.' : 'Copied. Add it to your client\'s MCP config. Requires Node.js.',
    );
  }));
}
