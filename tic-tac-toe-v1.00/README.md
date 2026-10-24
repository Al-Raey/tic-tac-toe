# tic-tac-toe v1.00

**Product:** `tic-tac-toe`  
**Display version:** `v1.00`  
**Package version:** `1.0.0`


Version 1.00 of a responsive, local-first tic-tac-toe game built with React 18, strict TypeScript, Vite, and CSS. No account, game backend, or external assets are required. The project now includes bilingual public information pages and a dormant, environment-gated advertising integration for future monetization.

## Product features

- **Three modes:** Player vs AI, two players on one device, and practice mode (excluded from competitive records).
- **Five AI levels:** Easy makes random legal moves; Medium spots immediate wins and blocks with lightweight positional strategy; Hard searches several plies ahead and can miss deeper tactics; Very Hard uses near-perfect Minimax with rare controlled strategic mistakes; Impossible uses full alpha-beta-pruned Minimax and cannot be forced to lose with optimal play. Descriptions are localized in English and Arabic.
- **Game flow:** X/O side selection, turn feedback, winning-line animation, scorecards, independent round numbering, restart round, and confirmed new-match/settings changes.
- **Practice tools:** Undo, non-mutating move hints, ordered move history, and keyboard board navigation.
- **Preferences:** Dark/light theme, English/Arabic localization with RTL layout, synthesized sound effects, saved locally.
- **Statistics:** Cross-mode totals remain consistent (matches, combined human/player wins, AI wins, and draws), with a separate X/O breakdown in local two-player mode and current/best human winning streaks against the AI. Practice rounds do not change competitive records.
- **Persistence:** Settings, statistics, active board, round number, and match score are saved locally. Restored game state is validated by replaying its move history.
- **Public pages:** About, original strategy guide, privacy policy, terms of use, and contact page, each in English and Arabic.
- **SEO basics:** Page titles/descriptions, Open Graph metadata, robots.txt, favicon, and web app manifest. Add canonical URLs and a sitemap after choosing the production domain.
- **Advertising scaffold:** A Google AdSense slot exists but is disabled by default and has no publisher or ad-unit IDs configured.
- **Quality workflow:** Site readiness and language regression checks, lockfile validation, Vitest unit/component tests, full TypeScript checks, production build, Playwright Chromium end-to-end tests, and GitHub Actions CI. A manual lockfile-bootstrap workflow can generate and validate a genuine lockfile on an online runner and export it for maintainer review.

## Requirements

- Node.js 22.12 or newer (enforced by the project package metadata)
- npm

## Install dependencies and run locally

The repository requires a committed `package-lock.json` for repeatable CI installs. This archive currently does not include that file because the authoring environment could not resolve `registry.npmjs.org`.

On a network-connected machine, bootstrap the lockfile once, review it, and commit it:

```bash
npm install --no-audit --no-fund
npm run check:lockfile
```

If the project is hosted on GitHub and the archive still has no lockfile, run **Actions → Bootstrap and verify tic-tac-toe lockfile → Run workflow**. That workflow generates the lockfile using the real npm registry, validates it with `npm ci`, runs verification, and uploads `ttu-package-lock` for review. Download that artifact and commit the reviewed `package-lock.json`; the workflow does not push to your repository.

Alternatively, on a network-connected maintainer machine, generate and review the lockfile directly:

```bash
npm install --no-audit --no-fund
npm run check:lockfile
npm ci --no-audit --no-fund
```

Use the reproducible install for normal work and CI:

```bash
npm ci --no-audit --no-fund
npm run dev
```

Vite prints a local development URL, typically `http://localhost:5173`.

## Verify and build

```bash
npm run check:lockfile
npm run check:site
npm run test:site-language
npm run test:lockfile
npm test
npm run typecheck
npm run build
npm run preview
```

