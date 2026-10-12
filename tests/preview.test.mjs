import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { startPreview } from '../scripts/preview.mjs';

test('Preview uses an isolated loopback port and identifies the exact served file', async t => {
  const { server, url } = await startPreview();
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  assert.equal(server.address().address, '127.0.0.1');
  assert.ok(server.address().port > 0);
  const source = await readFile(new URL('../index.html', import.meta.url));
  const sha256 = createHash('sha256').update(source).digest('hex');
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-source-sha256'), sha256);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), source);
  const identity = await (await fetch(`${url}/__preview`)).json();
  assert.equal(identity.project, 'laser-selector');
  assert.equal(identity.sha256, sha256);
  for (const path of ['/.git/config', '/package.json', '/node_modules/jsdom/package.json']) {
    assert.equal((await fetch(`${url}${path}`)).status, 404);
  }
});
