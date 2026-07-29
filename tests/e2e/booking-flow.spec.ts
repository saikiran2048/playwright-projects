import { test, expect } from '../../fixtures/pageFixtures';

test.describe('Booking flow', () => {
  test.afterEach(async ({ bookingsPage }) => {
    // Same `page` the test body used — authenticatedPage's login already
    // happened for this test, so this stays logged in without re-requesting it.
    await bookingsPage.open();
    await bookingsPage.clearAllBookings();
  });

  test('TC-007: book a single ticket — ref format and total validated', async ({
    eventsPage,
    eventDetailPage,
  }) => {
    await eventsPage.open();
    const eventTitle = await eventsPage.titleOf(0);
    await eventsPage.bookEvent(0);

    const pricePerTicket = await eventDetailPage.getPricePerTicket();

    await eventDetailPage.bookTickets(1, {
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '9876543210',
    });

    await expect(eventDetailPage.isBookingConfirmed()).toBeVisible();
    const bookingRef = await eventDetailPage.getBookingRef();

    expect(bookingRef).toMatch(/^[A-Z0-9]-[A-Z0-9]{6}$/);
    expect(bookingRef[0]).toBe(eventTitle[0].toUpperCase());

    await expect(eventDetailPage.ticketsRowValue()).toHaveText('1');
    const total = await eventDetailPage.getTotalFromConfirmation();
    expect(total).toBe(pricePerTicket);
  });

  test('TC-008: book 3 tickets — quantity and total validated', async ({
    eventsPage,
    eventDetailPage,
  }) => {
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    const pricePerTicket = await eventDetailPage.getPricePerTicket();

    await eventDetailPage.bookTickets(3, {
      name: 'Multi Ticket User',
      email: 'multi@example.com',
      phone: '9876543210',
    });

    await expect(eventDetailPage.quantity.count()).toHaveText('3');
    await expect(eventDetailPage.isBookingConfirmed()).toBeVisible();
    await expect(eventDetailPage.ticketsRowValue()).toHaveText('3');

    const total = await eventDetailPage.getTotalFromConfirmation();
    expect(total).toBe(pricePerTicket * 3);
  });

  test('TC-011: cancel a booking from detail page', async ({
    authenticatedPage,
    eventsPage,
    eventDetailPage,
    bookingsPage,
    bookingDetailPage,
  }) => {
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    await eventDetailPage.bookTickets(1, {
      name: 'Cancel Test User',
      email: 'cancel@example.com',
      phone: '9876543210',
    });
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