import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const source = new URL('../index.html', import.meta.url);

export async function startPreview({ port = 0 } = {}) {
  const server = createServer(async (request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    // Serve only the page and its identity; never expose the checkout or dependencies.
    if (!['/', '/index.html', '/__preview'].includes(path)) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      const html = await readFile(source);
      const sha256 = createHash('sha256').update(html).digest('hex');
      const identity = {
        project: 'laser-selector',
        title: 'Filter Selector | Univet Laser',
        sha256,
      };
      response.writeHead(200, {
        'Content-Type': path === '/__preview' ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Preview-Project': identity.project,
        'X-Source-SHA256': sha256,
      });
      response.end(request.method === 'HEAD' ? undefined :
        path === '/__preview' ? JSON.stringify(identity) : html);
    } catch (error) {
      console.error(error.message);
      response.writeHead(500).end('Unable to read the preview source');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { server, url } = await startPreview();
  console.log(`laser-selector preview: ${url}`);
  console.log(`Source identity: ${url}/__preview`);
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close());
  }
}
