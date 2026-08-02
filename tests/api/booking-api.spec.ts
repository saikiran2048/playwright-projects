import { test, expect } from '../../fixtures/pageFixtures';

test.describe('Booking API', () => {
  test.afterEach(async ({ apiContext }) => {
    // Cleanup via API — no browser, no UI dialog, just a DELETE call.
    // Fast, and keeps the shared test account under its booking limit
    // between test runs.
    await apiContext.delete('bookings');
  });

  test('creating a booking returns a correctly formatted ref and persists it', { tag: '@smoke' }, async ({
    apiContext,
  }) => {
    const eventsResponse = await apiContext.get('events');
    expect(eventsResponse.ok()).toBeTruthy();
    const { data: events } = await eventsResponse.json();
    const event = events[0];

    const createResponse = await apiContext.post('bookings', {
      data: {
        eventId: event.id,
        customerName: 'API Test User',
        customerEmail: 'apitest@example.com',
        customerPhone: '9876543210',
        quantity: 1,
      },
    });

    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();

    expect(created.bookingRef).toMatch(/^[A-Z0-9]-[A-Z0-9]{6}$/);
    expect(created.bookingRef[0]).toBe(event.title[0].toUpperCase());

    // Round-trip: fetch it back and confirm what actually persisted,
    // not just what the create response echoed back.
    const fetchResponse = await apiContext.get(`bookings/ref/${created.bookingRef}`);
    expect(fetchResponse.ok()).toBeTruthy();
    const { data: fetched } = await fetchResponse.json();
    expect(fetched.customerEmail).toBe('apitest@example.com');
    expect(fetched.quantity).toBe(1);
  });

  test('quantity 0 is rejected with a 400 and a field-level validation message', { tag: '@regression' }, async ({
    apiContext,
  }) => {
    const eventsResponse = await apiContext.get('events');
    const { data: events } = await eventsResponse.json();

    const response = await apiContext.post('bookings', {
      data: {
        eventId: events[0].id,
        customerName: 'Invalid Qty User',
        customerEmail: 'invalidqty@example.com',
        customerPhone: '9876543210',
        quantity: 0,
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(
      body.details.some((d: { field: string }) => d.field === 'quantity')
    ).toBe(true);
  });
});