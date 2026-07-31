import { test, expect } from '../../fixtures/pageFixtures';
import { config } from '../../config/env';

test.describe('Login', () => {
  // Deliberately does NOT request authenticatedPage — testing login
  // itself requires starting logged out.
  test('valid credentials logs the user in', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(config.testUser.email, config.testUser.password);

    await expect(loginPage.isLoggedIn()).toBeVisible();
  });
});