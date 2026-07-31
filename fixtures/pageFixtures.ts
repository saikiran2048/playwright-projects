import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { test as base } from './apiFixtures';
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
    async ({ browser, workerTestUser }, use, workerInfo) => {
      const filePath = path.resolve(
        process.cwd(),
        'storage-state',
        `auth-${workerInfo.workerIndex}.json`
      );
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // A throwaway context, used only to perform the login once and
      // capture the resulting session — not the context any test runs in.
      // Logs in as this worker's own registered account (workerTestUser),
      // NOT the shared config.testUser — that's what keeps workers
      // isolated from each other's booking-history state.
      const setupContext = await browser.newContext();
      const setupPage = await setupContext.newPage();
      const loginPage = new LoginPage(setupPage);
      await loginPage.open();
      await loginPage.login(workerTestUser.email, workerTestUser.password);
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
  //
  // Also captures browser console messages and JS errors — a trace shows
  // the DOM/network timeline, but a console error that fires without
  // changing the DOM won't jump out of a trace's snapshot view the way
  // it does as its own attachment. Only attached to the report on
  // failure, so passing runs don't accumulate noise.
  authenticatedPage: async ({ browser, authStatePath }, use, testInfo) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();

    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`));

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus && consoleLogs.length > 0) {
      await testInfo.attach('browser-console-log', {
        body: consoleLogs.join('\n'),
        contentType: 'text/plain',
      });
    }

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