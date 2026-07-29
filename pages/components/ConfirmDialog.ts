import { Page, Locator } from '@playwright/test';

/**
 * The app's generic confirm/cancel modal (ConfirmDialog.jsx in the source).
 * Reused across multiple screens — booking-detail cancel, bookings-list
 * cancel, and any future destructive action — which is exactly why this
 * is a component object rather than logic duplicated per page.
 */
export class ConfirmDialog {
  private readonly confirmButton: Locator;

  constructor(page: Page) {
    // Stable regardless of confirmLabel text ("Yes, cancel it", "Confirm",
    // etc.) — the testid doesn't change even though the button text does
    // per usage.
    this.confirmButton = page.getByTestId('confirm-dialog-yes');
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  isVisible(): Locator {
    return this.confirmButton;
  }
}