import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { listSystemImages, parseAvdList, pickProfile, readAvdConfig, wipeAvd, writeAvdConfig } from '../mcp/avd';

suite('Emulator Tests', () => {
  test('reads AVD names and skips emulator log lines', () => {
    const out = 'INFO    | Storing crashdata in: /tmp/android/emu-crash.db\nPixel_8_API_35\r\nMedium_Tablet\n\n';
    assert.deepStrictEqual(parseAvdList(out), ['Pixel_8_API_35', 'Medium_Tablet']);
  });

  test('lists installed system images for the host, newest first', () => {
    const sdk = fs.mkdtempSync(path.join(os.tmpdir(), 'droidbridge-sdk-'));
    for (const dir of ['android-33/google_apis/x86_64', 'android-35/google_apis_playstore/x86_64', 'android-35/google_apis/arm64-v8a']) {
      fs.mkdirSync(path.join(sdk, 'system-images', dir), { recursive: true });
    }
    assert.deepStrictEqual(listSystemImages(sdk, 'x64').map(i => i.id), [
      'system-images;android-35;google_apis_playstore;x86_64',
      'system-images;android-33;google_apis;x86_64',
    ]);
    assert.deepStrictEqual(listSystemImages(sdk, 'arm64').map(i => i.id), ['system-images;android-35;google_apis;arm64-v8a']);
    fs.rmSync(sdk, { recursive: true });
  });

  test('picks a hardware profile for phones and tablets', () => {
    assert.strictEqual(pickProfile(['pixel', 'pixel_c', 'medium_phone'], false), 'medium_phone');
    assert.strictEqual(pickProfile(['pixel', 'pixel_c'], true), 'pixel_c');
    assert.strictEqual(pickProfile(['tv_1080p'], true), undefined);
  });

  test('edits AVD config.ini in place and wipes state', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'droidbridge-avd-'));
    const dir = path.join(home, 'elsewhere', 'Phone.avd');
    fs.mkdirSync(path.join(dir, 'snapshots', 'default_boot'), { recursive: true });
    fs.writeFileSync(path.join(home, 'Phone.ini'), `path=${dir}\n`);
    fs.writeFileSync(path.join(dir, 'config.ini'), 'hw.ramSize=2048\nhw.lcd.width=1080\n\n');
    fs.writeFileSync(path.join(dir, 'userdata-qemu.img'), 'x');
    const saved = process.env.ANDROID_AVD_HOME;
    process.env.ANDROID_AVD_HOME = home;
    try {
      writeAvdConfig('Phone', { 'hw.ramSize': '4096', 'hw.cpu.ncore': '4' });
      assert.strictEqual(fs.readFileSync(path.join(dir, 'config.ini'), 'utf8'), 'hw.ramSize=4096\nhw.lcd.width=1080\nhw.cpu.ncore=4\n');
      assert.strictEqual(readAvdConfig('Phone')['hw.cpu.ncore'], '4');
      wipeAvd('Phone', true);
      assert.ok(!fs.existsSync(path.join(dir, 'snapshots')) && fs.existsSync(path.join(dir, 'userdata-qemu.img')));
      wipeAvd('Phone', false);
      assert.ok(!fs.existsSync(path.join(dir, 'userdata-qemu.img')) && fs.existsSync(path.join(dir, 'config.ini')));
    } finally {
      process.env.ANDROID_AVD_HOME = saved;
      fs.rmSync(home, { recursive: true });
    }
  });
});
