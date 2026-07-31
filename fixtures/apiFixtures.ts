import { test as base, APIRequestContext } from '@playwright/test';
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
   * WORKER-scoped: one login API call per worker. The token is valid for
   * 7 days per the API's own docs — no reason to re-fetch it every test.
   */
  authToken: string;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  authToken: [
    async ({ playwright }, use) => {
      const loginContext = await playwright.request.newContext({
        baseURL: config.apiBaseUrl,
      });
      const response = await loginContext.post('auth/login', {
        data: {
          email: config.testUser.email,
          password: config.testUser.password,
        },
      });
      if (!response.ok()) {
        throw new Error(
          `API login failed: ${response.status()} ${await response.text()}`
        );
      }
      const body = await response.json();
      await loginContext.dispose();

      await use(body.token);
    },
    { scope: 'worker' },
  ],

  // TEST-scoped: a fresh context per test (so response state from one test
  // can't leak into another via a shared context), pre-configured with
  // baseURL and the cached bearer token — no repeated login.
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