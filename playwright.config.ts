import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env';

export default defineConfig({
  testDir: './tests',

  // Whole-test budget (navigation + actions + assertions combined)
  timeout: 30_000,

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

  // Four reporters now: HTML for local debugging, JUnit XML for CI-tool
  // parsing, Allure for stakeholder-facing trend reports, and blob — blob
  // is what makes SHARDING viable: each shard only sees its own slice of
  // tests, so each shard's own html/junit/allure output is incomplete on
  // its own. blob produces a compact per-shard result file that a separate
  // merge step (see regression.yml) combines into one full report.
  reporter: [
    ['html', { open: 'never' }],
    ['blob'],
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
    // Visual regression EXCLUDED from all 3 functional projects — it gets
    // its own dedicated project below instead, scoped to one browser only.
    { name: 'chromium', testIgnore: /visual-regression\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: /visual-regression\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testIgnore: /visual-regression\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
    // Chromium only, deliberately — screenshots are render-engine specific.
    // A Firefox screenshot compared against a Chromium baseline is a
    // meaningless diff, not a real regression signal.
    { name: 'visual', testMatch: /visual-regression\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
});