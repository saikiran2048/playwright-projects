import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder('you@email.com');
    this.passwordInput = page.getByLabel('Password');
    // No data-testid or role exposed on this button — ID is the best
    // available selector here, not the default choice.
    this.loginButton = page.locator('#login-btn');
    // logout-btn only renders once auth succeeds — used as the
    // "did login actually work" signal.
    this.logoutButton = page.getByTestId('logout-btn');
  }

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Hosted app can be slow on cold start — give it more room than the
    // global expect timeout before the test decides login failed.
    await this.logoutButton.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Exposes the locator, not a boolean or an assertion — the calling
   * test decides what to assert (visible, enabled, etc).
   */
  isLoggedIn(): Locator {
    return this.logoutButton;
  }
}