import { test, expect } from '../../fixtures/pageFixtures';

test.describe('Events listing', () => {
  // Requesting eventsPage alone is enough — its fixture depends on
  // authenticatedPage, so login already happened before this body runs.
  test('shows at least one event with a Book Now action', { tag: '@smoke' }, async ({
    eventsPage,
  }) => {
    await eventsPage.open();

    const count = await eventsPage.eventCount();
    expect(count).toBeGreaterThan(0);
    await expect(eventsPage.eventCard(0)).toBeVisible();
  });

  test('clicking Book Now navigates to the event detail page', { tag: '@regression' }, async ({
    authenticatedPage,
    eventsPage,
  }) => {
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    await expect(authenticatedPage).toHaveURL(/\/events\/\d+/);
  });
});