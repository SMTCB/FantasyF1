import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    // ── Access control ───────────────────────────────────────────

    test('Non-admin user sees Access Denied', async ({ page }) => {
        // Log in as a regular user first (adjust username to a known non-admin)
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'stcbr');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await page.goto('/admin');
        await expect(page.locator('text=/Access Denied/i')).toBeVisible();
    });

    test('Correct PIN unlocks the admin panel', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await expect(page.locator('text=/Race Results/i').first()).toBeVisible();
    });

    test('Wrong PIN does not unlock the admin panel', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '9999');
        await page.click('button:has-text("AUTHENTICATE")');
        // Should still be on the PIN screen
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    // ── Race Results tab ─────────────────────────────────────────

    test('Race Results tab lists all 22 races', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        // Miami GP and Abu Dhabi GP must both appear (first and last of the updated calendar)
        await expect(page.locator('text=Miami GP').first()).toBeVisible();
        await expect(page.locator('text=Abu Dhabi GP').first()).toBeVisible();
        // Cancelled races must NOT appear
        await expect(page.locator('text=Bahrain GP')).not.toBeVisible();
    });

    test('Expanding a race shows Fetch from F1 API and lock toggle', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        const r4 = page.locator('button').filter({ hasText: /Miami GP/ });
        await r4.click();

        await expect(page.locator('button:has-text("Fetch from F1 API")').first()).toBeVisible();
        await expect(
            page.locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).first()
        ).toBeVisible();
    });

    test('Manual unlock toggle switches between AUTO-LOCK and FORCED OPEN', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        const r4 = page.locator('button').filter({ hasText: /Miami GP/ });
        await r4.click();

        const toggle = page.locator('div').filter({ hasText: /Miami GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();

        const before = await toggle.innerText();
        await toggle.click();
        const after = await toggle.innerText();
        expect(before).not.toEqual(after);

        // Revert
        await toggle.click();
    });

    // ── Score Override tab ───────────────────────────────────────

    test('Score Override tab has populated dropdowns', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await page.click('button:has-text("Score Override")');

        // User select must have at least 2 options (placeholder + 1 user)
        const userSelect = page.locator('select').filter({ has: page.locator('option:has-text("Select user")') });
        const userOptions = await userSelect.locator('option').count();
        expect(userOptions).toBeGreaterThan(1);

        // Race select must include Miami GP
        const raceSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /Miami GP/ }) });
        await expect(raceSelect).toBeVisible();
    });

    test('Score Override validation blocks empty form', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await page.click('button:has-text("Score Override")');

        page.on('dialog', async (d) => {
            expect(d.message()).toMatch(/fill all fields/i);
            await d.dismiss();
        });

        await page.click('button:has-text("APPLY OVERRIDE")');
        await expect(page.locator('button:has-text("APPLY OVERRIDE")')).toBeVisible();
    });

    // ── Year End tab ─────────────────────────────────────────────

    test('Year End tab shows lock toggle and Calculate button', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await page.click('button:has-text("Year End")');

        await expect(page.locator('button:has-text("CALCULATE & SCORE YEAR BETS")').first()).toBeVisible();
        await expect(page.locator('button:has-text("OPEN"), button:has-text("LOCKED")').last()).toBeVisible();
    });
});
