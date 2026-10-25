import * as assert from 'assert';
import { parseDeviceList, parseEmulators } from '../managers/deviceTracker';

suite('DeviceTracker Tests', () => {
  test('keeps only online devices from track-devices output', () => {
    const text = 'emulator-5554\tdevice\n192.168.1.20:5555\toffline\nR58M123\tunauthorized\nR58M456\tdevice\n';
    assert.deepStrictEqual(parseDeviceList(text), ['emulator-5554', 'R58M456']);
    assert.deepStrictEqual(parseDeviceList(''), []);
    assert.deepStrictEqual(parseEmulators('emulator-5554\toffline\nR58M456\tdevice\nemulator-5556\tdevice\n'), ['emulator-5554', 'emulator-5556']);
  });
});
