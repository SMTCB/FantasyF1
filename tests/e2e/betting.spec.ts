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

    test('Sequential Betting: Future races are locked by default', async ({ page }) => {
        await page.goto('/bets/race');

        // Round 4 (Bahrain GP) should be locked on Mar 6, 2026
        const round4 = page.locator('text=Bahrain GP');
        const round4Status = page.locator('div:has-text("Bahrain GP") >> span:has-text("LOCKED")');
        await expect(round4Status).toBeVisible();

        // Attempt to go to Round 4 page and verify it's locked there too
        await page.goto('/bets/race/4');
        const lockStatus = page.locator('span:has-text("LOCKED")');
        await expect(lockStatus).toBeVisible();
        const submitBtn = page.locator('button:has-text("BETS LOCKED")');
        await expect(submitBtn).toBeDisabled();
    });

    test('Admin Override: Forced Open allows betting on future races', async ({ page }) => {
        // 1. Go to Admin and Force Open Round 4
        await page.goto('/admin');

        // Enter Admin PIN
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("ACCESS PANEL")');

        // Expand Round 4
        const round4Header = page.locator('button:has-text("Bahrain GP")');
        await round4Header.click();

        // Find Round 4 in the list and toggle unlock
        const toggleBtn = page.locator('div:has-text("Bahrain GP")').locator('button', { hasText: /AUTO-LOCK|FORCED OPEN/ }).last();

        // Ensure we are toggling to FORCED OPEN
        const currentText = await toggleBtn.innerText();
        if (currentText.includes('AUTO-LOCK')) {
            await toggleBtn.click();
        }

        // Verify status changed in Admin
        await expect(page.locator('div:has-text("Bahrain GP")').locator('span:has-text("FORCED OPEN")')).toBeVisible();

        // 2. Go to Round 4 bet page and verify it's open
        await page.goto('/bets/race/4');
        const openStatus = page.locator('span:has-text("FORCED OPEN")');
        await expect(openStatus).toBeVisible();

        // 3. Cleanup: Set it back to AUTO-LOCK
        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("ACCESS PANEL")');
        await round4Header.click();
        const toggleBtnBack = page.locator('div:has-text("Bahrain GP")').locator('button:has-text("FORCED OPEN")');
        await toggleBtnBack.click();
    });

    test('Upsert Logic: Users can update bets multiple times', async ({ page }) => {
        // We'll use Round 1 as it should be open
        await page.goto('/bets/race/1');

        // Helper to select driver in the list (not in header)
        const selectDriver = async (name: string) => {
            await page.locator('.space-y-2.max-h-\\[400px\\]').locator(`text=${name}`).first().click();
        };

        // Fill some podiums
        await selectDriver('Max Verstappen'); // P1
        await selectDriver('Charles Leclerc'); // P2
        await selectDriver('Lewis Hamilton'); // P3

        // Fill Extras
        await page.click('button:has-text("EXTRAS")');

        // DNF driver - find in the DNF grid
        await page.locator('div:has-text("DNF Prediction") + div').locator('text=Lando Norris').first().click();

        // Team most points
        await page.locator('div:has-text("Team with Most Points") + div').locator('text=McLaren').first().click();

        // Special category
        const specialGrid = page.locator('div:has-text("SPECIAL CATEGORY")').locator('..').locator('..');
        const firstOption = specialGrid.locator('button, .data-readout').first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
        }

        // Submit first time
        await page.click('button:has-text("LOCK IN RACE BETS")');

        // Check for success - simplified check since we might navigate
        await expect(page.locator('text=Bets Submitted!')).toBeVisible({ timeout: 15000 });

        // Go back and change something
        await page.goto('/bets/race/1');
        await page.click('button:has-text("PODIUM")');

        // Deselect P1 (Max) and select Lando
        await selectDriver('Max Verstappen'); // Deselects P1
        await selectDriver('Lando Norris');   // Selects P1

        await page.click('button:has-text("LOCK IN RACE BETS")');
        await expect(page.locator('text=Bets Submitted!')).toBeVisible({ timeout: 15000 });

        // Refresh and check if P1 is Lando Norris
        await page.goto('/bets/race/1');
        await expect(page.locator('.telemetry-border:has-text("P1")').locator('text=Lando Norris')).toBeVisible();
    });
});
