import { test, expect } from '@playwright/test';

test.describe('Comprehensive Scoring & Presentation Flow', () => {

    test('Two users betting, admin scoring, and leaderboard verification', async ({ page }) => {
        // Increase timeout for this long sequence
        test.setTimeout(180000);

        // --- 1. ADMIN: Unlock everything for testing ---
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("ACCESS PANEL")');

        // Unlock Round 1 (Australia)
        const round1Header = page.locator('button:has-text("Australian GP")');
        await round1Header.click();

        // Wait for force open/auto lock buttons
        const lockToggle = page.locator('div:has-text("Australian GP")').locator('button:has-text("AUTO-LOCK"), button:has-text("FORCED OPEN")');
        const lockText = await lockToggle.innerText();
        if (lockText.includes('AUTO-LOCK')) {
            await lockToggle.click();
            await expect(page.locator('div:has-text("Australian GP")').locator('button:has-text("FORCED OPEN")')).toBeVisible();
        }

        // Unlock Year Bets if locked
        const yearLockBtn = page.locator('button:has-text("LOCKED"), button:has-text("OPEN")');
        const yearLockText = await yearLockBtn.innerText();
        if (yearLockText.includes('LOCKED')) {
            await yearLockBtn.click();
            await expect(page.locator('button:has-text("OPEN")')).toBeVisible();
        }

        // Logout
        await page.goto('/');
        await page.click('button:has-text("SIGNOUT")');

        // --- 2. USER 1 (stcbr): Submit Bets ---
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'stcbr');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // Race Bet
        await page.goto('/bets/race/1');

        // Select P1, P2, P3 sequentially (they unlock as you fill)
        await page.selectOption('div:has(> label:text-is("P1")) select', 'Max Verstappen');
        await page.selectOption('div:has(> label:text-is("P2")) select', 'Sergio Perez');
        await page.selectOption('div:has(> label:text-is("P3")) select', 'Charles Leclerc');

        await page.selectOption('div:has(> label:has-text("FIRST DNF")) select', 'Logan Sargeant');
        await page.selectOption('div:has(> label:has-text("TEAM MOST POINTS")) select', 'Red Bull');
        await page.selectOption('div:has(> label:has-text("SPECIAL:")) select', '18');

        await page.click('button:has-text("LOCK IN PREDICTIONS")');
        await expect(page.locator('text=PREDICTIONS LOCKED')).toBeVisible();

        // Logout
        await page.goto('/');
        await page.click('button:has-text("SIGNOUT")');

        // --- 3. USER 2 (test_racer): Submit Bets ---
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'test_racer');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        await page.goto('/bets/race/1');
        await page.selectOption('div:has(> label:text-is("P1")) select', 'Charles Leclerc');
        await page.selectOption('div:has(> label:text-is("P2")) select', 'Max Verstappen');
        await page.selectOption('div:has(> label:text-is("P3")) select', 'Sergio Perez');

        await page.selectOption('div:has(> label:has-text("FIRST DNF")) select', 'Logan Sargeant');
        await page.selectOption('div:has(> label:has-text("TEAM MOST POINTS")) select', 'Ferrari');
        await page.selectOption('div:has(> label:has-text("SPECIAL:")) select', '20');

        await page.click('button:has-text("LOCK IN PREDICTIONS")');
        await expect(page.locator('text=PREDICTIONS LOCKED')).toBeVisible();

        await page.goto('/');
        await page.click('button:has-text("SIGNOUT")');

        // --- 4. ADMIN: Set Results & Trigger Scoring ---
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');

        await page.goto('/admin');
        await page.fill('input[type="password"]', '2026');
        await page.click('button:has-text("ACCESS PANEL")');

        await round1Header.click();

        // Fill results in Admin Panel
        const adminSection = page.locator('div:has-text("Australian GP")');
        await adminSection.locator('div:has(> label:text-is("P1")) select').selectOption('Max Verstappen');
        await adminSection.locator('div:has(> label:text-is("P2")) select').selectOption('Sergio Perez');
        await adminSection.locator('div:has(> label:text-is("P3")) select').selectOption('Charles Leclerc');
        await adminSection.locator('div:has(> label:has-text("FIRST DNF")) select').selectOption('Logan Sargeant');
        await adminSection.locator('div:has(> label:text-is("TEAM MOST POINTS")) select').selectOption('Red Bull');
        await adminSection.locator('div:has(> label:has-text("SPECIAL:")) select').selectOption('18');

        await page.click('button:has-text("Save Results & Score")');
        await expect(page.locator('text=results & scores saved successfully')).toBeVisible();

        // --- 5. VERIFY LEADERBOARD ---
        await page.goto('/');

        // Wait for leaderboard to load
        await expect(page.locator('text=LEADERBOARD')).toBeVisible();

        const stcbrRow = page.locator('div:has-text("stcbr")');
        // Sum: 10 + 8 + 6 + 5(bonus) + 5(dnf) + 5(team) + 10(special) + 10(all correct) = 59
        await expect(stcbrRow.locator('text=59')).toBeVisible();

        const testRacerRow = page.locator('div:has-text("test_racer")');
        // Sum: 3 + 3 + 3(wrong spot) + 5(dnf correct) = 14
        await expect(testRacerRow.locator('text=14')).toBeVisible();
    });
});
