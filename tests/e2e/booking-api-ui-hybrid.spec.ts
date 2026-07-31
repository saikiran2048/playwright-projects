import { test, expect } from '../../fixtures/pageFixtures';

test.describe('Booking — API setup, UI verification', () => {
  test.afterEach(async ({ apiContext }) => {
    await apiContext.delete('bookings');
  });

  test('a booking created via API appears correctly on the My Bookings screen', async ({
    apiContext,
    bookingsPage,
  }) => {
    // SETUP via API — one HTTP call instead of the full UI booking flow
    // (open event, adjust quantity, fill form, submit). This is the actual
    // payoff of API-first setup: the UI flow itself isn't what this test
    // is verifying, so there's no reason to pay its cost to get there.
    const eventsResponse = await apiContext.get('events');
    const { data: events } = await eventsResponse.json();
    const event = events[0];

    const createResponse = await apiContext.post('bookings', {
      data: {
        eventId: event.id,
        customerName: 'Hybrid Test User',
        customerEmail: 'hybrid@example.com',
        customerPhone: '9876543210',
        quantity: 2,
      },
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();

    // VERIFICATION via UI — this IS what the test is actually checking:
    // does the booking the backend persisted render correctly on screen.
    await bookingsPage.open();
    const card = bookingsPage.cardByRef(created.bookingRef);
    await expect(card).toBeVisible();
    await expect(card).toContainText(event.title);
  });
});