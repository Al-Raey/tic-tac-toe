# Commercial launch checklist

This repository is prepared for a static website deployment, but the site has **not** been deployed or approved for advertising. Do not describe it as monetized until the publisher account, live site, and ad network approval are complete.

## Complete these owner-specific items before launch

- [ ] Choose and register the domain; connect it to a static host with HTTPS.
- [ ] Publish the site and verify `/`, `/about.html`, `/guide.html`, `/privacy.html`, `/terms.html`, and `/contact.html` all load over HTTPS.
- [ ] Replace the contact-page launch notice with a real, monitored contact channel. Publish the site operator/business name and a suitable location/jurisdiction statement where applicable.
- [ ] Review the Privacy Policy and Terms with reference to the operator, intended audience, jurisdictions, and actual data flows. The current text is a practical starting point, not legal advice.
- [ ] Recheck every route, game mode, mobile layout, keyboard interaction, Arabic RTL, English LTR, and local-storage restoration on the production URL.
- [ ] Create and verify property ownership in Search Console. Submit a `sitemap.xml` after the real domain is known; do not publish a sitemap containing a placeholder domain.
- [ ] Add useful original content over time (strategy articles, move examples, difficulty-specific lessons, and FAQs). A playable game plus policy pages alone may not be enough for an advertising review.
- [ ] Sign up for an ad publisher account and add the live domain for review. Do not expect ads before approval.
- [ ] Before enabling ads, update the privacy disclosures for actual providers, implement any required consent-management platform and choices for applicable regions, and confirm all pages/placements comply with current network policies.
- [ ] Copy the actual publisher ID and ad unit ID into a private production environment configuration. Set `VITE_ADSENSE_ENABLED=true` only after approval and consent requirements are complete. Never commit `.env`.
- [ ] If the ad provider supplies an `ads.txt` line, publish that exact provider-issued line at `/ads.txt`; do not invent or copy a placeholder publisher ID.
- [ ] Configure backups/source control and keep a dated record of releases and privacy/policy changes.
- [ ] Generate a real `package-lock.json` on a network-connected machine or run the manual GitHub Actions workflow “Bootstrap and verify tic-tac-toe lockfile”. Review the `ttu-package-lock` artifact and commit the lockfile. CI uses `npm ci` and intentionally blocks full verification until the committed lockfile exists.
- [ ] Confirm `npm run verify`, `npm run audit:deps`, production build, and `npm run test:e2e` pass on the release candidate. For local end-to-end testing, install the browser once using `npx playwright install chromium`; CI installs Chromium automatically.


## Automated verification and release gates

- [ ] Generate a real `package-lock.json` on a network-connected machine or run **Actions → Bootstrap and verify tic-tac-toe lockfile**. Review the `ttu-package-lock` artifact and commit the real file; the workflow does not push changes.
- [ ] Confirm `npm ci --no-audit --no-fund` succeeds from a clean checkout with the committed lockfile.
- [ ] Confirm `npm run test:lockfile` passes all nine lockfile-validator scenarios and `npm run test:site-language` passes its four cases.
- [ ] Confirm `npm run audit:deps`, the full Vitest suite, `npm run typecheck`, and `npm run build` pass.
- [ ] Install Chromium using `npx playwright install --with-deps chromium` in CI and confirm all eight Playwright journeys pass against the built app.
- [ ] Confirm `npm run verify:release` passes locally after dependencies and Chromium are installed.
- [ ] Recheck Arabic RTL keyboard navigation and mobile overflow on real browser viewports.
- [ ] Measure production bundle size and runtime performance from a real build; do not infer performance from source inspection.
- [ ] Do not classify the release as ready until the full-verification and browser E2E CI jobs pass.

## AdSense integration defaults

The included `src/lib/AdSlot.tsx` fails closed by default. Even when environment configuration values are set, it renders no ad and loads no ad-network script unless a real consent-management integration also sets runtime status to `granted` after recording the user's choice:

- `VITE_ADSENSE_ENABLED=true`
- `VITE_ADSENSE_CLIENT=ca-pub-...` with a real publisher ID
- `VITE_ADSENSE_SLOT_GAME=...` with a real numeric ad-unit ID
- `VITE_ADSENSE_CONSENT_READY=true` only after a real CMP is configured (this is a readiness flag, not consent)
- `window.__TTU_AD_CONSENT_STATUS__ = 'granted'` set by that CMP adapter, followed by a `ttu:ad-consent-change` event

This guard is a safety switch, **not** a consent-management platform and **not** proof of AdSense approval. No CMP is shipped or configured, so runtime consent stays `unknown` and advertisements remain blocked. Never set the runtime status manually to bypass consent.

## Static deployment

The Vite production output is `dist/`. On Vercel, import the Git repository and use the default Vite detection, build command `npm run build`, and output directory `dist`. Static HTML files in `public/` are copied to the site root. Similar settings work on most static hosts.

Use Node 22. If `package-lock.json` is not present in the GitHub repository, run **Actions → Bootstrap and verify tic-tac-toe lockfile → Run workflow**. Download `ttu-package-lock`, review the generated file, and commit it. The bootstrap workflow does not push to the repository. Once a valid lockfile is committed, use:

```bash
npm ci --no-audit --no-fund
npm run audit:deps
npm run verify
npx playwright install chromium
npm run test:e2e
```

Before AdSense submission, also consult the current [site readiness guidance](https://support.google.com/adsense/answer/7299563?hl=en), [eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en), and [publisher consent requirements](https://support.google.com/adsense/answer/13554116?hl=en).


## Final v1.00 release gates (24 October 2026)

- [ ] Confirm package identity (`tic-tac-toe`, `1.0.0`) and user-visible version (`v1.00`).
- [ ] Generate and commit a genuine `package-lock.json`; pass `npm ci`.
- [ ] Pass `npm run verify:release` in a connected CI runner.
- [ ] Run the manual **Build tic-tac-toe v1.00 release artifact** workflow and inspect `tic-tac-toe-v1.00-dist`.
- [ ] Add a real support contact and complete owner/legal review of public privacy and terms pages.
- [ ] Configure the chosen static host and real production domain (if any); do not invent canonical URLs.
- [ ] Deploy `dist/` using authorized credentials and test the actual public URL on desktop and mobile.
- [ ] Keep advertising disabled unless real provider approval, IDs, and a tested consent-management integration exist.
- [ ] Create release tag `v1.0.0` only after all required checks pass and the owner authorizes publication.
