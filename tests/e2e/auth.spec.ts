import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('Redirects unauthenticated users to login', async ({ page }) => {
        // Attempting to visit dashboard
        await page.goto('/');

        // Should immediately land on login due to middleware
        await expect(page).toHaveURL(/.*\/login/);

        // Check for login UI
        await expect(page.locator('h1').first()).toContainText('PADDOCK');
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Shows error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        // Fill in bogus details
        await page.fill('input[type="email"]', 'fake.user@example.com');
        await page.fill('input[type="password"]', 'WrongPassword123');

        // Submit
        await page.click('button[type="submit"]');

        // Expect error message to appear
        // The error message might appear in a div with a specific class or we just check the body text
        const errorAlert = page.locator('text=/Invalid login credentials/i');
        await expect(errorAlert).toBeVisible({ timeout: 10000 });
    });

});
