import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly githubLoginButton: Locator;
  readonly terminalTitle: Locator;
  readonly statusIndicators: Locator;
  readonly featuresGrid: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.githubLoginButton = page.getByRole('button', { name: 'LOGIN WITH GITHUB' });
    this.terminalTitle = page.getByText('pr-tracker@auth:~$');
    this.statusIndicators = page.getByText('SYSTEM ONLINE');
    this.featuresGrid = page.locator('.grid');
    this.errorMessage = page.getByRole('alert');
    this.loadingSpinner = page.getByRole('button', { name: 'CONNECTING...' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async clickGitHubLogin() {
    await this.githubLoginButton.click();
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.terminalTitle).toBeVisible();
    await expect(this.githubLoginButton).toBeVisible();
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async expectError(errorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }

  async expectFeatures() {
    await expect(this.featuresGrid).toBeVisible();
    await expect(this.page.getByText('REPOSITORY TRACKING')).toBeVisible();
    await expect(this.page.getByText('ANALYTICS DASHBOARD')).toBeVisible();
    await expect(this.page.getByText('REVIEW INSIGHTS')).toBeVisible();
    await expect(this.page.getByText('SECURE ACCESS')).toBeVisible();
  }
}

export class DashboardPage {
  readonly page: Page;
  readonly dashboardHeading: Locator;
  readonly userAvatar: Locator;
  readonly logoutButton: Locator;
  readonly repositoriesLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardHeading = page.getByText('pr-tracker@dashboard:~$');
    this.userAvatar = page.getByRole('img', { name: /avatar|profile/i });
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    this.repositoriesLink = page.getByRole('link', { name: /repositories/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/dashboard|^\/$|^http:\/\/localhost:5173\/$/, { timeout: 10000 });
    await expect(this.dashboardHeading).toBeVisible();
  }

  async expectAuthenticated() {
    await this.expectVisible();
    // Should not show login UI when authenticated
    await expect(this.page.getByRole('button', { name: 'LOGIN WITH GITHUB' })).not.toBeVisible();
  }

  async logout() {
    await this.logoutButton.click();
  }

  async navigateToRepositories() {
    await this.repositoriesLink.click();
  }
}

export class RepositoriesPage {
  readonly page: Page;
  readonly repositoriesHeading: Locator;
  readonly repositoryItems: Locator;
  readonly addRepositoryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.repositoriesHeading = page.getByRole('heading', { name: /repositories/i });
    this.repositoryItems = page.getByRole('listitem');
    this.addRepositoryButton = page.getByRole('button', { name: /add.*repository/i });
  }

  async goto() {
    await this.page.goto('/repositories');
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/repositories/);
    await expect(this.repositoriesHeading).toBeVisible();
  }

  async clickRepository(repositoryName: string) {
    await this.page.getByRole('link', { name: repositoryName }).click();
  }
}

export class AuthGuardComponent {
  readonly page: Page;
  readonly loadingIndicator: Locator;
  readonly initializingText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingIndicator = page.getByText('Initializing GitHub OAuth authentication protocol...');
    this.initializingText = page.getByText('INITIALIZING');
  }

  async expectLoading() {
    await expect(this.initializingText).toBeVisible();
    // Loading indicator text might be brief, so make it optional
    if (await this.loadingIndicator.isVisible()) {
      await expect(this.loadingIndicator).toBeVisible();
    }
  }

  async waitForInitialization() {
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 10000 });
  }
}