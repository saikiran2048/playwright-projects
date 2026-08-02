import { test, expect } from '../../fixtures/pageFixtures';
import { CustomerDataBuilder } from '../../utils/CustomerDataBuilder';

test.describe('Booking flow', () => {
  test.afterEach(async ({ bookingsPage }) => {
    // Same `page` the test body used — authenticatedPage's login already
    // happened for this test, so this stays logged in without re-requesting it.
    await bookingsPage.open();
    await bookingsPage.clearAllBookings();
  });

  test('TC-007: book a single ticket — ref format and total validated', { tag: '@smoke' }, async ({
    eventsPage,
    eventDetailPage,
  }) => {
    await eventsPage.open();
    const eventTitle = await eventsPage.titleOf(0);
    await eventsPage.bookEvent(0);

    const pricePerTicket = await eventDetailPage.getPricePerTicket();

    // Fully generated — nothing in this test cares about the specific
    // name/email/phone, only that the booking succeeds.
    const customer = new CustomerDataBuilder().build();
    await eventDetailPage.bookTickets(1, customer);

    await expect(eventDetailPage.isBookingConfirmed()).toBeVisible();
    const bookingRef = await eventDetailPage.getBookingRef();

    expect(bookingRef).toMatch(/^[A-Z0-9]-[A-Z0-9]{6}$/);
    expect(bookingRef[0]).toBe(eventTitle[0].toUpperCase());

    await expect(eventDetailPage.ticketsRowValue()).toHaveText('1');
    const total = await eventDetailPage.getTotalFromConfirmation();
    expect(total).toBe(pricePerTicket);
  });

  test('TC-008: book 3 tickets — quantity and total validated', { tag: '@regression' }, async ({
    eventsPage,
    eventDetailPage,
  }) => {
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    const pricePerTicket = await eventDetailPage.getPricePerTicket();

    // Quantity must be asserted BEFORE submitting — once the form submits,
    // the confirmation card replaces it in the DOM and #ticket-count stops
    // existing entirely. Asserting it after bookTickets() (which submits)
    // was the actual bug: intermittent because it raced the confirmation
    // re-render rather than reliably failing.
    await eventDetailPage.quantity.increment(2);
    await expect(eventDetailPage.quantity.count()).toHaveText('3');

    const customer = new CustomerDataBuilder().build();
    await eventDetailPage.bookingForm.fill(customer);
    await eventDetailPage.bookingForm.submit();

    await expect(eventDetailPage.isBookingConfirmed()).toBeVisible();
    await expect(eventDetailPage.ticketsRowValue()).toHaveText('3');

    const total = await eventDetailPage.getTotalFromConfirmation();
    expect(total).toBe(pricePerTicket * 3);
  });

  test('TC-011: cancel a booking from detail page', { tag: '@regression' }, async ({
    authenticatedPage,
    eventsPage,
    eventDetailPage,
    bookingsPage,
    bookingDetailPage,
  }) => {
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    // Override just the name — keeps the booking recognizable in a trace
    // or screenshot for this specific flow, everything else stays random.
    const customer = new CustomerDataBuilder().withName('Cancel Flow Test').build();
    await eventDetailPage.bookTickets(1, customer);

    await expect(eventDetailPage.isBookingConfirmed()).toBeVisible();
    const bookingRef = await eventDetailPage.getBookingRef();

    await authenticatedPage.getByRole('link', { name: 'View My Bookings' }).click();
    await expect(authenticatedPage).toHaveURL(/\/bookings$/);
    await bookingsPage.openDetailsFor(bookingRef);
    await expect(authenticatedPage).toHaveURL(/\/bookings\/\d+/);

    await bookingDetailPage.cancelBooking();

    await expect(bookingDetailPage.isCancellationConfirmed()).toBeVisible();
    await expect(authenticatedPage).toHaveURL(/\/bookings$/);
    await expect(bookingsPage.cardByRef(bookingRef)).not.toBeVisible();
  });
});