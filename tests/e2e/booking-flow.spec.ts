import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { EventsPage } from '../../pages/EventsPage';
import { EventDetailPage } from '../../pages/EventDetailPage';
import { BookingsPage } from '../../pages/BookingsPage';
import { BookingDetailPage } from '../../pages/BookingDetailPage';

test.describe('Booking flow', () => {
  test.afterEach(async ({ page }) => {
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.open();
    await bookingsPage.clearAllBookings();
  });

  test('TC-007: book a single ticket — ref format and total validated', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

    const eventsPage = new EventsPage(page);
    await eventsPage.open();
    const eventTitle = await eventsPage.titleOf(0);
    await eventsPage.bookEvent(0);

    const detailPage = new EventDetailPage(page);
    const pricePerTicket = await detailPage.getPricePerTicket();

    await detailPage.bookTickets(1, {
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '9876543210',
    });

    await expect(detailPage.isBookingConfirmed()).toBeVisible();
    const bookingRef = await detailPage.getBookingRef();

    // Booking ref format: {EventTitleFirstChar}-{6 alphanumeric}
    expect(bookingRef).toMatch(/^[A-Z0-9]-[A-Z0-9]{6}$/);
    expect(bookingRef[0]).toBe(eventTitle[0].toUpperCase());

    await expect(detailPage.ticketsRowValue()).toHaveText('1');
    const total = await detailPage.getTotalFromConfirmation();
    expect(total).toBe(pricePerTicket);
  });

  test('TC-008: book 3 tickets — quantity and total validated', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

    const eventsPage = new EventsPage(page);
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    const detailPage = new EventDetailPage(page);
    const pricePerTicket = await detailPage.getPricePerTicket();

    await detailPage.bookTickets(3, {
      name: 'Multi Ticket User',
      email: 'multi@example.com',
      phone: '9876543210',
    });

    await expect(detailPage.quantity.count()).toHaveText('3');
    await expect(detailPage.isBookingConfirmed()).toBeVisible();
    await expect(detailPage.ticketsRowValue()).toHaveText('3');

    const total = await detailPage.getTotalFromConfirmation();
    expect(total).toBe(pricePerTicket * 3);
  });

  test('TC-011: cancel a booking from detail page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

    // Setup: create a booking to cancel
    const eventsPage = new EventsPage(page);
    await eventsPage.open();
    await eventsPage.bookEvent(0);

    const detailPage = new EventDetailPage(page);
    await detailPage.bookTickets(1, {
      name: 'Cancel Test User',
      email: 'cancel@example.com',
      phone: '9876543210',
    });
    await expect(detailPage.isBookingConfirmed()).toBeVisible();
    const bookingRef = await detailPage.getBookingRef();

    // Navigate to the booking's detail page and cancel it
    const bookingsPage = new BookingsPage(page);
    await page.getByRole('link', { name: 'View My Bookings' }).click();
    await expect(page).toHaveURL(/\/bookings$/);
    await bookingsPage.openDetailsFor(bookingRef);
    await expect(page).toHaveURL(/\/bookings\/\d+/);

    const bookingDetailPage = new BookingDetailPage(page);
    await bookingDetailPage.cancelBooking();

    await expect(bookingDetailPage.isCancellationConfirmed()).toBeVisible();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(bookingsPage.cardByRef(bookingRef)).not.toBeVisible();
  });
});