import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import { BinaryManager } from '../managers/binaryManager';
import { ProcessManager } from '../managers/processManager';
import { ConfigManager } from '../managers/configManager';
import { Logger } from '../managers/logger';
import { PlatformUtils } from '../utils/platformUtils';

suite('Platform Integration Test Suite', () => {
  let binaryManager: BinaryManager;
  let processManager: ProcessManager;
  let mockConfigManager: sinon.SinonStubbedInstance<ConfigManager>;
  let mockLogger: sinon.SinonStubbedInstance<Logger>;
  let originalPlatform: string;
  const mockExtensionPath = '/mock/extension/path';

  setup(() => {
    // Store original platform
    originalPlatform = os.platform();
    
    // Create stubbed dependencies
    mockConfigManager = sinon.createStubInstance(ConfigManager);
    mockLogger = sinon.createStubInstance(Logger);
    
    // Initialize managers
    binaryManager = new BinaryManager(mockExtensionPath, mockConfigManager as any);
    processManager = new ProcessManager(binaryManager, mockLogger as any);
  });

  teardown(() => {
    sinon.restore();
  });

  suite('Windows Platform Integration', () => {
    setup(() => {
      sinon.stub(os, 'platform').returns('win32');
      sinon.stub(os, 'arch').returns('x64');
    });

    test('should use correct binary paths with .exe extension', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);

      const adbPath = binaryManager.getAdbPath();
      const scrcpyPath = binaryManager.getScrcpyPath();

      assert.ok(adbPath.endsWith('adb.exe'));
      assert.ok(scrcpyPath.endsWith('scrcpy.exe'));
      assert.ok(adbPath.includes('win32'));
      assert.ok(scrcpyPath.includes('win32'));
    });

    test('should use Windows-specific spawn options', () => {
      const options = PlatformUtils.getPlatformSpecificOptions();

      assert.strictEqual(options.shell, true);
      assert.strictEqual(options.windowsHide, true);
    });

    test('should not attempt executable permission handling', async () => {
      const supportsPermissions = PlatformUtils.supportsFeature('executable-permissions');
      
      assert.strictEqual(supportsPermissions, false);
    });

    test('should get correct platform info', () => {
      const platformInfo = binaryManager.getPlatformInfo();

      assert.strictEqual(platformInfo.platform, 'win32');
      assert.strictEqual(platformInfo.binaryExtension, '.exe');
      assert.strictEqual(platformInfo.supportsExecutablePermissions, false);
    });
  });

  suite('macOS Platform Integration', () => {
    setup(() => {
      sinon.stub(os, 'platform').returns('darwin');
      sinon.stub(os, 'arch').returns('arm64');
    });

    test('should use correct binary paths without extension', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);

      const adbPath = binaryManager.getAdbPath();
      const scrcpyPath = binaryManager.getScrcpyPath();

      assert.ok(!adbPath.endsWith('.exe'));
      assert.ok(!scrcpyPath.endsWith('.exe'));
      assert.ok(adbPath.includes('darwin'));
      assert.ok(scrcpyPath.includes('darwin'));
    });

    test('should use Unix-specific spawn options', () => {
      const options = PlatformUtils.getPlatformSpecificOptions();

      assert.strictEqual(options.shell, undefined);
      assert.ok(options.env);
    });

    test('should support executable permission handling', async () => {
      const supportsPermissions = PlatformUtils.supportsFeature('executable-permissions');
      
      assert.strictEqual(supportsPermissions, true);
    });

    test('should get correct platform info', () => {
      const platformInfo = binaryManager.getPlatformInfo();

      assert.strictEqual(platformInfo.platform, 'darwin');
      assert.strictEqual(platformInfo.architecture, 'arm64');
      assert.strictEqual(platformInfo.binaryExtension, '');
      assert.strictEqual(platformInfo.supportsExecutablePermissions, true);
    });
  });

  suite('Linux Platform Integration', () => {
    setup(() => {
      sinon.stub(os, 'platform').returns('linux');
      sinon.stub(os, 'arch').returns('x64');
    });

    test('should use correct binary paths without extension', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);

      const adbPath = binaryManager.getAdbPath();
      const scrcpyPath = binaryManager.getScrcpyPath();

      assert.ok(!adbPath.endsWith('.exe'));
      assert.ok(!scrcpyPath.endsWith('.exe'));
      assert.ok(adbPath.includes('linux'));
      assert.ok(scrcpyPath.includes('linux'));
    });

    test('should use Unix-specific spawn options', () => {
      const options = PlatformUtils.getPlatformSpecificOptions();

      assert.strictEqual(options.shell, undefined);
      assert.ok(options.env);
    });

    test('should support executable permission handling', async () => {
      const supportsPermissions = PlatformUtils.supportsFeature('executable-permissions');
      
      assert.strictEqual(supportsPermissions, true);
    });

    test('should get correct platform info', () => {
      const platformInfo = binaryManager.getPlatformInfo();

      assert.strictEqual(platformInfo.platform, 'linux');
      assert.strictEqual(platformInfo.architecture, 'x64');
      assert.strictEqual(platformInfo.binaryExtension, '');
      assert.strictEqual(platformInfo.supportsExecutablePermissions, true);
    });
  });

  suite('Cross-Platform Signal Handling', () => {
    test('should use appropriate termination signals', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        sinon.restore();
        sinon.stub(os, 'platform').returns(platform as NodeJS.Platform);

        const terminationSignal = PlatformUtils.getTerminationSignal();
        const forceKillSignal = PlatformUtils.getForceKillSignal();

        assert.strictEqual(terminationSignal, 'SIGTERM');
        assert.strictEqual(forceKillSignal, 'SIGKILL');
      });
    });
  });

  suite('Architecture Detection', () => {
    test('should correctly map architecture names', () => {
      const architectures = [
        { input: 'x64', expected: 'x64' },
        { input: 'arm64', expected: 'arm64' },
        { input: 'ia32', expected: 'x86' }
      ];

      architectures.forEach(({ input, expected }) => {
        sinon.restore();
        sinon.stub(os, 'arch').returns(input as NodeJS.Architecture);

        const result = PlatformUtils.getCurrentArchitecture();
        assert.strictEqual(result, expected);
      });
    });
  });

  suite('Feature Support Detection', () => {
    test('should correctly detect feature support across platforms', () => {
      const testCases = [
        { platform: 'win32', feature: 'executable-permissions' as const, expected: false },
        { platform: 'darwin', feature: 'executable-permissions' as const, expected: true },
        { platform: 'linux', feature: 'executable-permissions' as const, expected: true },
        { platform: 'win32', feature: 'shell-execution' as const, expected: true },
        { platform: 'darwin', feature: 'shell-execution' as const, expected: true },
        { platform: 'linux', feature: 'shell-execution' as const, expected: true },
        { platform: 'win32', feature: 'process-signals' as const, expected: false },
        { platform: 'darwin', feature: 'process-signals' as const, expected: true },
        { platform: 'linux', feature: 'process-signals' as const, expected: true }
      ];

      testCases.forEach(({ platform, feature, expected }) => {
        sinon.restore();
        sinon.stub(os, 'platform').returns(platform as NodeJS.Platform);

        const result = PlatformUtils.supportsFeature(feature);
        assert.strictEqual(result, expected, `Feature ${feature} support on ${platform} should be ${expected}`);
      });
    });
  });

  suite('Binary Directory Structure', () => {
    test('should create correct directory structure for each platform', () => {
      const platforms = ['win32', 'darwin', 'linux'];

      platforms.forEach(platform => {
        sinon.restore();
        sinon.stub(os, 'platform').returns(platform as NodeJS.Platform);
        
        mockConfigManager.getCustomAdbPath.returns(undefined);
        
        const adbPath = binaryManager.getAdbPath();
        const expectedPath = path.join(mockExtensionPath, 'binaries', platform);
        
        assert.ok(adbPath.startsWith(expectedPath), `ADB path should start with ${expectedPath} for platform ${platform}`);
      });
    });
  });

  suite('Error Handling Across Platforms', () => {
    test('should handle unsupported platform gracefully', () => {
      sinon.restore();
      sinon.stub(os, 'platform').returns('freebsd' as NodeJS.Platform);

      assert.throws(() => {
        PlatformUtils.getCurrentPlatform();
      }, /Unsupported platform: freebsd/);

      assert.strictEqual(PlatformUtils.isSupportedPlatform(), false);
    });
  });

  suite('Path Normalization', () => {
    test('should normalize paths correctly on all platforms', () => {
      const testPaths = [
        '/path/to/../binary',
        'path\\to\\..\\binary',
        './relative/path',
        '../parent/path'
      ];

      testPaths.forEach(testPath => {
        const result = PlatformUtils.normalizePath(testPath);
        assert.strictEqual(result, path.normalize(testPath));
      });
    });
  });
});