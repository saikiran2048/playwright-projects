import { test, expect } from '../../fixtures/pageFixtures';

test.describe('Login', () => {
  // Deliberately does NOT request authenticatedPage — testing login
  // itself requires starting logged out.
  test('valid credentials logs the user in', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );

    await expect(loginPage.isLoggedIn()).toBeVisible();
  });
});