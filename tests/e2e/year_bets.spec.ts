import { test, expect } from '@playwright/test';
import { loginAsAdmin, enterAdminPin } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });
test.describe('Year Bets', () => {

    test.beforeEach(async ({ page }) => {
        // Ensure year bets are unlocked
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.click('button:has-text("Year End")');
        const lockBtn = page.locator('button:has-text("LOCKED"), button:has-text("OPEN")').last();
        if (await lockBtn.isVisible() && (await lockBtn.innerText()).includes('LOCKED')) {
            await lockBtn.click();
        }
    });

    test('Year bets page loads with category sections', async ({ page }) => {
        await page.goto('/bets/year');
        await expect(page.locator('text=/Champion|Constructor|Podium|Pole/i').first()).toBeVisible();
    });

    test('Year bets show LOCKED status after admin locks them', async ({ page }) => {
        // Lock via admin
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.click('button:has-text("Year End")');
        const lockBtn = page.locator('button:has-text("OPEN"), button:has-text("LOCKED")').last();
        if ((await lockBtn.innerText()).includes('OPEN')) await lockBtn.click();

        await page.goto('/bets/year');
        await expect(page.locator('text=/LOCKED/i').first()).toBeVisible();

        // Cleanup — unlock
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.click('button:has-text("Year End")');
        const lb2 = page.locator('button:has-text("OPEN"), button:has-text("LOCKED")').last();
        if ((await lb2.innerText()).includes('LOCKED')) await lb2.click();
    });
});
