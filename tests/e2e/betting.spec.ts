import { test, expect } from '@playwright/test';

test.describe('Betting Logic & Admin Overrides', () => {

    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('Round 4 is Miami GP — not Bahrain', async ({ page }) => {
        // After migration 004 the calendar no longer contains Bahrain or Saudi.
        // Round 4 must be Miami GP.
        await page.goto('/bets/race');
        await expect(page.locator('text=Miami GP')).toBeVisible();
        await expect(page.locator('text=Bahrain GP')).not.toBeVisible();
        await expect(page.locator('text=Saudi Arabian GP')).not.toBeVisible();
    });

    test('Sequential Betting: Round 4 (Miami GP) is open the day before the race', async ({ page }) => {
        // Today is 2026-05-02. Miami race is 2026-05-03. Bets must be open.
        await page.goto('/bets/race/4');
        const title = page.locator('h1, h2, [class*="font-display"]').filter({ hasText: /Miami/i });
        await expect(title.first()).toBeVisible();

        // The submit button must NOT show "BETS LOCKED"
        const lockedBtn = page.locator('button:has-text("BETS LOCKED")');
        await expect(lockedBtn).not.toBeVisible();
    });

    test('Admin Override: Forced Open allows betting on a race', async ({ page }) => {
        // 1. Go to Admin and Force Open Round 4 (Miami GP)
        await page.goto('/admin');

        // Enter Admin PIN
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');

        // Expand Miami GP (Round 4)
        const round4Header = page.locator('button').filter({ hasText: /Miami GP/ });
        await round4Header.click();

        // Find the lock toggle inside the expanded section
        const toggleBtn = page.locator('div').filter({ hasText: /Miami GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();

        const currentText = await toggleBtn.innerText();
        if (currentText.includes('AUTO-LOCK')) {
            await toggleBtn.click();
        }

        // Verify FORCED OPEN state in Admin
        await expect(
            page.locator('div').filter({ hasText: /Miami GP/ }).locator('button').filter({ hasText: 'FORCED OPEN' }).last()
        ).toBeVisible();

        // 2. Verify the bet page reflects the forced-open state
        await page.goto('/bets/race/4');
        const openStatus = page.locator('text=FORCED OPEN');
        await expect(openStatus).toBeVisible();

        // 3. Cleanup: Set it back to AUTO-LOCK
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("AUTHENTICATE")');
        await round4Header.click();
        const toggleBtnBack = page.locator('div').filter({ hasText: /Miami GP/ })
            .locator('button').filter({ hasText: 'FORCED OPEN' }).last();
        await toggleBtnBack.click();
    });

    test('Upsert Logic: Users can update bets multiple times', async ({ page }) => {
        // Use Round 1 (Australian GP — always open for testing)
        await page.goto('/bets/race/1');

        const selectDriver = async (name: string) => {
            await page.locator('.space-y-2.max-h-\\[400px\\]').locator(`text=${name}`).first().click();
        };

        // Fill podiums
        await selectDriver('Max Verstappen');
        await selectDriver('Charles Leclerc');
        await selectDriver('Lewis Hamilton');

        // Fill Extras
        await page.click('button:has-text("EXTRAS")');

        await page.locator('div:has-text("DNF Prediction") + div').locator('text=Lando Norris').first().click();
        await page.locator('div:has-text("Team with Most Points") + div').locator('text=McLaren').first().click();

        const specialGrid = page.locator('div:has-text("SPECIAL CATEGORY")').locator('..').locator('..');
        const firstOption = specialGrid.locator('button, .data-readout').first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
        }

        // Submit first time
        await page.click('button:has-text("LOCK IN RACE BETS")');
        await expect(page.locator('text=Bets Submitted!')).toBeVisible({ timeout: 15000 });

        // Go back and change P1
        await page.goto('/bets/race/1');
        await page.click('button:has-text("PODIUM")');

        await selectDriver('Max Verstappen'); // Deselect
        await selectDriver('Lando Norris');   // New P1

        await page.click('button:has-text("LOCK IN RACE BETS")');
        await expect(page.locator('text=Bets Submitted!')).toBeVisible({ timeout: 15000 });

        // Verify P1 persisted
        await page.goto('/bets/race/1');
        await expect(
            page.locator('.telemetry-border:has-text("P1")').locator('text=Lando Norris')
        ).toBeVisible();
    });
});
