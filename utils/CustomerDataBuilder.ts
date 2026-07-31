import { faker } from '@faker-js/faker';
import { CustomerDetails } from '../pages/components/BookingForm';

/**
 * Builds valid CustomerDetails with realistic Faker defaults. A test only
 * overrides the field it actually cares about — everything else stays
 * randomized, which is what gives each test run a unique email/phone
 * instead of colliding on a hardcoded string.
 *
 * Reuses the CustomerDetails shape from BookingForm rather than redefining
 * it here — one source of truth for "what a booking form submission looks
 * like."
 */
export class CustomerDataBuilder {
  private data: CustomerDetails;

  constructor() {
    this.data = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: CustomerDataBuilder.randomIndianPhone(),
    };
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withPhone(phone: string): this {
    this.data.phone = phone;
    return this;
  }

  build(): CustomerDetails {
    // Spread so the caller gets a snapshot, not a live reference they
    // could accidentally mutate back into this builder.
    return { ...this.data };
  }

  private static randomIndianPhone(): string {
    // Matches the app's placeholder format: +91 98765 43210 — a 10-digit
    // number starting with 9.
    return '9' + faker.string.numeric(9);
  }
}