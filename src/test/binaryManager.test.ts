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

      const result = binaryManager.getAdbPath();

      assert.strictEqual(result, customPath);
      assert.ok(mockConfigManager.getCustomAdbPath.calledOnce);
    });

    test('should return bundled ADB path when no custom path configured', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');

      const result = binaryManager.getAdbPath();

      assert.strictEqual(result, path.join(mockExtensionPath, 'binaries', 'linux', 'adb'));
      assert.ok(mockConfigManager.getCustomAdbPath.calledOnce);
    });

    test('should return Windows bundled path with .exe extension', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('.exe');

      const result = binaryManager.getAdbPath();

      assert.strictEqual(result, path.join(mockExtensionPath, 'binaries', 'win32', 'adb.exe'));
    });
  });

  suite('getScrcpyPath', () => {
    test('should return custom scrcpy path when configured', () => {
      const customPath = '/custom/scrcpy/path';
      mockConfigManager.getCustomScrcpyPath.returns(customPath);

      const result = binaryManager.getScrcpyPath();

      assert.strictEqual(result, customPath);
      assert.ok(mockConfigManager.getCustomScrcpyPath.calledOnce);
    });

    test('should return bundled scrcpy path when no custom path configured', () => {
      mockConfigManager.getCustomScrcpyPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('darwin');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');

      const result = binaryManager.getScrcpyPath();

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
      const mockStats = { isFile: () => true };
      fsStub.stat.resolves(mockStats);

      const result = await binaryManager.validateBinaries();

      assert.strictEqual(result.adbValid, true);
      assert.strictEqual(result.scrcpyValid, true);
      assert.ok(fsStub.access.notCalled);
    });
  });

  suite('getBinaryInfo', () => {
    test('should return correct info for bundled binaries', () => {
      mockConfigManager.getCustomAdbPath.returns(undefined);
      mockConfigManager.getCustomScrcpyPath.returns(undefined);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('linux');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('');

      const result = binaryManager.getBinaryInfo();

      assert.strictEqual(result.adb.isCustom, false);
      assert.strictEqual(result.scrcpy.isCustom, false);
      assert.strictEqual(result.adb.path, path.join(mockExtensionPath, 'binaries', 'linux', 'adb'));
      assert.strictEqual(result.scrcpy.path, path.join(mockExtensionPath, 'binaries', 'linux', 'scrcpy'));
    });

    test('should return correct info for custom binaries', () => {
      const customAdbPath = '/custom/adb';
      const customScrcpyPath = '/custom/scrcpy';
      mockConfigManager.getCustomAdbPath.returns(customAdbPath);
      mockConfigManager.getCustomScrcpyPath.returns(customScrcpyPath);
      (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns('win32');
      (PlatformUtils.getBinaryExtension as sinon.SinonStub).returns('.exe');

      const result = binaryManager.getBinaryInfo();

      assert.strictEqual(result.adb.isCustom, true);
      assert.strictEqual(result.scrcpy.isCustom, true);
      assert.strictEqual(result.adb.path, customAdbPath);
      assert.strictEqual(result.scrcpy.path, customScrcpyPath);
    });
  });

  suite('platform detection', () => {
    test('should handle all supported platforms', () => {
      const platforms = ['win32', 'darwin', 'linux'];
      
      platforms.forEach(platform => {
        (PlatformUtils.getCurrentPlatform as sinon.SinonStub).returns(platform);
        mockConfigManager.getCustomAdbPath.returns(undefined);
        
        const result = binaryManager.getAdbPath();
        assert.ok(result.includes(platform));
      });
    });
  });
});