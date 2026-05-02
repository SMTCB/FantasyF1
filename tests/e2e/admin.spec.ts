import { test, expect } from '@playwright/test';
import { loginAsAdmin, enterAdminPin, TEST_ADMIN } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });
test.describe('Admin Panel', () => {

    // ── Access control ───────────────────────────────────────────

    test('Correct PIN unlocks the admin panel', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await expect(page.locator('text=/Race Results/i').first()).toBeVisible();
    });

    test('Wrong PIN does not unlock the admin panel', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await page.fill('input[type="password"]', '9999');
        await page.click('button:has-text("AUTHENTICATE")');
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    // ── Race Results tab ─────────────────────────────────────────

    test('Race Results tab lists Miami GP and not Bahrain GP', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await expect(page.locator('text=Miami GP').first()).toBeVisible();
        await expect(page.locator('text=Bahrain GP')).not.toBeVisible();
    });

    test('Expanding a race shows Fetch from F1 API and lock toggle', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);

        const r4 = page.locator('button').filter({ hasText: /Miami GP/ });
        await r4.click();

        await expect(page.locator('button:has-text("Fetch from F1 API")').first()).toBeVisible();
        await expect(
            page.locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).first()
        ).toBeVisible();
    });

    test('Manual unlock toggle switches state', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);

        const r4 = page.locator('button').filter({ hasText: /Miami GP/ });
        await r4.click();

        const toggle = page.locator('div').filter({ hasText: /Miami GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();

        const before = await toggle.innerText();
        await toggle.click();
        await page.waitForTimeout(500);
        const after = await toggle.innerText();
        expect(before.trim()).not.toEqual(after.trim());

        // Always revert
        await toggle.click();
    });

    // ── Score Override tab ───────────────────────────────────────

    test('Score Override tab has user and race dropdowns', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.locator('button').filter({ hasText: /Score Override/ }).click();

        // Wait for user dropdown to hydrate from DB
        await expect(page.locator('select').first().locator('option').nth(1)).toBeAttached({ timeout: 10000 });
        const userOptions = await page.locator('select').first().locator('option').count();
        expect(userOptions).toBeGreaterThan(1);
    });

    test('Score Override validation blocks empty form', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.locator('button').filter({ hasText: /Score Override/ }).click();

        page.on('dialog', async (d) => {
            expect(d.message()).toMatch(/fill all fields/i);
            await d.dismiss();
        });

        await page.click('button:has-text("APPLY OVERRIDE")');
        await expect(page.locator('button:has-text("APPLY OVERRIDE")')).toBeVisible();
    });

    // ── Year End tab ─────────────────────────────────────────────

    test('Year End tab shows Calculate button and lock toggle', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin');
        await enterAdminPin(page);
        await page.click('button:has-text("Year End")');

        await expect(page.locator('button:has-text("CALCULATE & SCORE YEAR BETS")')).toBeVisible();
        await expect(page.locator('button:has-text("OPEN"), button:has-text("LOCKED")').last()).toBeVisible();
    });
});
