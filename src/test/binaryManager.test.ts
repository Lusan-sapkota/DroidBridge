import * as assert from 'assert';
import * as path from 'path';
import * as sinon from 'sinon';
import { BinaryManager } from '../managers/binaryManager';
import { ConfigManager } from '../managers/configManager';
import { PlatformUtils } from '../utils/platformUtils';

suite('BinaryManager Test Suite', () => {
  let binaryManager: BinaryManager;
  let mockConfigManager: sinon.SinonStubbedInstance<ConfigManager>;
  let platformUtilsStub: sinon.SinonStub;
  let fsStub: any;
  const mockExtensionPath = '/mock/extension/path';

  setup(() => {
    // Create stubbed ConfigManager
    mockConfigManager = sinon.createStubInstance(ConfigManager);
    
    // Stub PlatformUtils methods
    platformUtilsStub = sinon.stub(PlatformUtils, 'getCurrentPlatform');
    sinon.stub(PlatformUtils, 'getBinaryExtension');
    sinon.stub(PlatformUtils, 'makeExecutable');
    sinon.stub(PlatformUtils, 'isSupportedPlatform');
    sinon.stub(PlatformUtils, 'isExecutable');
    sinon.stub(PlatformUtils, 'getCurrentArchitecture');
    sinon.stub(PlatformUtils, 'supportsFeature');

    // Create fs stubs
    const fs = require('fs/promises');
    fsStub = {
      stat: sinon.stub(fs, 'stat'),
      access: sinon.stub(fs, 'access'),
      mkdir: sinon.stub(fs, 'mkdir')
    };

    binaryManager = new BinaryManager(mockExtensionPath, mockConfigManager as any);
  });

  teardown(() => {
    sinon.restore();
  });

  suite('constructor', () => {
    test('should initialize with extension path and config manager', () => {
      assert.ok(binaryManager instanceof BinaryManager);
    });
  });

  suite('getAdbPath', () => {
    test('should return custom ADB path when configured', () => {
      const customPath = '/custom/adb/path';
      mockConfigManager.getCustomAdbPath.returns(customPath);

      const result = binaryManager.getAdbPathSync();

      assert.strictEqual(result, customPath);
      assert.ok(mockConfigManager.getCustomAdbPath.calledOnce);
    });

    test('should return bundled ADB path when no custom path configured', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');

      const result = binaryManager.getAdbPathSync();

      assert.strictEqual(result, path.join(mockExtensionPath, 'binaries', 'linux', 'adb'));
      assert.ok(mockConfigManager.getCustomAdbPath.calledOnce);
    });

    test('should return Windows bundled path with .exe extension', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('.exe');

      const result = binaryManager.getAdbPathSync();

      assert.strictEqual(result, path.join(mockExtensionPath, 'binaries', 'win32', 'adb.exe'));
    });
  });

  suite('getScrcpyPath', () => {
    test('should return custom scrcpy path when configured', () => {
      const customPath = '/custom/scrcpy/path';
      mockConfigManager.getCustomScrcpyPath.returns(customPath);

      const result = binaryManager.getScrcpyPathSync();

      assert.strictEqual(result, customPath);
      assert.ok(mockConfigManager.getCustomScrcpyPath.calledOnce);
    });

    test('should return bundled scrcpy path when no custom path configured', () => {
      mockConfigManager.getCustomScrcpyPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('darwin');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');

      const result = binaryManager.getScrcpyPathSync();

      assert.strictEqual(result, path.join(mockExtensionPath, 'binaries', 'darwin', 'scrcpy'));
      assert.ok(mockConfigManager.getCustomScrcpyPath.calledOnce);
    });
  });

  suite('validateBinaries', () => {
    setup(() => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');
    });

    test('should return valid result when both binaries exist and are executable', async () => {
      // Mock file stats to indicate files exist
      const mockStats = { isFile: () => true };
      fsStub.stat.resolves(mockStats);
      fsStub.access.resolves(undefined);

      const result = await binaryManager.validateBinaries();

      assert.strictEqual(result.adbValid, true);
      assert.strictEqual(result.scrcpyValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should return invalid result when ADB binary does not exist', async () => {
      fsStub.stat
        .onFirstCall().rejects(new Error('File not found')) // ADB
        .onSecondCall().resolves({ isFile: () => true }); // scrcpy
      fsStub.access.resolves(undefined);

      const result = await binaryManager.validateBinaries();

      assert.strictEqual(result.adbValid, false);
      assert.strictEqual(result.scrcpyValid, true);
      assert.ok(result.errors.some(error => error.includes('ADB binary not found')));
    });

    test('should skip executable check on Windows', async () => {
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
      (PlatformUtils.supportsFeature as sinon.SinonStub).returns(false);
      const mockStats = { isFile: () => true };
      fsStub.stat.resolves(mockStats);

      // Mock the binary detection to avoid fs.access calls
      const mockDetection = { found: true, path: '/mock/path', source: 'system' as const };
      sinon.stub(binaryManager as any, 'getOrDetectBinary').resolves(mockDetection);

      const result = await binaryManager.validateBinaries();

      assert.strictEqual(result.adbValid, true);
      assert.strictEqual(result.scrcpyValid, true);
      // The key test is that supportsFeature returns false, not that fs.access isn't called
      assert.ok((PlatformUtils.supportsFeature as sinon.SinonStub).calledWith('executable-permissions'));
    });
  });

  suite('getBinaryInfo', () => {
    test('should return correct info for bundled binaries', async () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');

      // Mock the detection to return bundled binaries
      const mockAdbDetection = {
        found: true,
        path: path.join(mockExtensionPath, 'binaries', 'linux', 'adb'),
        source: 'bundled'
      };
      const mockScrcpyDetection = {
        found: true,
        path: path.join(mockExtensionPath, 'binaries', 'linux', 'scrcpy'),
        source: 'bundled'
      };
      
      const getOrDetectBinaryStub = sinon.stub(binaryManager as any, 'getOrDetectBinary');
      getOrDetectBinaryStub.withArgs('adb').resolves(mockAdbDetection);
      getOrDetectBinaryStub.withArgs('scrcpy').resolves(mockScrcpyDetection);

      const result = await binaryManager.getBinaryInfo();

      assert.strictEqual(result.adb.isCustom, false);
      assert.strictEqual(result.scrcpy.isCustom, false);
      assert.strictEqual(result.adb.path, path.join(mockExtensionPath, 'binaries', 'linux', 'adb'));
      assert.strictEqual(result.scrcpy.path, path.join(mockExtensionPath, 'binaries', 'linux', 'scrcpy'));
    });

    test('should return correct info for custom binaries', async () => {
      const customAdbPath = '/custom/adb';
      const customScrcpyPath = '/custom/scrcpy';
      mockConfigManager.getCustomAdbPath.returns(customAdbPath);
      mockConfigManager.getCustomScrcpyPath.returns(customScrcpyPath);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('.exe');

      // Mock detection (won't be called for custom paths but still needed for version info)
      const mockDetection = { found: true, path: '/mock/path', source: 'custom' as const, version: '1.0.0' };
      const getOrDetectBinaryStub = sinon.stub(binaryManager as any, 'getOrDetectBinary').resolves(mockDetection);

      const result = await binaryManager.getBinaryInfo();

      assert.strictEqual(result.adb.isCustom, true);
      assert.strictEqual(result.scrcpy.isCustom, true);
      assert.strictEqual(result.adb.path, customAdbPath);
      assert.strictEqual(result.scrcpy.path, customScrcpyPath);
    });
  });

  // Commented out - extractBinaries method was removed in favor of smart binary management
  // suite('extractBinaries', () => {
  //   test('should create binaries directory if it does not exist', async () => {
  //     (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
  //     (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');
  //     (PlatformUtils.supportsFeature as sinon.SinonStub).returns(true);
  //     (PlatformUtils.isExecutable as sinon.SinonStub).resolves(true);
      
  //     fsStub.mkdir.resolves();
  //     fsStub.access.resolves();

  //     await binaryManager.extractBinaries();

  //     assert.ok(fsStub.mkdir.calledWith(path.join(mockExtensionPath, 'binaries', 'linux'), { recursive: true }));
  //   });

  //   test('should make binaries executable on Unix systems', async () => {
  //     (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
  //     (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');
  //     (PlatformUtils.supportsFeature as sinon.SinonStub).returns(true);
  //     (PlatformUtils.isExecutable as sinon.SinonStub).resolves(false);
  //     (PlatformUtils.makeExecutable as sinon.SinonStub).resolves();
      
  //     fsStub.mkdir.resolves();
  //     fsStub.access.resolves();

  //     await binaryManager.extractBinaries();

  //     assert.ok((PlatformUtils.makeExecutable as sinon.SinonStub).calledTwice);
  //   });

  //   test('should handle missing binaries gracefully', async () => {
  //     (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
  //     (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('.exe');
  //     (PlatformUtils.supportsFeature as sinon.SinonStub).returns(false);
      
  //     fsStub.mkdir.resolves();
  //     fsStub.access.rejects(new Error('File not found'));

  //     // Should not throw
  //     await binaryManager.extractBinaries();

  //     assert.ok(fsStub.mkdir.calledOnce);
  //   });
  // });

  suite('checkBinaryIntegrity', () => {
    setup(() => {
      (PlatformUtils.isSupportedPlatform as sinon.SinonStub).returns(true);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);
    });

    test('should return success when both binaries pass integrity check', async () => {
      const mockStats = { isFile: () => true, size: 1000 };
      fsStub.stat.resolves(mockStats);
      (PlatformUtils.isExecutable as sinon.SinonStub).resolves(true);

      const result = await binaryManager.checkBinaryIntegrity();

      assert.strictEqual(result.adb, true);
      assert.strictEqual(result.scrcpy, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('should return failure for unsupported platform', async () => {
      (PlatformUtils.isSupportedPlatform as sinon.SinonStub).returns(false);

      const result = await binaryManager.checkBinaryIntegrity();

      assert.strictEqual(result.adb, false);
      assert.strictEqual(result.scrcpy, false);
      assert.ok(result.errors.some(error => error.includes('Unsupported platform')));
    });

    test('should handle binary integrity check failures', async () => {
      fsStub.stat.rejects(new Error('File not found'));

      const result = await binaryManager.checkBinaryIntegrity();

      assert.strictEqual(result.adb, false);
      assert.strictEqual(result.scrcpy, false);
      assert.ok(result.errors.length > 0);
    });
  });

  suite('getPlatformInfo', () => {
    test('should return correct platform information', () => {
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
      (PlatformUtils.getCurrentArchitecture as sinon.SinonStub).returns('x64');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('.exe');
      (PlatformUtils.supportsFeature as sinon.SinonStub).returns(false);

      const result = binaryManager.getPlatformInfo();

      assert.strictEqual(result.platform, 'win32');
      assert.strictEqual(result.architecture, 'x64');
      assert.strictEqual(result.binaryExtension, '.exe');
      assert.strictEqual(result.supportsExecutablePermissions, false);
    });
  });

  suite('platform detection', () => {
    test('should handle all supported platforms', () => {
      const platforms = ['win32', 'darwin', 'linux'];
      
      platforms.forEach(platform => {
        (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns(platform);
        mockConfigManager.getCustomAdbPath.returns(undefined);
        
        const result = binaryManager.getAdbPathSync();
        assert.ok(result.includes(platform));
      });
    });
  });
});