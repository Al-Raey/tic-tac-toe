# Verification — tic-tac-toe v1.00

**Release status: PARTIALLY VERIFIED — NOT YET READY FOR PUBLIC RELEASE.**

Verification date: 24 October 2026. This report records commands actually executed in the authoring environment after the v1.00 branding changes.

## Passed checks

| Command or check | Status | Observed result |
|---|---|---|
| `npm run test:release-metadata` | PASS | 14 checks: package name/version, manifest, index metadata, app heading, localized version label, and five public pages. |
| `npm run test:lockfile` | PASS | 9 lockfile-validator fixture scenarios. This tests checker logic only; it does not create the production lockfile. |
| `npm run check:site` | PASS | 16 key files, bilingual public-page checks, release identity, release-workflow wiring, and advertising defaults. |
| `npm run test:site-language` | PASS | 4 scenarios covering restore, persistence/merge, browser fallback, and unavailable storage. |
| `node --check public/site.js` | PASS | No JavaScript syntax error. |
| `node --check scripts/check-site.mjs` | PASS | No JavaScript syntax error. |
| `node --check scripts/test-release-metadata.mjs` | PASS | No JavaScript syntax error. |
| `node --check scripts/check-lockfile.mjs` | PASS | No JavaScript syntax error. |
| `node --check scripts/test-lockfile.mjs` | PASS | No JavaScript syntax error. |
| `node --check scripts/test-site-language.mjs` | PASS | No JavaScript syntax error. |
| Strict standalone core TypeScript compile | PASS | `tsc --target ES2023 --lib ES2023,DOM --module commonjs --moduleResolution node --strict --noUnusedLocals --noUnusedParameters --noFallthroughCasesInSwitch --noUncheckedIndexedAccess --skipLibCheck --outDir /tmp/tic-tac-toe-v100-core-compiled src/engine/game.ts src/engine/ai.ts src/lib/storage.ts src/lib/i18n.ts src/lib/sound.ts` completed with exit code 0. |
| JSON syntax | PASS | `package.json` and `public/site.webmanifest` parsed successfully. |
| Workflow YAML syntax | PASS | PyYAML parsed `.github/workflows/ci.yml`, `.github/workflows/bootstrap-lockfile.yml`, and `.github/workflows/release-v100-artifact.yml`; job definitions were present. |

## Blocked or failed release gates

| Command or check | Status | Observed result / reason |
|---|---|---|
| `npm ping --fetch-timeout=10000 --fetch-retries=0` | BLOCKED | DNS lookup failure: `EAI_AGAIN registry.npmjs.org`. |
| `npm run check:lockfile` | FAIL / RELEASE BLOCKER | No `package-lock.json` exists. A fabricated lockfile was deliberately not created. |
| `npm test` | BLOCKED | `vitest: not found` because dependencies are not installed. Exit code 127. |
| `npm run typecheck` | BLOCKED | Full application graph cannot resolve React, Testing Library, Vitest, Vite, Playwright, and related types because dependencies are absent. The resulting TypeScript errors are not treated as code-verified failures. |
| `npm run build` | BLOCKED | Production build could not run because React/Vite and test dependencies are absent; no `dist/` artifact was created. |
| `npm run audit:deps` | BLOCKED | npm audit returned `ENOLOCK` because there is no lockfile and registry access is unavailable. |
| `npm run test:e2e` | BLOCKED | `@playwright/test` is not installed in this workspace. Browser tests are configured but not executed. |
| Chromium smoke test of public pages on local HTTP server | BLOCKED | Browser navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR` for the local test server in this environment; this is an environment restriction, not evidence of a site runtime defect. |
| GitHub Actions execution | NOT RUN | No Git repository or remote was provided in the archive; no remote CI run could be triggered or inspected. |
| Public deployment and live smoke tests | NOT RUN | No hosting project, production domain, Git remote, or deployment credentials were supplied. No public URL is claimed. |

## Required next steps before release

1. Upload the source to an authorized GitHub repository or use another authorized network-enabled CI runner.
2. Run **Actions → Bootstrap and verify tic-tac-toe lockfile**. Review the `ttu-package-lock` artifact and commit the genuine `package-lock.json`.
3. Confirm the regular CI workflow succeeds, including `npm ci`, `npm run verify`, security audit, and Playwright browser tests.
4. Run **Build tic-tac-toe v1.00 release artifact** and download `tic-tac-toe-v1.00-dist`.
5. Configure the chosen static host and real domain, add a monitored contact channel, and review the privacy/terms pages.
6. Deploy the actual `dist/` artifact using authorized credentials and test the live URL.

Passing a static-site check or a standalone core compilation does not prove that the full React build, full test suite, or production deployment has passed.
