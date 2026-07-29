import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class BookingsPage extends BasePage {
  private readonly bookingCards: Locator;
  private readonly clearAllButton: Locator;
  private readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.bookingCards = page.getByTestId('booking-card');
    this.clearAllButton = page.getByRole('button', { name: 'Clear all bookings' });
    this.emptyState = page.getByText('No bookings yet');
  }

  async open(): Promise<void> {
    await this.goto('/bookings');
    await this.waitForNetworkIdle();
  }

  cardByRef(bookingRef: string): Locator {
    return this.bookingCards.filter({ hasText: bookingRef });
  }

  async openDetailsFor(bookingRef: string): Promise<void> {
    await this.cardByRef(bookingRef).getByRole('link', { name: 'View Details' }).click();
  }

  /**
   * "Clear all bookings" triggers a REAL browser window.confirm() dialog —
   * not the app's custom ConfirmDialog component. Playwright handles native
   * dialogs via a page-level event listener, not a locator, which is why
   * this can't be a ConfirmDialog component call like the cancel flow uses.
   */
  async clearAllBookings(): Promise<void> {
    const count = await this.bookingCards.count();
    if (count === 0) return;

    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clearAllButton.click();
    await this.emptyState.waitFor({ state: 'visible', timeout: 5_000 });
  }
}