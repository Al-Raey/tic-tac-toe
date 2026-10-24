import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'index.html', 'public/site.css', 'public/site.js', 'public/robots.txt',
  'public/site.webmanifest', 'public/about.html', 'public/guide.html',
  'public/privacy.html', 'public/terms.html', 'public/contact.html', '.env.example',
  '.github/workflows/bootstrap-lockfile.yml', 'playwright.config.ts', 'e2e/app.spec.ts', 'scripts/test-release-metadata.mjs', '.github/workflows/release-v100-artifact.yml',
];
const errors = [];
for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) errors.push(`Missing required file: ${file}`);
}
const publicPages = ['about.html', 'guide.html', 'privacy.html', 'terms.html', 'contact.html'];
const pagesToCheck = [{ name: 'index.html', path: join(root, 'index.html') }, ...publicPages.map((name) => ({ name, path: join(root, 'public', name) }))];

function findLocalTarget(target) {
  let decoded;
  try { decoded = decodeURIComponent(target); } catch { return null; }
  const relative = decoded.replace(/^\/+/, '');
  if (relative.split('/').includes('..')) return null;
  if (!relative) return existsSync(join(root, 'index.html')) ? join(root, 'index.html') : null;
  const candidates = [join(root, relative), join(root, 'public', relative)];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

for (const page of pagesToCheck) {
  if (!existsSync(page.path)) continue;
  const content = readFileSync(page.path, 'utf8');
  if (publicPages.includes(page.name)) {
    if (!content.includes('data-lang="en"') || !content.includes('data-lang="ar"')) {
      errors.push(`${page.name} must provide both English and Arabic content.`);
    }
    if (!content.includes('/privacy.html') || !content.includes('/contact.html')) {
      errors.push(`${page.name} must include functional privacy and contact navigation.`);
    }
    if (!content.includes('name="description"')) errors.push(`${page.name} is missing a meta description.`);
  }
  for (const match of content.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    const target = match[1];
    if (!findLocalTarget(target)) errors.push(`${page.name} references a missing or unsafe local target: ${target}`);
  }
}
const privacy = existsSync(join(root, 'public/privacy.html'))
  ? readFileSync(join(root, 'public/privacy.html'), 'utf8') : '';
if (!privacy.includes('ttu.settings.v1') || !privacy.includes('AdSense')) {
  errors.push('Privacy page must explain local game storage and the conditional advertising behavior.');
}
const envExample = existsSync(join(root, '.env.example'))
  ? readFileSync(join(root, '.env.example'), 'utf8') : '';
if (!envExample.includes('VITE_ADSENSE_ENABLED=false') || !envExample.includes('VITE_ADSENSE_CONSENT_READY=false')) {
  errors.push('Ad integration and consent-ready acknowledgement must remain disabled by default.');
}
const index = readFileSync(join(root, 'index.html'), 'utf8');
for (const expected of ['name="description"', 'property="og:title"', 'rel="manifest"']) {
  if (!index.includes(expected)) errors.push(`index.html is missing ${expected}.`);
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (packageJson.devDependencies?.vite !== '6.4.5') {
  errors.push('Pin Vite to the reviewed patched 6.4.5 release (or update this check after a new advisory review).');
}
const viteConfig = readFileSync(join(root, 'vite.config.ts'), 'utf8');
if (!viteConfig.includes("server: { host: '127.0.0.1' }") || !viteConfig.includes("preview: { host: '127.0.0.1' }") || viteConfig.includes("host: '0.0.0.0'")) {
  errors.push('Both Vite development and preview servers must bind to loopback by default, not all network interfaces.');
}
const siteScript = readFileSync(join(root, 'public/site.js'), 'utf8');
if (!siteScript.includes('persistLanguage(selected)')) {
  errors.push('Public-page language changes must persist to ttu.settings.v1.');
}
for (const page of ['about.html', 'guide.html', 'privacy.html', 'terms.html', 'contact.html']) {
  const content = readFileSync(join(root, 'public', page), 'utf8');
  if (!content.includes('role="group" aria-label="Language / اللغة"')) {
    errors.push(`${page} language selector must have an accessible group role and name.`);
  }
}
const adSlot = readFileSync(join(root, 'src/lib/AdSlot.tsx'), 'utf8');
const adConsent = readFileSync(join(root, 'src/lib/adConsent.ts'), 'utf8');
if (!adSlot.includes('PRODUCTION_BUILD') || !adSlot.includes('__TTU_AD_CONSENT_STATUS__') || !adSlot.includes("'ttu:ad-consent-change'")) {
  errors.push('Ad requests must be production-only and respond to the runtime consent adapter.');
}
if (!adConsent.includes("config.consentStatus === 'granted'") || !adConsent.includes('config.consentManagerConfigured')) {
  errors.push('A configuration flag alone must not authorize advertising; actual runtime consent must be granted.');
}
if (!packageJson.scripts?.['test:site-language'] || !packageJson.scripts?.verify?.includes('npm run test:site-language')) {
  errors.push('Public-page language regression tests must be included in the verification command.');
}
if (!packageJson.scripts?.['test:lockfile'] || !packageJson.scripts?.verify?.includes('npm run test:lockfile')) {
  errors.push('The main verification command must run regression tests for the lockfile validator.');
}
if (!packageJson.scripts?.['check:lockfile'] || !packageJson.scripts?.verify?.includes('npm run check:lockfile')) {
  errors.push('The main verification command must require a valid reproducible npm lockfile.');
}
if (!packageJson.scripts?.['test:lockfile']) {
  errors.push('The dependency lockfile checker must have dependency-free regression tests.');
}
if (packageJson.scripts?.['audit:deps'] !== 'npm audit --audit-level=high') {
  errors.push('A high-severity dependency audit command must be available.');
}
const ciWorkflow = existsSync(join(root, '.github/workflows/ci.yml'))
  ? readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8') : '';
if (!ciWorkflow.includes('npm run audit:deps')) {
  errors.push('CI must invoke the package-defined high-severity dependency audit script (npm run audit:deps).');
}
if (!ciWorkflow.includes('npm ci --no-audit --no-fund') || !ciWorkflow.includes('npm run check:lockfile')) {
  errors.push('The full CI job must validate the committed lockfile and install its exact dependency tree using npm ci.');
}
if (packageJson.devDependencies?.['@playwright/test'] !== '1.64.1' || packageJson.scripts?.['test:e2e'] !== 'playwright test') {
  errors.push('The Playwright end-to-end test runner must be pinned and exposed through npm run test:e2e.');
}
if (!packageJson.scripts?.['verify:release']?.includes('npm run test:e2e')) {
  errors.push('The release verification command must include the browser end-to-end suite.');
}
if (!ciWorkflow.includes('npx playwright install --with-deps chromium') || !ciWorkflow.includes('npm run test:e2e')) {
  errors.push('The full CI job must install Chromium and execute the Playwright end-to-end suite.');
}
const bootstrapWorkflow = existsSync(join(root, '.github/workflows/bootstrap-lockfile.yml'))
  ? readFileSync(join(root, '.github/workflows/bootstrap-lockfile.yml'), 'utf8') : '';
if (!bootstrapWorkflow.includes('npm install --package-lock-only --ignore-scripts --no-audit --no-fund') || !bootstrapWorkflow.includes('actions/upload-artifact@v7.0.2')) {
  errors.push('A manual lockfile-bootstrap workflow must generate a real npm lockfile and publish it as a reviewable artifact.');
}


if (packageJson.name !== 'tic-tac-toe' || packageJson.version !== '1.0.0') {
  errors.push('Final release identity must be package name tic-tac-toe and package version 1.0.0 (display version v1.00).');
}
const webManifest = JSON.parse(readFileSync(join(root, 'public/site.webmanifest'), 'utf8'));
if (webManifest.name !== 'tic-tac-toe' || webManifest.short_name !== 'tic-tac-toe') {
  errors.push('Web app manifest name and short_name must match tic-tac-toe.');
}
if (!index.includes('<title>tic-tac-toe v1.00 — Free Strategy Game</title>') || !index.includes('property="og:site_name" content="tic-tac-toe"')) {
  errors.push('Index title and Open Graph site name must use the final tic-tac-toe v1.00 identity.');
}
for (const page of publicPages) {
  const content = readFileSync(join(root, 'public', page), 'utf8');
  if (/Tic-Tac-Toe Ultimate|ULTIMATE<\/small>/.test(content)) {
    errors.push(`${page} still contains retired public product branding.`);
  }
  if (!content.includes('tic-tac-toe v1.00')) {
    errors.push(`${page} must display the final product/version identity tic-tac-toe v1.00.`);
  }
}


const releaseWorkflow = existsSync(join(root, '.github/workflows/release-v100-artifact.yml'))
  ? readFileSync(join(root, '.github/workflows/release-v100-artifact.yml'), 'utf8') : '';
if (!releaseWorkflow.includes('npm run verify:release') || !releaseWorkflow.includes('npm ci --no-audit --no-fund') || !releaseWorkflow.includes('name: tic-tac-toe-v1.00-dist')) {
  errors.push('The manual v1.00 release-artifact workflow must require npm ci, the release verification suite, and export the production dist artifact.');
}
if (!packageJson.scripts?.['test:release-metadata'] || !packageJson.scripts?.verify?.includes('npm run test:release-metadata')) {
  errors.push('Release identity regression tests must be included in the main verification command.');
}

if (errors.length) {
  console.error('Site readiness check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Site readiness check passed (${requiredFiles.length} key files, bilingual page checks, lockfile bootstrap, and Playwright release-test wiring).`);
}
