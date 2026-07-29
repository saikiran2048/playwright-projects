import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ConfirmDialog } from './components/ConfirmDialog';

/**
 * /bookings/:id — composes ConfirmDialog for the cancel flow. This is the
 * second consumer of ConfirmDialog (BookingsPage's list-card cancel is the
 * other, not yet wired up) — the reuse this component object exists for.
 */
export class BookingDetailPage extends BasePage {
  readonly confirmDialog: ConfirmDialog;

  private readonly cancelBookingButton: Locator;
  private readonly cancelledToast: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmDialog = new ConfirmDialog(page);
    // No testid on THIS specific "Cancel Booking" button (unlike the
    // list-card version, which has data-testid="cancel-booking-btn") —
    // role/name is the best available selector here.
    this.cancelBookingButton = page.getByRole('button', { name: 'Cancel Booking' });
    this.cancelledToast = page.getByText('Booking cancelled successfully');
  }

  async cancelBooking(): Promise<void> {
    await this.cancelBookingButton.click();
    await this.confirmDialog.isVisible().waitFor({ state: 'visible' });
    await this.confirmDialog.confirm();
  }

  isCancellationConfirmed(): Locator {
    return this.cancelledToast;
  }
}