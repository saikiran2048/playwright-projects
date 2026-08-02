import { test, expect } from '../../fixtures/pageFixtures';

test.describe('Visual regression', () => {
  // Login page chosen deliberately: no booking/event data, no logged-in
  // user email in the navbar — nothing dynamic to mask or drift over time.
  test('login page matches baseline', { tag: '@visual' }, async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-page.png');
  });
});