import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packagePath = resolve(root, 'package.json');
const lockPath = resolve(root, 'package-lock.json');
const errors = [];

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`Cannot read ${label}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

if (!existsSync(packagePath)) {
  errors.push('Missing package.json. Run this check from the project root.');
}
if (!existsSync(lockPath)) {
  errors.push('Missing package-lock.json. On a network-connected machine, run `npm install --no-audit --no-fund`, review the generated lockfile, and commit it. CI uses `npm ci` and will not resolve floating dependency ranges.');
}

const manifest = existsSync(packagePath) ? readJson(packagePath, 'package.json') : null;
const lock = existsSync(lockPath) ? readJson(lockPath, 'package-lock.json') : null;

if (manifest && lock) {
  if (lock.lockfileVersion !== 3) {
    errors.push(`Expected npm lockfileVersion 3 for the declared npm toolchain; found ${String(lock.lockfileVersion)}.`);
  }
  if (lock.name !== manifest.name) errors.push('package-lock.json top-level package name does not match package.json.');
  if (lock.version !== manifest.version) errors.push('package-lock.json top-level package version does not match package.json.');

  if (!lock.packages || typeof lock.packages !== 'object' || !lock.packages['']) {
    errors.push('Lockfile must contain the root package entry at packages[""].');
  } else {
    const lockedRoot = lock.packages[''];
    if (lockedRoot.name !== manifest.name) errors.push('package-lock.json root package name does not match package.json.');
    if (lockedRoot.version !== manifest.version) errors.push('package-lock.json root package version does not match package.json.');

    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      const declared = manifest[section] ?? {};
      const locked = lockedRoot[section] ?? {};
      if (JSON.stringify(stable(declared)) !== JSON.stringify(stable(locked))) {
        errors.push(`package-lock.json root ${section} does not match package.json.`);
      }
      for (const name of Object.keys(declared)) {
        const packagePath = `node_modules/${name}`;
        const entry = lock.packages[packagePath];
        if (!entry) {
          errors.push(`Lockfile is missing the installed package entry for ${name}.`);
        } else if (typeof entry.version !== 'string' || entry.version.length === 0) {
          errors.push(`Lockfile package entry for ${name} must specify a resolved version.`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error('Reproducible dependency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Dependency lockfile manifest check passed (npm lockfile v3 metadata, root manifest sections, and direct package entries are consistent). Run `npm ci` to verify dependency-tree reproducibility.');
}
