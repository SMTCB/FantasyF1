import { test, expect } from '@playwright/test';

test.describe('UI Consistency & Navigation', () => {

    test('Login page renders Pit Wall aesthetic correctly', async ({ page }) => {
        await page.goto('/login');

        // Verify glass-card CSS class is applied
        const numCards = await page.locator('.glass-card').count();
        expect(numCards).toBeGreaterThanOrEqual(1);

        // Verify inputs have correct styles
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toHaveClass(/bg-white\/5/);
        await expect(emailInput).toHaveClass(/border-white\/10/);
    });
});
