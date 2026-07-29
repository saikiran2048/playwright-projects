import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { BookingsPage } from '../pages/BookingsPage';
import { BookingDetailPage } from '../pages/BookingDetailPage';

type PageObjectFixtures = {
  loginPage: LoginPage;
  eventsPage: EventsPage;
  eventDetailPage: EventDetailPage;
  bookingsPage: BookingsPage;
  bookingDetailPage: BookingDetailPage;
};

type AuthFixtures = {
  /**
   * A `page` that's already logged in. OPT-IN — tests that need to test
   * the login flow itself (login.spec.ts) request plain `page` instead.
   * Today this logs in through the UI every time. Stage 8 swaps the
   * internals for storageState reuse — no test file changes when that
   * happens, since the fixture NAME and return type stay identical.
   */
  authenticatedPage: Page;
};

export const test = base.extend<PageObjectFixtures & AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Depends on `page` (built-in) AND `loginPage` (defined above) —
  // fixtures depending on other custom fixtures, not just built-ins.
  authenticatedPage: async ({ page, loginPage }, use) => {
    await loginPage.open();
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );
    await use(page);
  },

  // These four screens are unreachable without an authenticated session
  // (the app redirects to /login otherwise), so they depend on
  // authenticatedPage rather than raw page. Requesting `eventsPage` alone
  // is enough to trigger login — no need to also request authenticatedPage
  // unless the test needs the Page object itself for a URL assertion.
  eventsPage: async ({ authenticatedPage }, use) => {
    await use(new EventsPage(authenticatedPage));
  },
  eventDetailPage: async ({ authenticatedPage }, use) => {
    await use(new EventDetailPage(authenticatedPage));
  },
  bookingsPage: async ({ authenticatedPage }, use) => {
    await use(new BookingsPage(authenticatedPage));
  },
  bookingDetailPage: async ({ authenticatedPage }, use) => {
    await use(new BookingDetailPage(authenticatedPage));
  },
});

export { expect } from '@playwright/test';