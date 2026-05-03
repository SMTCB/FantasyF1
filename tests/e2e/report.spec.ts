import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Report Page', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('Report page loads with Year Bets and Race Bets tabs', async ({ page }) => {
        await page.goto('/bets/report');
        await expect(page.locator('text=/Year Bets/i').first()).toBeVisible();
        await expect(page.locator('text=/Race Bets/i').first()).toBeVisible();
    });

    test('Race Bets tab shows at least one race', async ({ page }) => {
        await page.goto('/bets/report');
        await page.click('text=/Race Bets/i');
        // Round selector buttons (R01, R02 …) appear after data loads
        await expect(page.locator('text=/R0[0-9]/').first()).toBeVisible({ timeout: 15000 });
    });
});
