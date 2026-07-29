import { Page, Locator } from '@playwright/test';

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

/**
 * The booking form (name/email/phone + submit) on the event detail page.
 * Component object — pure form interaction, no navigation, no assertions.
 */
export class BookingForm {
  private readonly nameInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.nameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByTestId('customer-email');
    this.phoneInput = page.getByPlaceholder('+91 98765 43210');
    // Upgrade over the old flat spec's `.confirm-booking-btn` (CSS class,
    // styling hook) — the element also has a real id, which is the
    // higher-priority selector when no data-testid/role is available.
    this.submitButton = page.locator('#confirm-booking');
  }

  async fill(details: CustomerDetails): Promise<void> {
    await this.nameInput.fill(details.name);
    await this.emailInput.fill(details.email);
    await this.phoneInput.fill(details.phone);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}