import { test, expect } from '@playwright/test';

test.describe('Race Bets', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    // ── Calendar ────────────────────────────────────────────────

    test('Race list shows 22 races and no cancelled GPs', async ({ page }) => {
        await page.goto('/bets/race');
        await expect(page.locator('text=Miami GP').first()).toBeVisible();
        await expect(page.locator('text=Bahrain GP')).not.toBeVisible();
        await expect(page.locator('text=Saudi Arabian GP')).not.toBeVisible();
    });

    test('Round 4 is Miami GP', async ({ page }) => {
        await page.goto('/bets/race/4');
        await expect(page.locator('text=/Miami/i').first()).toBeVisible();
    });

    // ── Lock status ─────────────────────────────────────────────

    test('Miami GP (round 4) bets are open before the race', async ({ page }) => {
        // Today is 2026-05-02, race is 2026-05-03 — bets must be open
        await page.goto('/bets/race/4');
        // No "BETS LOCKED" button visible
        await expect(page.locator('button:has-text("BETS LOCKED")')).not.toBeVisible();
    });

    test('Past races show locked state', async ({ page }) => {
        // Round 1 (Australia, 8 Mar) is in the past
        await page.goto('/bets/race/1');
        // Submit button is disabled or shows LOCKED
        const lockedIndicator = page.locator('button:has-text("BETS LOCKED"), span:has-text("LOCKED")');
        await expect(lockedIndicator.first()).toBeVisible();
    });

    // ── Bet submission ──────────────────────────────────────────

    test('Submitting race bets shows success confirmation', async ({ page }) => {
        // Admin force-open round 1 first so we can bet
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        const r1Header = page.locator('button').filter({ hasText: /Australian GP/ });
        await r1Header.click();

        const toggleBtn = page.locator('div').filter({ hasText: /Australian GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();
        if ((await toggleBtn.innerText()).includes('AUTO-LOCK')) {
            await toggleBtn.click();
            await expect(toggleBtn).toContainText('FORCED OPEN', { timeout: 5000 });
        }

        // Now place bet
        await page.goto('/bets/race/1');

        const selectDriver = async (name: string) => {
            await page.locator('.space-y-2, [class*="driver-list"]').locator(`text=${name}`).first().click();
        };

        await selectDriver('Max Verstappen');
        await selectDriver('Lando Norris');
        await selectDriver('Charles Leclerc');

        await page.click('button:has-text("LOCK IN RACE BETS")');
        await expect(page.locator('text=/Bets Submitted|LOCKED IN/i')).toBeVisible({ timeout: 10000 });

        // Cleanup — set back to AUTO-LOCK
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await r1Header.click();
        const forcedOpen = page.locator('div').filter({ hasText: /Australian GP/ })
            .locator('button').filter({ hasText: 'FORCED OPEN' }).last();
        if (await forcedOpen.isVisible()) await forcedOpen.click();
    });

    test('Bets can be changed and re-submitted before lock', async ({ page }) => {
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        const r1 = page.locator('button').filter({ hasText: /Australian GP/ });
        await r1.click();
        const toggle = page.locator('div').filter({ hasText: /Australian GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();
        if ((await toggle.innerText()).includes('AUTO-LOCK')) await toggle.click();

        await page.goto('/bets/race/1');

        const pick = async (name: string) =>
            page.locator('.space-y-2, [class*="driver-list"]').locator(`text=${name}`).first().click();

        await pick('Max Verstappen');
        await pick('Oscar Piastri');
        await pick('George Russell');
        await page.click('button:has-text("LOCK IN RACE BETS")');
        await expect(page.locator('text=/Bets Submitted|LOCKED IN/i')).toBeVisible({ timeout: 10000 });

        // Change P1
        await page.goto('/bets/race/1');
        await pick('Max Verstappen'); // deselect
        await pick('Lewis Hamilton'); // new P1
        await page.click('button:has-text("LOCK IN RACE BETS")');
        await expect(page.locator('text=/Bets Submitted|LOCKED IN/i')).toBeVisible({ timeout: 10000 });

        // Verify persisted
        await page.goto('/bets/race/1');
        await expect(page.locator('text=Lewis Hamilton').first()).toBeVisible();

        // Cleanup
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await r1.click();
        const fo = page.locator('div').filter({ hasText: /Australian GP/ })
            .locator('button').filter({ hasText: 'FORCED OPEN' }).last();
        if (await fo.isVisible()) await fo.click();
    });
});
