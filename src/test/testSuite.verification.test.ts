import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Suite Verification
 * Ensures all required test files exist and are properly structured
 */
suite('Test Suite Verification', () => {
  const testDir = __dirname;

  suite('Required Test Files', () => {
    test('should have all unit test files', () => {
      const requiredUnitTests = [
        'binaryManager.test.ts',
        'commandManager.test.ts',
        'configManager.test.ts',
        'logger.test.ts',
        'processManager.test.ts',
        'errorHandler.test.ts',
        'platformUtils.test.ts',
        'themeManager.test.ts'
      ];

      requiredUnitTests.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        assert.ok(fs.existsSync(filePath), `Unit test file should exist: ${testFile}`);
      });
    });

    test('should have all integration test files', () => {
      const requiredIntegrationTests = [
        'errorScenarios.integration.test.ts',
        'sidebarCommandIntegration.test.ts',
        'extension.lifecycle.test.ts',
        'platformIntegration.test.ts',
        'themeIntegration.test.ts'
      ];

      requiredIntegrationTests.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        assert.ok(fs.existsSync(filePath), `Integration test file should exist: ${testFile}`);
      });
    });

    test('should have all end-to-end test files', () => {
      const requiredE2ETests = [
        'endToEnd.test.ts',
        'adbConnection.test.ts',
        'sidebarProvider.test.ts'
      ];

      requiredE2ETests.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        assert.ok(fs.existsSync(filePath), `E2E test file should exist: ${testFile}`);
      });
    });

    test('should have comprehensive error testing files', () => {
      const requiredErrorTests = [
        'errorHandler.comprehensive.test.ts',
        'errorScenarios.comprehensive.test.ts'
      ];

      requiredErrorTests.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        assert.ok(fs.existsSync(filePath), `Error test file should exist: ${testFile}`);
      });
    });

    test('should have test infrastructure files', () => {
      const requiredInfrastructureFiles = [
        'coverage.test.ts',
        'testRunner.ts',
        'index.ts',
        'README.md'
      ];

      requiredInfrastructureFiles.forEach(file => {
        const filePath = path.join(testDir, file);
        assert.ok(fs.existsSync(filePath), `Infrastructure file should exist: ${file}`);
      });
    });
  });

  suite('Test File Structure', () => {
    test('should have proper test suite structure in unit tests', () => {
      const unitTestFiles = [
        'binaryManager.test.ts',
        'commandManager.test.ts',
        'configManager.test.ts',
        'logger.test.ts',
        'processManager.test.ts'
      ];

      unitTestFiles.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for basic test structure
          assert.ok(content.includes('suite('), `${testFile} should have test suites`);
          assert.ok(content.includes('test('), `${testFile} should have test cases`);
          assert.ok(content.includes('setup(') || content.includes('beforeEach('), 
            `${testFile} should have setup/beforeEach`);
          assert.ok(content.includes('teardown(') || content.includes('afterEach('), 
            `${testFile} should have teardown/afterEach`);
        }
      });
    });

    test('should have proper imports in test files', () => {
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'));

      testFiles.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for required imports
        assert.ok(content.includes("import * as assert from 'assert'"), 
          `${testFile} should import assert`);
        
        if (content.includes('sinon')) {
          assert.ok(content.includes("import * as sinon from 'sinon'"), 
            `${testFile} should properly import sinon`);
        }
        
        if (content.includes('vscode')) {
          assert.ok(content.includes("import * as vscode from 'vscode'"), 
            `${testFile} should properly import vscode`);
        }
      });
    });
  });

  suite('Test Coverage Requirements', () => {
    test('should have tests for all manager classes', () => {
      const managerClasses = [
        'BinaryManager',
        'CommandManager',
        'ConfigManager',
        'Logger',
        'ProcessManager'
      ];

      managerClasses.forEach(managerClass => {
        const testFileName = `${managerClass.toLowerCase()}.test.ts`;
        const filePath = path.join(testDir, testFileName);
        assert.ok(fs.existsSync(filePath), 
          `Should have test file for ${managerClass}: ${testFileName}`);
      });
    });

    test('should have tests for all utility classes', () => {
      const utilityClasses = [
        'ErrorHandler',
        'PlatformUtils',
        'ThemeManager'
      ];

      utilityClasses.forEach(utilityClass => {
        const testFileName = `${utilityClass.toLowerCase()}.test.ts`;
        const filePath = path.join(testDir, testFileName);
        assert.ok(fs.existsSync(filePath), 
          `Should have test file for ${utilityClass}: ${testFileName}`);
      });
    });

    test('should have tests for all provider classes', () => {
      const providerClasses = [
        'SidebarProvider'
      ];

      providerClasses.forEach(providerClass => {
        const testFileName = `${providerClass.toLowerCase()}.test.ts`;
        const filePath = path.join(testDir, testFileName);
        assert.ok(fs.existsSync(filePath), 
          `Should have test file for ${providerClass}: ${testFileName}`);
      });
    });
  });

  suite('Test Configuration', () => {
    test('should have test configuration files', () => {
      const configFiles = [
        '../.vscode-test.mjs',
        '../../.c8rc.json'
      ];

      configFiles.forEach(configFile => {
        const filePath = path.join(testDir, configFile);
        assert.ok(fs.existsSync(filePath), 
          `Should have configuration file: ${configFile}`);
      });
    });

    test('should have proper package.json test scripts', () => {
      const packageJsonPath = path.join(testDir, '../../package.json');
      assert.ok(fs.existsSync(packageJsonPath), 'Should have package.json');

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts;

      // Check for required test scripts
      assert.ok(scripts.test, 'Should have test script');
      assert.ok(scripts['test:unit'], 'Should have test:unit script');
      assert.ok(scripts['test:integration'], 'Should have test:integration script');
      assert.ok(scripts['test:e2e'], 'Should have test:e2e script');
      assert.ok(scripts['test:coverage'], 'Should have test:coverage script');
      assert.ok(scripts['compile-tests'], 'Should have compile-tests script');
    });

    test('should have required test dependencies', () => {
      const packageJsonPath = path.join(testDir, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const devDependencies = packageJson.devDependencies;

      // Check for required test dependencies
      assert.ok(devDependencies['@types/mocha'], 'Should have @types/mocha');
      assert.ok(devDependencies['@types/sinon'], 'Should have @types/sinon');
      assert.ok(devDependencies['@vscode/test-cli'], 'Should have @vscode/test-cli');
      assert.ok(devDependencies['@vscode/test-electron'], 'Should have @vscode/test-electron');
      assert.ok(devDependencies['sinon'], 'Should have sinon');
      assert.ok(devDependencies['c8'], 'Should have c8 for coverage');
      assert.ok(devDependencies['mocha'], 'Should have mocha');
      assert.ok(devDependencies['glob'], 'Should have glob');
    });
  });

  suite('Test Quality Metrics', () => {
    test('should have comprehensive test coverage', () => {
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'));
      
      // Should have a reasonable number of test files
      assert.ok(testFiles.length >= 15, 
        `Should have at least 15 test files, found ${testFiles.length}`);
      
      // Calculate total test content
      let totalTestContent = 0;
      testFiles.forEach(testFile => {
        const filePath = path.join(testDir, testFile);
        const content = fs.readFileSync(filePath, 'utf8');
        totalTestContent += content.length;
      });
      
      // Should have substantial test content
      assert.ok(totalTestContent > 50000, 
        `Should have substantial test content, found ${totalTestContent} characters`);
    });

    test('should have error scenario coverage', () => {
      const errorTestFiles = fs.readdirSync(testDir)
        .filter(file => file.includes('error') || file.includes('Error'));
      
      assert.ok(errorTestFiles.length >= 3, 
        `Should have at least 3 error-related test files, found ${errorTestFiles.length}`);
    });

    test('should have integration test coverage', () => {
      const integrationTestFiles = fs.readdirSync(testDir)
        .filter(file => file.includes('integration') || file.includes('Integration'));
      
      assert.ok(integrationTestFiles.length >= 2, 
        `Should have at least 2 integration test files, found ${integrationTestFiles.length}`);
    });

    test('should have end-to-end test coverage', () => {
      const e2eTestFiles = fs.readdirSync(testDir)
        .filter(file => file.includes('endToEnd') || file.includes('e2e') || file.includes('E2E'));
      
      assert.ok(e2eTestFiles.length >= 1, 
        `Should have at least 1 end-to-end test file, found ${e2eTestFiles.length}`);
    });
  });

  suite('Documentation and Maintenance', () => {
    test('should have test documentation', () => {
      const readmePath = path.join(testDir, 'README.md');
      assert.ok(fs.existsSync(readmePath), 'Should have test README.md');

      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      assert.ok(readmeContent.includes('Test Structure'), 'README should document test structure');
      assert.ok(readmeContent.includes('Requirements Coverage'), 'README should document requirements coverage');
      assert.ok(readmeContent.includes('Running Tests'), 'README should document how to run tests');
    });

    test('should have test maintenance guidelines', () => {
      const readmePath = path.join(testDir, 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      assert.ok(readmeContent.includes('Test Maintenance'), 'README should include maintenance guidelines');
      assert.ok(readmeContent.includes('Debugging Tests'), 'README should include debugging information');
    });
  });
});