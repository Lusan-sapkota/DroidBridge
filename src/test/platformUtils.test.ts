import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import { PlatformUtils } from '../utils/platformUtils';

suite('PlatformUtils Test Suite', () => {
  let osStub: sinon.SinonStub;
  let fsStub: any;

  setup(() => {
    // Stub os.platform and os.arch
    osStub = sinon.stub(os, 'platform');
    sinon.stub(os, 'arch');
    sinon.stub(os, 'tmpdir');

    // Create fs stubs
    const fs = require('fs/promises');
    fsStub = {
      stat: sinon.stub(fs, 'stat'),
      access: sinon.stub(fs, 'access'),
      chmod: sinon.stub(fs, 'chmod')
    };
  });

  teardown(() => {
    sinon.restore();
  });

  suite('getBinaryExtension', () => {
    test('should return .exe for Windows', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.getBinaryExtension();
      
      assert.strictEqual(result, '.exe');
    });

    test('should return empty string for macOS', () => {
      osStub.returns('darwin');
      
      const result = PlatformUtils.getBinaryExtension();
      
      assert.strictEqual(result, '');
    });

    test('should return empty string for Linux', () => {
      osStub.returns('linux');
      
      const result = PlatformUtils.getBinaryExtension();
      
      assert.strictEqual(result, '');
    });
  });

  suite('getBinaryPath', () => {
    test('should add .exe extension on Windows', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.getBinaryPath('adb');
      
      assert.strictEqual(result, 'adb.exe');
    });

    test('should not add extension on Unix systems', () => {
      osStub.returns('linux');
      
      const result = PlatformUtils.getBinaryPath('adb');
      
      assert.strictEqual(result, 'adb');
    });
  });

  suite('getCurrentPlatform', () => {
    test('should return win32 for Windows', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.getCurrentPlatform();
      
      assert.strictEqual(result, 'win32');
    });

    test('should return darwin for macOS', () => {
      osStub.returns('darwin');
      
      const result = PlatformUtils.getCurrentPlatform();
      
      assert.strictEqual(result, 'darwin');
    });

    test('should return linux for Linux', () => {
      osStub.returns('linux');
      
      const result = PlatformUtils.getCurrentPlatform();
      
      assert.strictEqual(result, 'linux');
    });

    test('should throw error for unsupported platform', () => {
      osStub.returns('freebsd');
      
      assert.throws(() => {
        PlatformUtils.getCurrentPlatform();
      }, /Unsupported platform: freebsd/);
    });
  });

  suite('getCurrentArchitecture', () => {
    test('should return x64 for x64 architecture', () => {
      (os.arch as sinon.SinonStub).returns('x64');
      
      const result = PlatformUtils.getCurrentArchitecture();
      
      assert.strictEqual(result, 'x64');
    });

    test('should return arm64 for arm64 architecture', () => {
      (os.arch as sinon.SinonStub).returns('arm64');
      
      const result = PlatformUtils.getCurrentArchitecture();
      
      assert.strictEqual(result, 'arm64');
    });

    test('should return x86 for ia32 architecture', () => {
      (os.arch as sinon.SinonStub).returns('ia32');
      
      const result = PlatformUtils.getCurrentArchitecture();
      
      assert.strictEqual(result, 'x86');
    });
  });

  suite('makeExecutable', () => {
    test('should skip on Windows', async () => {
      osStub.returns('win32');
      
      await PlatformUtils.makeExecutable('/path/to/binary');
      
      assert.ok(fsStub.chmod.notCalled);
    });

    test('should set executable permissions on Unix', async () => {
      osStub.returns('linux');
      const mockStats = { mode: 0o644 };
      fsStub.stat.resolves(mockStats);
      fsStub.chmod.resolves();
      
      await PlatformUtils.makeExecutable('/path/to/binary');
      
      assert.ok(fsStub.stat.calledOnce);
      assert.ok(fsStub.chmod.calledWith('/path/to/binary', 0o755));
    });

    test('should not change permissions if already executable', async () => {
      osStub.returns('linux');
      const mockStats = { mode: 0o755 };
      fsStub.stat.resolves(mockStats);
      
      await PlatformUtils.makeExecutable('/path/to/binary');
      
      assert.ok(fsStub.stat.calledOnce);
      assert.ok(fsStub.chmod.notCalled);
    });

    test('should throw error if chmod fails', async () => {
      osStub.returns('linux');
      const mockStats = { mode: 0o644 };
      fsStub.stat.resolves(mockStats);
      fsStub.chmod.rejects(new Error('Permission denied'));
      
      await assert.rejects(
        PlatformUtils.makeExecutable('/path/to/binary'),
        /Failed to make \/path\/to\/binary executable/
      );
    });
  });

  suite('isExecutable', () => {
    test('should return true if file exists on Windows', async () => {
      osStub.returns('win32');
      fsStub.access.resolves();
      
      const result = await PlatformUtils.isExecutable('/path/to/binary.exe');
      
      assert.strictEqual(result, true);
      assert.ok(fsStub.access.calledWith('/path/to/binary.exe'));
    });

    test('should return false if file does not exist on Windows', async () => {
      osStub.returns('win32');
      fsStub.access.rejects(new Error('File not found'));
      
      const result = await PlatformUtils.isExecutable('/path/to/binary.exe');
      
      assert.strictEqual(result, false);
    });

    test('should check executable permissions on Unix', async () => {
      osStub.returns('linux');
      const fs = require('fs/promises');
      fsStub.access.resolves();
      
      const result = await PlatformUtils.isExecutable('/path/to/binary');
      
      assert.strictEqual(result, true);
      assert.ok(fsStub.access.calledWith('/path/to/binary', fs.constants.F_OK | fs.constants.X_OK));
    });

    test('should return false if not executable on Unix', async () => {
      osStub.returns('linux');
      fsStub.access.rejects(new Error('Not executable'));
      
      const result = await PlatformUtils.isExecutable('/path/to/binary');
      
      assert.strictEqual(result, false);
    });
  });

  suite('getPlatformSpecificOptions', () => {
    test('should return Windows-specific options', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.getPlatformSpecificOptions();
      
      assert.strictEqual(result.shell, true);
      assert.strictEqual(result.windowsHide, true);
      assert.deepStrictEqual(result.stdio, ['pipe', 'pipe', 'pipe']);
    });

    test('should return Unix-specific options', () => {
      osStub.returns('linux');
      
      const result = PlatformUtils.getPlatformSpecificOptions();
      
      assert.strictEqual(result.shell, undefined);
      assert.deepStrictEqual(result.stdio, ['pipe', 'pipe', 'pipe']);
      assert.ok(result.env);
    });

    test('should merge custom options', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.getPlatformSpecificOptions({
        cwd: '/custom/dir',
        timeout: 5000
      });
      
      assert.strictEqual(result.shell, true);
      assert.strictEqual(result.cwd, '/custom/dir');
      assert.strictEqual(result.timeout, 5000);
    });
  });

  suite('supportsFeature', () => {
    test('should return false for executable-permissions on Windows', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.supportsFeature('executable-permissions');
      
      assert.strictEqual(result, false);
    });

    test('should return true for executable-permissions on Unix', () => {
      osStub.returns('linux');
      
      const result = PlatformUtils.supportsFeature('executable-permissions');
      
      assert.strictEqual(result, true);
    });

    test('should return true for shell-execution on all platforms', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        osStub.returns(platform);
        
        const result = PlatformUtils.supportsFeature('shell-execution');
        
        assert.strictEqual(result, true);
      });
    });

    test('should return false for process-signals on Windows', () => {
      osStub.returns('win32');
      
      const result = PlatformUtils.supportsFeature('process-signals');
      
      assert.strictEqual(result, false);
    });

    test('should return true for process-signals on Unix', () => {
      osStub.returns('linux');
      
      const result = PlatformUtils.supportsFeature('process-signals');
      
      assert.strictEqual(result, true);
    });
  });

  suite('getTerminationSignal', () => {
    test('should return SIGTERM for all platforms', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        osStub.returns(platform);
        
        const result = PlatformUtils.getTerminationSignal();
        
        assert.strictEqual(result, 'SIGTERM');
      });
    });
  });

  suite('getForceKillSignal', () => {
    test('should return SIGKILL for all platforms', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        osStub.returns(platform);
        
        const result = PlatformUtils.getForceKillSignal();
        
        assert.strictEqual(result, 'SIGKILL');
      });
    });
  });

  suite('isSupportedPlatform', () => {
    test('should return true for supported platforms', () => {
      ['win32', 'darwin', 'linux'].forEach(platform => {
        osStub.returns(platform);
        
        const result = PlatformUtils.isSupportedPlatform();
        
        assert.strictEqual(result, true);
      });
    });

    test('should return false for unsupported platforms', () => {
      osStub.returns('freebsd');
      
      const result = PlatformUtils.isSupportedPlatform();
      
      assert.strictEqual(result, false);
    });
  });

  suite('normalizePath', () => {
    test('should normalize file paths', () => {
      const result = PlatformUtils.normalizePath('/path//to/../binary');
      
      assert.strictEqual(result, path.normalize('/path//to/../binary'));
    });
  });

  suite('getTempDir', () => {
    test('should return system temp directory', () => {
      (os.tmpdir as sinon.SinonStub).returns('/tmp');
      
      const result = PlatformUtils.getTempDir();
      
      assert.strictEqual(result, '/tmp');
    });
  });
});