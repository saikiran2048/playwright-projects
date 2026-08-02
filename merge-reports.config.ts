import { defineConfig } from '@playwright/test';

// Used ONLY by `npx playwright merge-reports --config=...` in CI. Separate
// from the main playwright.config.ts because merge-reports needs its own
// reporter set — html for the human-readable report, json for the raw
// pass/fail stats scripts/build-email-summary.js reads to compute the
// pass rate for the regression email.
export default defineConfig({
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'reports/merged-results.json' }],
  ],
});