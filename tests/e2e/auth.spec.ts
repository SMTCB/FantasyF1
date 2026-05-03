import { test, expect } from '@playwright/test';
import { loginAsAdmin, TEST_ADMIN } from '../helpers/auth';

test.describe('Authentication', () => {

    test('Unauthenticated users are redirected to /login', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/login/);
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Invalid credentials show an error', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'nobody_fake_xyz');
        await page.fill('input[type="password"]', 'wrongpassword999');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=/invalid login credentials/i')).toBeVisible({ timeout: 10000 });
    });

    test('Valid credentials land on the dashboard', async ({ page }) => {
        await loginAsAdmin(page);
        await expect(page.locator('text=/Championship Standings/i').first()).toBeVisible();
    });

    test('Sign out returns to login', async ({ page }) => {
        await loginAsAdmin(page);
        await page.click('button:has-text("SIGNOUT")');
        await expect(page).toHaveURL(/\/login/);
    });
});
