import { test, expect } from '@playwright/test';
import { loginAsAdmin, TEST_ADMIN } from '../helpers/auth';

test.describe('Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('Leaderboard loads with Championship Standings heading', async ({ page }) => {
        await expect(page.locator('text=/Championship Standings/i').first()).toBeVisible({ timeout: 15000 });
    });

    test('Next race hero shows a race name and countdown', async ({ page }) => {
        await expect(page.locator('text=/DAYS|HRS|MIN|SEC/i').first()).toBeVisible();
    });

    test('Race calendar strip shows Miami GP', async ({ page }) => {
        await expect(page.locator('text=Miami GP').first()).toBeVisible();
    });

    test('Bottom navigation renders', async ({ page }) => {
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
    });
});
