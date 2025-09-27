import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Test runner for comprehensive test suite
 * Runs all test categories with proper configuration
 */
async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    const extensionTestsPath = path.resolve(__dirname, './index');

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions', // Disable other extensions for clean testing
        '--disable-workspace-trust', // Disable workspace trust for testing
      ],
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();