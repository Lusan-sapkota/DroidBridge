import * as assert from 'assert';
import * as zlib from 'zlib';
import { clipboardMessage, encodePng, encodeScreencap, formatUiNode, parseUiDump, parseUiTree } from '../mcp/android';
import { handle } from '../mcp/server';

suite('MCP Server Tests', () => {
  test('negotiates protocol and lists tools with schemas', async () => {
    const init: any = await handle({ id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } });
    assert.strictEqual(init.result.protocolVersion, '2025-03-26');
    assert.deepStrictEqual(init.result.capabilities, { tools: {} });
    const unknown: any = await handle({ id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } });
    assert.strictEqual(unknown.result.protocolVersion, '2025-06-18');

    const list: any = await handle({ id: 3, method: 'tools/list' });
    const names = list.result.tools.map((t: any) => t.name);
    for (const name of ['screenshot', 'ui_tree', 'tap', 'tap_element', 'swipe', 'type_text', 'press_key', 'logcat']) {
      assert.ok(names.includes(name), name);
    }
    const tap = list.result.tools.find((t: any) => t.name === 'tap');
    assert.deepStrictEqual(tap.inputSchema.required, ['x', 'y']);
    assert.ok(tap.inputSchema.properties.serial);
  });

  test('device-free tools take no serial and validate input', async () => {
    const list: any = await handle({ id: 10, method: 'tools/list' });
    const tool = (name: string) => list.result.tools.find((t: any) => t.name === name);
    assert.strictEqual(tool('start_emulator').inputSchema.properties.serial, undefined);
    assert.ok(tool('wait_for').inputSchema.properties.serial);
    const url: any = await handle({ id: 11, method: 'tools/call', params: { name: 'open_url', arguments: { serial: 'x', url: 'not a url' } } });
    assert.match(url.result.content[0].text, /scheme/);
    const wait: any = await handle({ id: 12, method: 'tools/call', params: { name: 'wait_for', arguments: { serial: 'x' } } });
    assert.match(wait.result.content[0].text, /Pass text, id or desc/);
  });

  test('rejects non-numeric coordinates before touching the device', async () => {
    const res: any = await handle({ id: 9, method: 'tools/call', params: { name: 'tap', arguments: { serial: 'x', x: 'abc', y: 5 } } });
    assert.strictEqual(res.result.isError, true);
    assert.match(res.result.content[0].text, /"x" must be a number/);
  });

  test('returns errors as tool results and ignores notifications', async () => {
    const res: any = await handle({ id: 4, method: 'tools/call', params: { name: 'nope', arguments: {} } });
    assert.strictEqual(res.error.code, -32602);
    const bad: any = await handle(null as any);
    assert.strictEqual(bad.error.code, -32600);
    const nullParams: any = await handle({ id: 6, method: 'tools/call', params: null });
    assert.strictEqual(nullParams.error.code, -32602);
    assert.strictEqual(await handle({ method: 'notifications/initialized' }), undefined);
    const missing: any = await handle({ id: 5, method: 'resources/list' });
    assert.strictEqual(missing.error.code, -32601);
  });

  test('parses uiautomator dumps into tappable elements', () => {
    const xml = `<?xml version='1.0' ?><hierarchy rotation="0">
      <node index="0" text="" resource-id="" class="android.widget.FrameLayout" content-desc="" clickable="false" bounds="[0,0][1080,2400]">
        <node index="0" text="Sign in &amp; sync" resource-id="com.app:id/login" class="android.widget.Button" content-desc="" checkable="false" clickable="true" bounds="[100,200][300,260]" />
        <node index="1" text="" resource-id="com.app:id/mute" class="android.widget.Switch" content-desc="Mute" checkable="true" checked="true" clickable="true" bounds="[0,300][100,400]" />
      </node></hierarchy>`;
    const nodes = parseUiTree(xml);
    assert.strictEqual(nodes.length, 2);
    assert.deepStrictEqual([nodes[0].text, nodes[0].id, nodes[0].x, nodes[0].y], ['Sign in & sync', 'login', 200, 230]);
    assert.strictEqual(formatUiNode(nodes[1]), '#1 Switch desc="Mute" id=mute clickable checked center=50,350');
    const dump = parseUiDump(xml.replace('class="android.widget.FrameLayout"', 'class="android.widget.FrameLayout" package="com.app"'));
    assert.deepStrictEqual([dump.total, dump.packages], [3, ['com.app']]);
  });

  test('decodes screencap pixel formats', () => {
    const pixels = (format: number, bytes: number[]) => {
      const head = Buffer.alloc(16);
      head.writeUInt32LE(2, 0);
      head.writeUInt32LE(1, 4);
      head.writeUInt32LE(format, 8);
      const png = encodeScreencap(Buffer.concat([head, Buffer.from(bytes)])).png;
      const idat = png.indexOf('IDAT');
      const rows = zlib.inflateSync(png.subarray(idat + 4, idat + 4 + png.readUInt32BE(idat - 4)));
      return [rows[1], rows[2], rows[3], (rows[4] + rows[1]) & 0xff, (rows[5] + rows[2]) & 0xff, (rows[6] + rows[3]) & 0xff];
    };
    assert.deepStrictEqual(pixels(1, [255, 0, 0, 255, 0, 0, 255, 255]), [255, 0, 0, 0, 0, 255]);
    assert.deepStrictEqual(pixels(5, [255, 0, 0, 255, 0, 0, 255, 255]), [0, 0, 255, 255, 0, 0]);
    assert.deepStrictEqual(pixels(4, [0x00, 0xf8, 0x1f, 0x00]), [255, 0, 0, 0, 0, 255]);
    assert.throws(() => pixels(1, [1, 2, 3]), /Unexpected screencap format/);
  });

  test('builds scrcpy clipboard paste messages', () => {
    const msg = clipboardMessage('é', true, 7);
    assert.deepStrictEqual([...msg], [9, 0, 0, 0, 0, 0, 0, 0, 7, 1, 0, 0, 0, 2, 0xc3, 0xa9]);
  });

  test('new tools validate input before touching the device', async () => {
    const call = async (name: string, args: object) => ((await handle({ id: 20, method: 'tools/call', params: { name, arguments: { serial: 'x', ...args } } })) as any).result;
    assert.match((await call('set_display', { fontScale: '9' })).content[0].text, /fontScale/);
    assert.match((await call('stop_app', { package: 'x; rm -rf /' })).content[0].text, /package name/);
    assert.match((await call('push_file', { localPath: 'rel.txt', devicePath: '/sdcard/' })).content[0].text, /absolute path/);
    assert.match((await call('start_activity', {})).content[0].text, /component/);
    assert.match((await call('logcat', { tags: ['a b'] })).content[0].text, /Tags/);
    const list: any = await handle({ id: 21, method: 'tools/list' });
    const tool = (name: string) => list.result.tools.find((t: any) => t.name === name);
    assert.ok(tool('tap').inputSchema.properties.expectPackage);
    assert.strictEqual(tool('screenshot').inputSchema.properties.expectPackage, undefined);
    assert.strictEqual(tool('connect_device').inputSchema.properties.serial, undefined);
  });

  test('encodes valid PNG data', () => {
    const rows = Buffer.from([0, 255, 0, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]);
    const png = encodePng(rows, 2, 2);
    assert.strictEqual(png.subarray(1, 4).toString(), 'PNG');
    const idat = png.indexOf('IDAT');
    const len = png.readUInt32BE(idat - 4);
    assert.deepStrictEqual([...zlib.inflateSync(png.subarray(idat + 4, idat + 4 + len))], [...rows]);
  });
});
