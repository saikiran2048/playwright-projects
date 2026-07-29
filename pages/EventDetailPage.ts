import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { QuantitySelector } from './components/QuantitySelector';
import { BookingForm, CustomerDetails } from './components/BookingForm';

/**
 * /events/:id — composes two components (quantity stepper, booking form)
 * rather than owning their locators directly. The booking confirmation
 * card, by contrast, only ever appears on THIS page, so it stays as
 * methods here instead of becoming a third component — no reuse, no
 * payoff from the extra indirection.
 */
export class EventDetailPage extends BasePage {
  readonly quantity: QuantitySelector;
  readonly bookingForm: BookingForm;

  private readonly priceValue: Locator;
  private readonly confirmationHeading: Locator;
  private readonly bookingRef: Locator;

  constructor(page: Page) {
    super(page);
    this.quantity = new QuantitySelector(page);
    this.bookingForm = new BookingForm(page);

    // TODO: request data-testid="price-per-ticket" from dev — CSS class
    // chain is fragile and will break on any Tailwind class refactor.
    this.priceValue = page.locator('span.text-2xl.font-bold.text-indigo-700');
    this.confirmationHeading = page.getByText('Booking Confirmed!');
    this.bookingRef = page.locator('.booking-ref');
  }

  async bookTickets(quantity: number, details: CustomerDetails): Promise<void> {
    if (quantity > 1) {
      await this.quantity.increment(quantity - 1);
    }
    await this.bookingForm.fill(details);
    await this.bookingForm.submit();
  }

  isBookingConfirmed(): Locator {
    return this.confirmationHeading;
  }

  async getBookingRef(): Promise<string> {
    const text = await this.bookingRef.textContent();
    return (text ?? '').trim();
  }

  async getPricePerTicket(): Promise<number> {
    const text = await this.priceValue.textContent();
    return parseFloat((text ?? '').replace(/[$,]/g, ''));
  }

  /**
   * Confirmation card rows have no per-row testid — every row uses the
   * same generic <Row label=.../> component. This CSS-chain (label span
   * -> parent -> sibling value span) is the current best option.
   * TODO: request data-testid="confirmation-row-{field}" from dev.
   */
  private confirmationRow(label: string): Locator {
    return this.page
      .locator('span.text-gray-500', { hasText: label })
      .locator('..')
      .locator('span.font-medium');
  }

  ticketsRowValue(): Locator {
    return this.confirmationRow('Tickets');
  }

  async getTotalFromConfirmation(): Promise<number> {
    const text = await this.confirmationRow('Total').textContent();
    return parseFloat((text ?? '').replace(/[$,]/g, ''));
  }
}