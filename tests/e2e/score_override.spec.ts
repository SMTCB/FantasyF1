import { test, expect } from '@playwright/test';
import { loginAsAdmin, enterAdminPin } from '../helpers/auth';

test.describe('Admin Score Override', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.locator('button').filter({ hasText: /Score Override/ }).click();
    });

    test('Score Override tab shows populated user and race dropdowns', async ({ page }) => {
        // Wait for user dropdown to hydrate
        await expect(page.locator('select').nth(0).locator('option').nth(1)).toBeAttached({ timeout: 10000 });

        const userOptions = await page.locator('select').nth(0).locator('option').count();
        expect(userOptions).toBeGreaterThan(1);

        const raceOptions = await page.locator('select').nth(1).locator('option').count();
        expect(raceOptions).toBeGreaterThan(1);
    });

    test('Validation blocks incomplete form', async ({ page }) => {
        page.on('dialog', async (d) => {
            expect(d.message()).toMatch(/fill all fields/i);
            await d.dismiss();
        });
        await page.click('button:has-text("APPLY OVERRIDE")');
        await expect(page.locator('button:has-text("APPLY OVERRIDE")')).toBeVisible();
    });

    test('Submitting a valid override shows success toast', async ({ page }) => {
        // Wait for dropdowns to hydrate
        await expect(page.locator('select').nth(0).locator('option').nth(1)).toBeAttached({ timeout: 10000 });

        await page.locator('select').nth(0).selectOption({ index: 1 });
        await page.locator('select').nth(1).selectOption({ index: 1 });
        await page.locator('input[type="number"]').fill('77');
        await page.locator('input[type="text"]').last().fill('E2E test override');

        await page.click('button:has-text("APPLY OVERRIDE")');
        // Toast notification shows "saved successfully"
        await expect(page.locator('text=/saved successfully/i').first()).toBeVisible({ timeout: 10000 });
    });
});
