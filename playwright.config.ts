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
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});