Or run the full unit/type/build chain with `npm run verify`. It starts by running the lockfile-validator regression tests and then requires a real, consistent `package-lock.json`. Run `npx playwright install chromium` once, then use `npm run verify:release` to include the Playwright browser suite against the production preview. The CI workflow installs Chromium automatically. Public-page language behavior and lockfile validation also have dependency-free Node.js regression tests. The production output is written to `dist/`; deploy that folder to a static host. The `vite preview` server is for local verification, not a production server.

## Local persistence

Settings, statistics, and game session are stored in the browser (`ttu.settings.v1`, `ttu.statistics.v1`, and `ttu.session.v1`). The game code does not send this saved game data to a backend. Clearing browser storage removes the saved local state.

## Monetization: disabled until owner setup

Copy `.env.example` to `.env` only when needed. Do not enable ads before the production site is approved by the advertising provider and the required privacy/consent controls are ready and verified. `VITE_ADSENSE_CONSENT_READY=true` is only an owner configuration acknowledgement; it is not a user's consent and does not implement a consent-management platform. The component additionally requires the runtime status `window.__TTU_AD_CONSENT_STATUS__ = 'granted'` and a `ttu:ad-consent-change` event from a real CMP adapter. No CMP is shipped or configured, so ads remain off unless a real integration is implemented and tested.

```dotenv
VITE_ADSENSE_ENABLED=false
VITE_ADSENSE_CONSENT_READY=false
VITE_ADSENSE_CLIENT=
VITE_ADSENSE_SLOT_GAME=
```

The current runtime consent status defaults to `unknown`; setting environment variables alone cannot authorize an ad request. A real CMP integration must set the runtime status only after recording the user's valid choice and emit `ttu:ad-consent-change`. Do not set the runtime flag manually or treat this interface as a CMP. Ads remain off until that integration is implemented, tested, and approved. Do not commit `.env`, invent an `ads.txt` line, or claim revenue until ads are approved and serving.

Read [`SITE_LAUNCH_CHECKLIST.md`](./SITE_LAUNCH_CHECKLIST.md) for the remaining domain, contact, legal review, deployment, SEO, and publisher-account tasks.

## Environment verification note

The checked-in `.env.example` intentionally keeps advertising and consent-readiness disabled. Copy it to a private local environment file only when configuring the integration; never commit real publisher IDs or credentials.

At the Phase 6 verification run, the environment still could not resolve `registry.npmjs.org`, and the package-lock-only install timed out. This means the actual `package-lock.json` is deliberately absent: do not use a fabricated lockfile. Dependency-free site checks, language tests, nine lockfile-validator scenarios, strict standalone core TypeScript compilation, TypeScript syntax transpilation, and exhaustive Tic-Tac-Toe engine/AI checks passed. The complete React/Vitest suite, installed dependency audit, full typecheck, production build, and Playwright suite remain blocked until a real lockfile and dependencies are available.

CI has a dependency-free static-site job and a separate full-verification job that requires a committed npm lockfile and uses `npm ci`; the full job installs Chromium and runs the Playwright end-to-end suite. The manually triggered `Bootstrap and verify tic-tac-toe lockfile` workflow is provided for an online runner: it generates a real lockfile, proves `npm ci`, uploads the lockfile artifact for maintainer review, then attempts the full checks. It does not push changes to the repository. Until the lockfile is reviewed and committed and the full checks pass, the project remains partially verified. A blocked command is not a passing test.


## Final v1.00 release status

The source tree is branded as `tic-tac-toe v1.00` (package version `1.0.0`). A dependency-free release-metadata test and a manual GitHub Actions workflow are included. The workflow can produce the verified `dist/` artifact as `tic-tac-toe-v1.00-dist` only after a genuine `package-lock.json` has been generated, reviewed, and committed. The authoring environment currently cannot resolve `registry.npmjs.org`, and this archive has no Git remote, hosting project, domain, or deployment credentials. Therefore no public deployment or successful full production build is claimed. Run the lockfile bootstrap workflow, commit the verified lockfile, pass `npm run verify:release`, then run **Build tic-tac-toe v1.00 release artifact**. Upload the resulting `dist/` to the chosen authorized static host and perform live smoke tests.
