import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
const root = resolve('examples');
const versions = {
  before: {
    'src/greeting.ts': 'export const greeting = "Hello, world";\n',
    'src/stable.ts': 'export const stable = true;\n',
    'src/removed.ts': 'export const old = true;\n',
    config: 'legacy configuration\n',
    'line-endings.txt': 'one\r\ntwo\r\n',
    'assets/data.bin': new Uint8Array([0, 1, 2, 3]),
  },
  after: {
    'src/greeting.ts': 'export const greeting = "Hello, Patchloom";\n',
    'src/stable.ts': 'export const stable = true;\n',
    'src/added.ts': 'export const fresh = true;\n',
    'config/settings.json': '{"theme":"dark"}\n',
    'line-endings.txt': 'one\ntwo\n',
    'assets/data.bin': new Uint8Array([0, 1, 2, 4]),
  },
};
const png = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6ioAAAAASUVORK5CYII=',
    'base64',
  ),
);
for (const [name, files] of Object.entries(versions)) {
  files['assets/pixel.png'] = png;
  const archive = {};
  for (const [path, value] of Object.entries(files)) {
    const bytes = typeof value === 'string' ? strToU8(value) : value;
    const target = resolve(root, name, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    archive[path] = bytes;
  }
  await writeFile(resolve(root, `${name}.zip`), zipSync(archive));
}
await writeFile(
  resolve(root, 'unsafe-path.zip'),
  zipSync({ '../escape.txt': strToU8('This archive must be rejected.') }),
);
console.log('Created folder and ZIP examples in examples/.');
