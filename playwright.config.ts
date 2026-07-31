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

  retries: process.env.CI ? 2 : 0,

  reporter: 'html',
  workers: process.env.CI ? undefined : 4,

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