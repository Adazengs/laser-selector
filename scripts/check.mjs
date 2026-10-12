import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { JSDOM } from 'jsdom';

// Parse the actual shipped inline JavaScript and event handlers, without fetching assets.
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html);
try {
  const scripts = [...dom.window.document.querySelectorAll('script:not([src])')];
  if (!scripts.length) throw new Error('No application script found in index.html');
  scripts.forEach((script, index) => new Script(script.textContent, {
    filename: `index.html script ${index + 1}`,
  }));
  let handlers = 0;
  for (const element of dom.window.document.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      if (!attribute.name.startsWith('on')) continue;
      new Script(`(function(event) { ${attribute.value}\n})`, {
        filename: `index.html ${element.tagName}.${attribute.name}`,
      });
      handlers++;
    }
  }
  console.log(`Syntax OK: ${scripts.length} inline script(s), ${handlers} event handler(s)`);
} finally {
  dom.window.close();
}
