import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { zipSync } from 'fflate';
const root = resolve('.');
const excluded = new Set([
  'node_modules',
  'target',
  'dist',
  'test-results',
  'playwright-report',
  'artifacts',
  '.git',
  'gen',
]);
const files = {};
async function collect(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(item.name) || item.name.endsWith('.tsbuildinfo') || item.name.endsWith('.log'))
      continue;
    const path = join(dir, item.name);
    if (item.isDirectory()) await collect(path);
    else if (item.isFile())
      files[`patchloom/${relative(root, path).split('\\').join('/')}`] = [
        new Uint8Array(await readFile(path)),
        { mtime: new Date('2026-01-01T00:00:00Z') },
      ];
  }
}
await collect(root);
await mkdir('artifacts', { recursive: true });
const output = resolve('artifacts/patchloom-source.zip');
await writeFile(output, zipSync(files, { level: 9 }));
console.log(`${Object.keys(files).length} source files → ${output}`);
