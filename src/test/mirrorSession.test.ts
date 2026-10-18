import * as assert from 'assert';
import { serializeInput } from '../managers/mirrorSession';

suite('MirrorSession Tests', () => {
  test('serializes touch events in the scrcpy 2.x/3.x layout', () => {
    const [b] = serializeInput({ kind: 'touch', action: 0, pointerId: -2, x: 10, y: 20, w: 1024, h: 640, pressure: 1 });
    assert.strictEqual(b.length, 32);
    assert.strictEqual(b[0], 2);
    assert.strictEqual(b[1], 0);
    assert.strictEqual(b.readBigInt64BE(2), -2n);
    assert.deepStrictEqual([b.readInt32BE(10), b.readInt32BE(14), b.readUInt16BE(18), b.readUInt16BE(20)], [10, 20, 1024, 640]);
    assert.strictEqual(b.readUInt16BE(22), 0xffff);
    const [up] = serializeInput({ kind: 'touch', action: 1, pointerId: -2, x: 10, y: 20, w: 1024, h: 640, pressure: 1 });
    assert.strictEqual(up.readUInt16BE(22), 0);
  });

  test('serializes scroll, keys, text, back and rotate', () => {
    const [scroll] = serializeInput({ kind: 'scroll', x: 1, y: 2, w: 3, h: 4, hscroll: 0, vscroll: -16 });
    assert.strictEqual(scroll.length, 21);
    assert.strictEqual(scroll.readInt16BE(15), -0x8000);

    const keys = serializeInput({ kind: 'key', keycode: 3 });
    assert.deepStrictEqual(keys.map(k => [k.length, k[0], k[1], k.readInt32BE(2)]), [[14, 0, 0, 3], [14, 0, 1, 3]]);

    const [text] = serializeInput({ kind: 'text', text: 'hi' });
    assert.deepStrictEqual([...text], [1, 0, 0, 0, 2, 0x68, 0x69]);

    assert.deepStrictEqual(serializeInput({ kind: 'back' }).map(b => [...b]), [[4, 0], [4, 1]]);
    assert.deepStrictEqual([...serializeInput({ kind: 'rotate' })[0]], [11]);
  });
});
