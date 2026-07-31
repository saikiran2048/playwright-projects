import { test as base, APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { config } from '../config/env';

type ApiFixtures = {
  /**
   * A pre-authenticated APIRequestContext, base-URLed to the API and
   * carrying the bearer token already. Independent of any browser/page —
   * pure HTTP, which is what makes API-only specs (tests/api/) fast.
   */
  apiContext: APIRequestContext;
};

type ApiWorkerFixtures = {
  /**
   * WORKER-scoped: a brand-new, throwaway account registered via API once
   * per worker — NOT the shared TEST_USER_EMAIL account. This is what
   * makes fullyParallel safe: each worker gets its own isolated sandbox
   * for booking-history state, instead of every worker colliding on one
   * account's booking limits. config.testUser stays reserved for
   * login.spec.ts, which specifically needs a known, real account to
   * verify the login form itself.
   */
  workerTestUser: { email: string; password: string; token: string };

  /** Thin derived fixture — just the token from workerTestUser. */
  authToken: string;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  workerTestUser: [
    async ({ playwright }, use) => {
      const email = faker.internet.email().toLowerCase();
      const password = 'TestPass123!';

      const setupContext = await playwright.request.newContext({
        baseURL: config.apiBaseUrl,
      });
      const response = await setupContext.post('auth/register', {
        data: { email, password },
      });
      if (!response.ok()) {
        throw new Error(
          `Worker test user registration failed: ${response.status()} ${await response.text()}`
        );
      }
      const body = await response.json();
      await setupContext.dispose();

      await use({ email, password, token: body.token });
    },
    { scope: 'worker' },
  ],

  authToken: [
    async ({ workerTestUser }, use) => {
      await use(workerTestUser.token);
    },
    { scope: 'worker' },
  ],

  // TEST-scoped: a fresh context per test (so response state from one test
  // can't leak into another via a shared context), pre-configured with
  // baseURL and the cached bearer token — no repeated login/registration.
  apiContext: async ({ playwright, authToken }, use) => {
    const context = await playwright.request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';