import * as path from 'path';
import { glob } from 'glob';

// Import Mocha properly
const Mocha = require('mocha');

/**
 * Test suite index file
 * Configures and runs all test files
 */
export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000, // 10 second timeout for tests
    reporter: 'spec', // Use spec reporter for detailed output
    slow: 2000, // Mark tests as slow if they take more than 2 seconds
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    // Find all test files
    glob('**/**.test.js', { cwd: testsRoot }).then((files: string[]) => {
      // Add files to the test suite
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures: number) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    }).catch((err: any) => {
      e(err);
    });
  });
}