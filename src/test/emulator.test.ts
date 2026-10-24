import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { listSystemImages, parseAvdList, pickProfile } from '../mcp/avd';

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
});
