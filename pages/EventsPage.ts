import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class EventsPage extends BasePage {
  private readonly eventCards: Locator;

  constructor(page: Page) {
    super(page);
    this.eventCards = page.getByTestId('event-card');
  }

  async open(): Promise<void> {
    await this.goto('/events');
  }

  /** Returns the nth event card (0-indexed) as a Locator scope. */
  eventCard(index = 0): Locator {
    return this.eventCards.nth(index);
  }

  async eventCount(): Promise<number> {
    // Cards render after an async API fetch, and Locator.count() does NOT
    // auto-wait like expect() does — it checks the DOM once, immediately.
    // Wait for the first card (or timeout) before counting, so a genuinely
    // empty result (0) is trustworthy rather than "checked too early."
    await this.eventCards
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {
        // no cards appeared within the timeout — count() below will
        // correctly return 0 for that legitimate case
      });
    return this.eventCards.count();
  }

  async titleOf(index = 0): Promise<string> {
    const title = await this.eventCard(index).locator('h3').textContent();
    return (title ?? '').trim();
  }

  /** Clicks "Book Now" on the given card. Navigation is asserted by the caller. */
  async bookEvent(index = 0): Promise<void> {
    await this.eventCard(index).getByTestId('book-now-btn').click();
  }
}