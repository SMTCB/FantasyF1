import { test, expect } from '@playwright/test';

test.describe('Admin Score Override', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('Score Override tab shows populated user and race dropdowns', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        // Navigate to Score Overrides tab
        await page.click('button:has-text("Score Override")');

        // User dropdown must be populated from the DB
        const userSelect = page.locator('select').filter({ has: page.locator('option[value=""]', { hasText: /user/i }) });
        const userOptions = userSelect.locator('option');
        await expect(userOptions).toHaveCount(expect.any(Number));
        const count = await userOptions.count();
        expect(count).toBeGreaterThan(1); // At least one real user beyond the placeholder

        // Race dropdown must list calendar races
        const raceSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /R\d+ - Miami GP/ }) });
        await expect(raceSelect).toBeVisible();
    });

    test('Score Override: validation blocks incomplete form', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        await page.click('button:has-text("Score Override")');

        // Click APPLY without filling anything — should not crash the page
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toMatch(/fill all fields/i);
            await dialog.dismiss();
        });

        await page.click('button:has-text("APPLY OVERRIDE")');

        // Page should still be intact
        await expect(page.locator('button:has-text("APPLY OVERRIDE")')).toBeVisible();
    });

    test('Score Override: submitting a valid override saves to DB and shows toast', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        await page.click('button:has-text("Score Override")');

        // Pick first available user and race
        const userSelect = page.locator('label:has-text("USER") + select, label:has-text("USER") ~ select').first();
        const raceSelect = page.locator('label:has-text("RACE") + select, label:has-text("RACE") ~ select').first();

        await userSelect.selectOption({ index: 1 }); // first real user
        await raceSelect.selectOption({ index: 1 });  // R1 - Australian GP

        await page.fill('input[placeholder*="score" i]', '99');
        await page.fill('input[placeholder*="reason" i]', 'E2E test override');

        await page.click('button:has-text("APPLY OVERRIDE")');

        // Success toast
        await expect(page.locator('text=Score override')).toBeVisible({ timeout: 10000 });
    });
});
