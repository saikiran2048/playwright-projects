# EventHub — Playwright Automation Framework

An enterprise-style Playwright + TypeScript test automation framework built against [EventHub](https://eventhub.rahulshettyacademy.com), an event ticket booking platform (Next.js frontend, Express/Prisma backend).

The framework covers UI, API, and hybrid API+UI testing, with worker-scoped authentication, cross-browser parallel execution, visual regression, and a CI/CD pipeline that shards tests across runners, merges the results, and publishes an Allure trend report.

## Stack

| | |
|---|---|
| **Test runner** | `@playwright/test` |
| **Language** | TypeScript |
| **Reporting** | HTML, JUnit XML, Allure (with GitHub Pages trend history) |
| **Test data** | `@faker-js/faker` (dynamic), static JSON/YAML (fixed reference data) |
| **CI/CD** | GitHub Actions |
| **Target app** | `https://eventhub.rahulshettyacademy.com` |
| **API** | `https://api.eventhub.rahulshettyacademy.com/api` |

## Getting started

```bash
# install dependencies
npm install

# install browser binaries (one-time)
npx playwright install

# copy env template and fill in test credentials
cp .env.example .env
```

## Running tests

```bash
npm test                    # full suite, headless, all browsers
npm run test:smoke          # tests tagged @smoke
npm run test:regression     # tests tagged @regression
npm run test:visual         # visual regression only (chromium)
npm run test:visual:update  # regenerate visual baselines
npm run test:headed         # run with a visible browser
npm run test:ui             # Playwright UI mode (interactive, time-travel debugging)
npm run test:debug          # step-through debugger
npm run report              # open the last HTML report
npm run report:allure       # generate + open the Allure report
```

Target a specific browser project with `--project`:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Project structure

```
eventhub-framework/
├── .env.example
├── .env.dev / .env.qa / .env.uat   # env-specific, non-secret (BASE_URL, API_BASE_URL)
├── .github/
│   └── workflows/
│       ├── smoke.yml               # runs on push/PR — cross-browser matrix + visual
│       └── regression.yml          # nightly + on push — sharded, merged, emailed, published
├── config/
│   └── env.ts                      # loads .env.<ENV>, then .env, validates required vars
├── fixtures/
│   ├── apiFixtures.ts              # worker-scoped throwaway account + API context
│   └── pageFixtures.ts             # page objects, cached auth session, console-log capture
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── EventsPage.ts
│   ├── EventDetailPage.ts
│   ├── BookingsPage.ts
│   ├── BookingDetailPage.ts
│   └── components/                 # reusable UI components composed into page objects
│       ├── BookingForm.ts
│       ├── ConfirmDialog.ts
│       └── QuantitySelector.ts
├── scripts/
│   └── build-email-summary.js      # builds the HTML email body from merged Allure stats
├── test-data/                      # static reference data (populated as needed)
├── tests/
│   ├── api/
│   │   └── booking-api.spec.ts     # pure HTTP, no browser
│   └── e2e/
│       ├── login.spec.ts
│       ├── events-listing.spec.ts
│       ├── booking-flow.spec.ts
│       ├── booking-api-ui-hybrid.spec.ts   # API setup + UI verification
│       └── visual-regression.spec.ts
├── utils/
│   └── CustomerDataBuilder.ts      # dynamic test data via faker
├── merge-reports.config.ts         # config for merging sharded blob reports
├── playwright.config.ts
└── tsconfig.json
```

## Environment variables

Configuration is split between **env-specific, non-secret** values and **secrets**:

- `.env.dev`, `.env.qa`, `.env.uat` — committed, hold `BASE_URL` and `API_BASE_URL` per environment
- `.env` — gitignored, holds `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; copy from `.env.example`
- `ENV` — selects which `.env.<ENV>` file loads (defaults to `dev`)

In CI, secrets arrive as GitHub Secrets rather than a `.env` file. Run against a specific environment with:

```bash
ENV=qa npx playwright test
```

## Framework highlights

- **Page Object Model with component composition** — shared UI pieces (`BookingForm`, `ConfirmDialog`, `QuantitySelector`) are built once and composed into page objects instead of duplicated across them.
- **Worker-scoped authentication** — each parallel worker registers its own throwaway account via the API and logs in through the UI exactly once, caching the session to disk. Every test in that worker reuses the cached session instead of repeating the login flow, and each worker gets an isolated account so booking-history state can't collide across parallel tests.
- **API + UI hybrid tests** — `booking-api-ui-hybrid.spec.ts` sets up state via direct API calls and verifies the result in the UI, keeping setup fast while still validating the real user-facing flow.
- **Visual regression** — scoped to a dedicated `visual` project on Chromium only, since screenshot baselines are render-engine specific and a Firefox capture would never match a Chromium baseline.
- **Debugging artifacts on failure** — screenshots, video, and traces are captured `on-failure`/`retain-on-failure`, plus browser console/JS errors are attached to failing tests so a broken assertion doesn't require a local re-run to diagnose.
- **Cross-browser, parallel by default** — Chromium, Firefox, and WebKit each run as their own project, `fullyParallel` locally and further sharded per-project in CI.
- **Four-reporter setup** — HTML for local debugging, JUnit XML for CI tooling, Allure for stakeholder-facing trend reports, and `blob` — the format that makes sharded CI runs mergeable into one report afterward.

## CI/CD

Two GitHub Actions workflows:

- **`smoke.yml`** — runs on every push/PR to `main`/`master`. Executes `@smoke`-tagged tests across a Chromium/Firefox/WebKit matrix plus a dedicated visual-regression job, uploading each project's HTML report.
- **`regression.yml`** — runs on push to `main`/`master`, nightly at 02:00 UTC, and on manual dispatch. Splits the full suite across a browser × shard matrix (3 browsers × 2 shards = 6 parallel jobs), then:
  1. Merges all sharded `blob-report` outputs into one HTML report
  2. Builds and emails an HTML summary (pass rate, totals, failures) via Gmail SMTP
  3. Merges Allure results, pulls prior run history from the live GitHub Pages site so trend graphs stay continuous, and regenerates the report
  4. Publishes the merged Allure report to GitHub Pages

## Notes on design decisions

A few non-obvious choices are documented inline where they live, rather than only here:

- Why `fullyParallel` is safe (per-worker throwaway accounts) — `playwright.config.ts`, `fixtures/apiFixtures.ts`
- Why `trace: 'retain-on-failure'` instead of `on-first-retry` — `playwright.config.ts`
- Why visual regression gets its own project instead of running inside the three functional ones — `playwright.config.ts`
- Why Allure history is fetched from the live Pages site before each regression run — `.github/workflows/regression.yml`

## Roadmap

- [x] Stage 0 — Project setup & tooling
- [x] Stage 1 — Config layer (`playwright.config.ts`)
- [x] Stage 2 — Folder structure
- [x] Stage 3 — Page Object Model
- [x] Stage 4 — Component objects & composition
- [x] Stage 5 — Fixtures & dependency injection
- [x] Stage 6 — Test data strategy
- [x] Stage 7 — Environment management
- [x] Stage 8 — Authentication & session management
- [x] Stage 9 — API + UI hybrid testing
- [x] Stage 10 — Debugging artifacts (screenshots/video/trace)
- [x] Stage 11 — Parallelism & cross-browser execution
- [x] Stage 12 — Reporting
- [x] Stage 13 — Flaky-test handling & CI/CD
