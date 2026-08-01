import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env';

export default defineConfig({
  testDir: './tests',

  // Whole-test budget (navigation + actions + assertions combined)
  timeout: 90_000, // bumped again — 45s still isn't enough during full-suite CI runs

  expect: {
    // How long a single assertion retries before failing
    timeout: 5_000,
  },

  // Solved for real in Stage 11 rather than deferred further: each worker
  // now registers its own throwaway account via API (see workerTestUser in
  // apiFixtures.ts) instead of every worker sharing TEST_USER_EMAIL. No
  // more collisions on shared booking-history limits.
  fullyParallel: true,

  // Local run hit a real contention failure once (TC-011, "Target page,
  // context or browser has been closed") running all 3 browser projects
  // at full default parallelism on one machine — confirmed via
  // --repeat-each=5 in isolation (5/5 pass), so it was resource pressure,
  // not a flaky test. CI avoids this differently (see the workflow's
  // matrix — one browser per job, one job per runner VM). Locally, 4 is a
  // starting point — tune to your own CPU core count, not a fixed rule.
  workers: process.env.CI ? undefined : 4,

  retries: process.env.CI ? 2 : 0,

  // Three reporters, three audiences: HTML for local debugging (own report
  // per browser project — see the matrix in the CI workflow), JUnit XML
  // for CI tooling that parses it natively (Jenkins/Azure DevOps), Allure
  // for a stakeholder-facing report with history trends. `open: 'never'`
  // stops the html reporter trying to launch a browser in CI.
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: config.baseUrl,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 'on-first-retry' only captures a trace when a test RETRIES — and
    // retries is 0 locally, so every local failure this session
    // (the count() timing bug, the API baseURL bug) had NO trace to
    // inspect, only error text. 'retain-on-failure' records every test
    // always, discards it on pass, keeps it on any failure — retried
    // or not. Slightly more overhead (always recording), worth it to
    // never be without a trace when something breaks locally.
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});