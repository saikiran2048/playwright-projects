import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { test as base } from './apiFixtures';
import { config } from '../config/env';
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
   *
   * Internally creates its OWN context from the cached storage state
   * (see authStatePath below) rather than reusing the built-in `page`
   * fixture's default logged-out context.
   */
  authenticatedPage: Page;
};

type WorkerFixtures = {
  /**
   * WORKER-scoped: real UI login happens exactly once per worker, not
   * once per test. Every test in this worker reuses the same cached
   * session file via authenticatedPage below.
   */
  authStatePath: string;
};

export const test = base.extend<PageObjectFixtures & AuthFixtures, WorkerFixtures>({
  authStatePath: [
    async ({ browser }, use, workerInfo) => {
      const filePath = path.resolve(
        process.cwd(),
        'storage-state',
        `auth-${workerInfo.workerIndex}.json`
      );
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // A throwaway context, used only to perform the login once and
      // capture the resulting session — not the context any test runs in.
      const setupContext = await browser.newContext();
      const setupPage = await setupContext.newPage();
      const loginPage = new LoginPage(setupPage);
      await loginPage.open();
      await loginPage.login(config.testUser.email, config.testUser.password);
      await setupContext.storageState({ path: filePath });
      await setupContext.close();

      await use(filePath);
    },
    { scope: 'worker' },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Creates a fresh context PER TEST (test isolation preserved — no state
  // leaking between tests) but skips the login UI entirely by seeding
  // that context from the worker's cached storage state.
  authenticatedPage: async ({ browser, authStatePath }, use) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();
    await use(page);
    await context.close();
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