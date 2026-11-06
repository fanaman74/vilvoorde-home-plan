import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from './serve.mjs';

const server = createServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = process.env.VIEWER_URL || `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', req => {
    if (/^https?:/.test(req.url()) && new URL(req.url()).origin !== new URL(base).origin) {
      externalRequests.push(req.url());
    }
  });
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => window.houseModel);
  const stats = await page.evaluate(() => houseModel.stats());
  assert.deepEqual(stats.levels, ['ground', 'first', 'attic', 'basement']);
  assert.ok(stats.meshes > 100);
  for (const floor of ['first', 'attic', 'basement', 'all', 'garden', 'ground']) {
    await page.locator(`[data-floor="${floor}"]`).click();
    assert.equal(await page.locator('nav button.active').getAttribute('data-floor'), floor);
    assert.ok(await page.evaluate(() => Object.values(houseModel.levels).some(g => g.visible)));
  }
  await page.locator('[data-floor="garden"]').click();
  for (const control of ['#dimensions', '#exterior-roofs', '#fullwalls', '#gardendoors']) {
    await page.locator(control).check();
    await page.locator(control).uncheck();
  }
  await page.locator('#reset').click();
  await mkdir('outputs', { recursive: true });
  await page.screenshot({ path: 'outputs/web-desktop.png' });

  const pngReady = page.waitForEvent('download');
  await page.locator('#png').click();
  const png = await pngReady;
  await png.saveAs('outputs/web-export.png');
  assert.equal((await readFile('outputs/web-export.png')).subarray(1, 4).toString(), 'PNG');

  const glbReady = page.waitForEvent('download', { timeout: 90000 });
  await page.locator('#glb').click();
  const glb = await glbReady;
  await glb.saveAs('outputs/web-export.glb');
  const model = await readFile('outputs/web-export.glb');
  assert.equal(model.subarray(0, 4).toString(), 'glTF');
  assert.equal(model.readUInt32LE(8), model.length);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-floor="first"]').click();
  await page.screenshot({ path: 'outputs/web-mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  console.log(JSON.stringify({ url: base, ...stats, floors: 'passed', controls: 'passed', exports: 'PNG and GLB passed', mobile: 'passed', browserErrors: errors, externalRequests }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
