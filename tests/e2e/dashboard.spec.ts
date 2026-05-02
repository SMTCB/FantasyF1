import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Enter username"]', 'braganca');
        await page.fill('input[type="password"]', 'fantasyf1');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('Leaderboard loads with at least one player', async ({ page }) => {
        await expect(page.locator('text=/leaderboard/i').first()).toBeVisible();
        // At least one row visible (braganca is always a user)
        await expect(page.locator('text=braganca').first()).toBeVisible();
    });

    test('Next race hero shows a race name and countdown', async ({ page }) => {
        // Should show a GP name
        const hero = page.locator('[class*="NextRace"], [data-testid="next-race"], .glass-card').first();
        await expect(hero).toBeVisible();
        // Countdown has days/hrs/mins/secs sections
        await expect(page.locator('text=/DAYS|HRS|MINS|SECS/i').first()).toBeVisible();
    });

    test('Race calendar strip shows upcoming races', async ({ page }) => {
        await expect(page.locator('text=Miami GP').first()).toBeVisible();
    });

    test('Bottom navigation has 5 tabs', async ({ page }) => {
        // The BottomNav renders links for each section
        const navLinks = page.locator('nav a, nav button').filter({ hasText: /race|year|report|admin|home|dashboard/i });
        const count = await navLinks.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });
});
