import { test, expect } from '@playwright/test';

test.describe('Year Bets', () => {

    test.beforeEach(async ({ page }) => {
        // Ensure year bets are unlocked before testing
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // Unlock year bets via admin if locked
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        // Navigate to Year End tab and check lock
        await page.click('button:has-text("Year End")');
        const lockBtn = page.locator('button:has-text("LOCKED"), button:has-text("OPEN")').last();
        if (await lockBtn.isVisible()) {
            const text = await lockBtn.innerText();
            if (text.includes('LOCKED')) await lockBtn.click();
        }
    });

    test('Year bets page loads with 10 categories', async ({ page }) => {
        await page.goto('/bets/year');
        // All 10 category labels must be present
        const categories = [
            'Champion', 'Runner-up', 'P3',
            'Constructor', 'Last', 'Fewest',
            'DNF', 'Replaced', 'Pole', 'Podium'
        ];
        for (const term of categories) {
            await expect(page.locator(`text=/${term}/i`).first()).toBeVisible();
        }
    });

    test('Submit button is disabled until all 10 fields are filled', async ({ page }) => {
        await page.goto('/bets/year');
        const submitBtn = page.locator('button:has-text("SAVE YEAR BETS"), button:has-text("LOCK IN")');
        // With nothing filled the button should be disabled
        await expect(submitBtn.first()).toBeDisabled();
    });

    test('Year bets show LOCKED when admin locks them', async ({ page }) => {
        // Lock via admin
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await page.click('button:has-text("Year End")');

        const lockBtn = page.locator('button:has-text("OPEN"), button:has-text("LOCKED")').last();
        const currentText = await lockBtn.innerText();
        if (currentText.includes('OPEN')) await lockBtn.click();

        // Verify year bets page shows locked state
        await page.goto('/bets/year');
        await expect(page.locator('text=/LOCKED/i').first()).toBeVisible();

        // Cleanup — unlock again
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await page.click('button:has-text("Year End")');
        const lockBtn2 = page.locator('button:has-text("OPEN"), button:has-text("LOCKED")').last();
        if ((await lockBtn2.innerText()).includes('LOCKED')) await lockBtn2.click();
    });
});
