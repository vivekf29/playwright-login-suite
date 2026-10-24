import { test as base, type APIRequestContext, type Browser } from '@playwright/test';

type ApiFixtures = {
  api: APIRequestContext;
};

type WorkerFixtures = {
  apiBrowser: Browser;
};

/**
 * DummyJSON sits behind Cloudflare. Playwright's standalone API client
 * stalls on that host from this machine. The browser network stack does not,
 * so API tests send HTTP through a Chromium context and still use Playwright's
 * APIRequestContext, status checks, and reporters.
 *
 * A new context is created for every test so cookies from a successful login
 * cannot leak into the next test.
 */
export const test = base.extend<ApiFixtures, WorkerFixtures>({
  apiBrowser: [
    async ({ playwright }, use) => {
      const browser = await playwright.chromium.launch();
      await use(browser);
      await browser.close();
    },
    { scope: 'worker' },
  ],

  api: async ({ apiBrowser }, use) => {
    const context = await apiBrowser.newContext({
      baseURL: 'https://dummyjson.com',
    });
    await use(context.request);
    await context.close();
  },
});

export { expect } from '@playwright/test';
