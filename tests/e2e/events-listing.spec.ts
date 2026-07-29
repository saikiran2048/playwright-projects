import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { EventsPage } from '../../pages/EventsPage';

test.describe('Events listing', () => {
  test('shows at least one event with a Book Now action', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );

    const eventsPage = new EventsPage(page);
    await eventsPage.open();

    const count = await eventsPage.eventCount();
    expect(count).toBeGreaterThan(0);
    await expect(eventsPage.eventCard(0)).toBeVisible();
  });

  test('clicking Book Now navigates to the event detail page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );

    const eventsPage = new EventsPage(page);
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    await expect(page).toHaveURL(/\/events\/\d+/);
  });
});