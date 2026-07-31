# fixtures

Custom Playwright fixtures — authenticated page, API client, seeded test data.
Tests declare what they need via fixture params instead of manual setup/teardown.

`pageFixtures.ts` mixes scopes deliberately: `authStatePath` is WORKER-scoped
(UI login happens once per worker), `authenticatedPage` is test-scoped (fresh
context per test, seeded from the cached session — no login UI, no state
leak between tests).
