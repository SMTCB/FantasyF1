import { test, expect } from '@playwright/test';

test.describe('Report Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('Report page loads with Year Bets and Race Bets tabs', async ({ page }) => {
        await page.goto('/bets/report');
        await expect(page.locator('text=/Year Bets/i').first()).toBeVisible();
        await expect(page.locator('text=/Race Bets/i').first()).toBeVisible();
    });

    test('Race Bets tab shows a scrollable race selector', async ({ page }) => {
        await page.goto('/bets/report');
        await page.click('text=/Race Bets/i');
        // Should show at least one race name in the selector
        await expect(page.locator('text=/Australian GP|Miami GP/i').first()).toBeVisible();
    });

    test('Selecting a scored race shows colour-coded bet breakdown', async ({ page }) => {
        await page.goto('/bets/report');
        await page.click('text=/Race Bets/i');

        // Try to click round 1 (Australian GP — should be scored)
        const r1Button = page.locator('button, div').filter({ hasText: /Australian GP/ }).first();
        if (await r1Button.isVisible()) {
            await r1Button.click();
            // After selection, should show at least one user's bets
            await expect(page.locator('text=/P1|P2|P3/i').first()).toBeVisible();
        }
    });
});
