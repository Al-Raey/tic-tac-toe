import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const checker = new URL('./check-lockfile.mjs', import.meta.url);
const temp = mkdtempSync(join(tmpdir(), 'ttu-lockfile-test-'));
let scenarios = 0;

function writeJson(dir, file, value) {
  writeFileSync(join(dir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createFixture(name, { dependencies = { react: '18.3.1' }, devDependencies = { typescript: '5.7.2' }, lockfileVersion = 3, packageEntries = true } = {}) {
  const dir = join(temp, name);
  mkdirSync(dir);
  const manifest = { name: 'fixture', version: '1.0.0', dependencies, devDependencies };
  const entries = {
    '': { name: manifest.name, version: manifest.version, dependencies: manifest.dependencies, devDependencies: manifest.devDependencies },
  };
  if (packageEntries) {
    for (const pkg of Object.keys(dependencies)) entries[`node_modules/${pkg}`] = { version: dependencies[pkg] };
    for (const pkg of Object.keys(devDependencies)) entries[`node_modules/${pkg}`] = { version: devDependencies[pkg] };
  }
  writeJson(dir, 'package.json', manifest);
  writeJson(dir, 'package-lock.json', {
    name: manifest.name,
    version: manifest.version,
    lockfileVersion,
    requires: true,
    packages: entries,
  });
  return dir;
}

function run(dir) {
  return spawnSync(process.execPath, [checker.pathname], { cwd: dir, encoding: 'utf8' });
}

function expectFailure(dir, messagePattern) {
  const result = run(dir);
  assert.notEqual(result.status, 0, `Expected checker to fail for ${dir}`);
  assert.match(`${result.stderr}\n${result.stdout}`, messagePattern);
  scenarios += 1;
}

try {
  const valid = createFixture('valid');
  const validResult = run(valid);
  assert.equal(validResult.status, 0, validResult.stderr || validResult.stdout);
  assert.match(validResult.stdout, /manifest check passed/);
  scenarios += 1;

  const missing = join(temp, 'missing');
  mkdirSync(missing);
  writeJson(missing, 'package.json', { name: 'fixture', version: '1.0.0', dependencies: { react: '18.3.1' } });
  expectFailure(missing, /Missing package-lock\.json/);

  const mismatch = createFixture('manifest-mismatch');
  const mismatchLock = JSON.parse(readFileSync(join(mismatch, 'package-lock.json'), 'utf8'));
  mismatchLock.packages[''].dependencies.react = '^18.3.1';
  writeJson(mismatch, 'package-lock.json', mismatchLock);
  expectFailure(mismatch, /root dependencies does not match/);

  const badJson = createFixture('invalid-json');
  writeFileSync(join(badJson, 'package-lock.json'), '{not valid json', 'utf8');
  expectFailure(badJson, /Cannot read package-lock\.json/);

  const unsupportedVersion = createFixture('unsupported-lock-version', { lockfileVersion: 2 });
  expectFailure(unsupportedVersion, /Expected npm lockfileVersion 3/);

  const missingEntries = createFixture('missing-entry', { packageEntries: false });
  expectFailure(missingEntries, /missing the installed package entry for react/);

  const unresolvedVersion = createFixture('missing-resolved-version');
  const unresolved = JSON.parse(readFileSync(join(unresolvedVersion, 'package-lock.json'), 'utf8'));
  unresolved.packages['node_modules/react'] = {};
  writeJson(unresolvedVersion, 'package-lock.json', unresolved);
  expectFailure(unresolvedVersion, /must specify a resolved version/);

  const wrongTopLevelName = createFixture('wrong-top-level-name');
  const wrongName = JSON.parse(readFileSync(join(wrongTopLevelName, 'package-lock.json'), 'utf8'));
  wrongName.name = 'another-package';
  writeJson(wrongTopLevelName, 'package-lock.json', wrongName);
  expectFailure(wrongTopLevelName, /top-level package name does not match/);

  const wrongRootName = createFixture('wrong-root-name');
  const rootName = JSON.parse(readFileSync(join(wrongRootName, 'package-lock.json'), 'utf8'));
  rootName.packages[''].name = 'another-package';
  writeJson(wrongRootName, 'package-lock.json', rootName);
  expectFailure(wrongRootName, /root package name does not match/);

  console.log(`Lockfile checker tests passed (${scenarios} scenarios: valid, missing, manifest mismatch, malformed JSON, unsupported lock version, missing package entry, unresolved package version, and metadata mismatches).`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
