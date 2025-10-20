import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const functionFile = join(__dirname, '..', '.netlify', 'v1', 'functions', 'ssr', 'ssr.mjs');

try {
  await access(functionFile);
} catch (error) {
  console.warn('[prefer-static-fix] SSR function file not found, skipping.');
  process.exit(0);
}

const contents = await readFile(functionFile, 'utf8');
const updated = contents.replace(/preferStatic:\s*true/g, 'preferStatic: false');

if (contents === updated) {
  console.info('[prefer-static-fix] preferStatic already disabled.');
  process.exit(0);
}

await writeFile(functionFile, updated, 'utf8');
console.info('[prefer-static-fix] preferStatic flag disabled for Netlify SSR function.');
