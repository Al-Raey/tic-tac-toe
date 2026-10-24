import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/site.webmanifest'));
const index = read('index.html');
const app = read('src/App.tsx');
const i18n = read('src/lib/i18n.ts');
const pages = ['about.html', 'contact.html', 'guide.html', 'privacy.html', 'terms.html'];

assert.equal(pkg.name, 'tic-tac-toe', 'Package name must use the final public product name.');
assert.equal(pkg.version, '1.0.0', 'Package version must be 1.0.0 for display version v1.00.');
assert.equal(manifest.name, 'tic-tac-toe', 'Web app manifest name must match the public product name.');
assert.equal(manifest.short_name, 'tic-tac-toe', 'Web app manifest short name must match the public product name.');
assert.match(index, /<title>tic-tac-toe v1\.00 — Free Strategy Game<\/title>/, 'Index title must show product and release version.');
assert.match(index, /property="og:site_name" content="tic-tac-toe"/, 'Open Graph site name must match the product.');
assert.match(app, /<h1>tic-tac-toe<\/h1>/, 'Main game heading must match the release name.');
assert.match(app, /brandEdition/, 'Application header must show the localized release version.');
assert.match(i18n, /brandEdition: 'VERSION 1\.00'/, 'English version badge must show 1.00.');
assert.match(i18n, /brandEdition: 'الإصدار ١\.٠٠'/, 'Arabic version badge must show 1.00.');

for (const pageName of pages) {
  const html = read(`public/${pageName}`);
  assert.match(html, /tic-tac-toe<small>v1\.00<\/small>/, `${pageName} header must show the final brand/version.`);
  assert.match(html, /tic-tac-toe v1\.00/, `${pageName} content/metadata must reference release v1.00.`);
  assert.doesNotMatch(html, /Tic-Tac-Toe Ultimate|ULTIMATE<\/small>/, `${pageName} must not show the retired product branding.`);
}

assert.doesNotMatch(index, /Tic-Tac-Toe Ultimate/, 'Index page must not retain the retired product branding.');
assert.doesNotMatch(app, /Tic-Tac-Toe <span>Ultimate<\/span>/, 'Main game must not retain retired product branding.');
console.log(`Release metadata checks passed (${pages.length + 9} checks, product name tic-tac-toe, display version v1.00, package version 1.0.0, bilingual labels and public pages).`);
