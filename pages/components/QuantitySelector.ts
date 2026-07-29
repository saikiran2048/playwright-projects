import { Page, Locator } from '@playwright/test';

/**
 * The "+ / −" ticket quantity stepper on the event detail page.
 * Component object — composed into EventDetailPage rather than owned
 * directly by it, since the widget is self-contained.
 */
export class QuantitySelector {
  private readonly incrementBtn: Locator;
  private readonly decrementBtn: Locator;
  private readonly countDisplay: Locator;

  constructor(page: Page) {
    this.incrementBtn = page.getByRole('button', { name: '+' });
    // NOTE: this is the Unicode minus sign (U+2212 "−"), not a hyphen ("-").
    // Confirmed against the source — getByRole('button', { name: '-' })
    // silently does not match this element.
    this.decrementBtn = page.getByRole('button', { name: '−' });
    // No data-testid/role on the count span itself — ID is the best
    // available selector.
    this.countDisplay = page.locator('#ticket-count');
  }

  async increment(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.incrementBtn.click();
    }
  }

  async decrement(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.decrementBtn.click();
    }
  }

  /** Exposed as a Locator — caller decides what to assert. */
  count(): Locator {
    return this.countDisplay;
  }
}