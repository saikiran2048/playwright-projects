import { Page } from '@playwright/test';

/**
 * Every concrete page object extends this. Holds only what's common to
 * ALL pages — navigation and generic waits. Anything page-specific
 * (locators, actions) belongs in the subclass, not here.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}