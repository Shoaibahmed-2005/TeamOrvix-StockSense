import { test, expect } from '@playwright/test';

test.describe('Auth Pages Navigation', () => {
  test('should navigate between login, signup, and forgot password', async ({ page }) => {
    // Start at root — should redirect to /login
    await page.goto('/');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);

    // Verify Login page content
    await expect(page.locator('h1')).toHaveText('Welcome back');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Navigate to Signup
    await page.getByRole('link', { name: 'Sign up' }).click();
    await page.waitForURL('**/signup');
    await expect(page.locator('h1')).toHaveText('Create an account');
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();

    // Navigate back to Login
    await page.getByRole('link', { name: 'Sign in' }).click();
    await page.waitForURL('**/login');

    // Navigate to Forgot Password
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await page.waitForURL('**/forgot-password');
    await expect(page.locator('h1')).toHaveText('Reset password');
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();

    // Navigate back to Login from Forgot Password
    await page.getByRole('link', { name: 'Back to login' }).click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('no console errors on auth pages', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto('/login');
    await page.goto('/signup');
    await page.goto('/forgot-password');
    expect(consoleErrors).toHaveLength(0);
  });
});
