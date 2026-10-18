import * as assert from 'assert';
import * as zlib from 'zlib';
import { encodePng, formatUiNode, parseUiTree } from '../mcp/android';
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

  test('returns errors as tool results and ignores notifications', async () => {
    const res: any = await handle({ id: 4, method: 'tools/call', params: { name: 'nope', arguments: {} } });
    assert.strictEqual(res.result.isError, true);
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
