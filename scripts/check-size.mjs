import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const input = readFileSync(new URL('../dist/index.js', import.meta.url));
const bytes = gzipSync(input).byteLength;
const limit = 3 * 1024;

console.log(`dist/index.js gzip size: ${bytes} bytes`);

if (bytes > limit) {
  throw new Error(`Bundle exceeds 3KB gzip target (${bytes}/${limit} bytes).`);
}
