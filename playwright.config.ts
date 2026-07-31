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

  // false for now: all tests share one login account (TEST_USER_EMAIL),
  // and the app's booking-history limits are scoped to that account, not
  // to the per-booking customer email — so parallel tests would still
  // collide on shared account state. Stage 11 addresses this properly
  // (multiple test accounts) rather than working around it here.
  fullyParallel: false,

  retries: process.env.CI ? 2 : 0,

  reporter: 'html',

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
  ],
});