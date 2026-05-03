import { test, expect, request } from '@playwright/test';
import { loginAsAdmin, enterAdminPin } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });
test.describe('Race Bets', () => {

    test.afterAll(async () => {
        // Ensure round 1 is reset to auto-lock even if force-open test fails
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
        await supabase.from('races').update({ is_manual_unlock: false }).eq('round', 1);
    });

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    // ── Calendar ────────────────────────────────────────────────

    test('Race list shows Miami GP and no cancelled GPs', async ({ page }) => {
        await page.goto('/bets/race');
        await expect(page.locator('text=Miami GP').first()).toBeVisible();
        await expect(page.locator('text=Bahrain GP')).not.toBeVisible();
        await expect(page.locator('text=Saudi Arabian GP')).not.toBeVisible();
    });

    test('Round 4 page shows Miami GP', async ({ page }) => {
        await page.goto('/bets/race/4');
        await expect(page.locator('text=/Miami/i').first()).toBeVisible();
    });

    // ── Lock status ─────────────────────────────────────────────

    test('Miami GP (round 4) bets are open before the race', async ({ page }) => {
        await page.goto('/bets/race/4');
        await expect(page.locator('button:has-text("BETS LOCKED")')).not.toBeVisible();
    });

    test('Past races show locked state', async ({ page }) => {
        await page.goto('/bets/race/1');
        await expect(page.locator('span.lock-indicator.locked').first()).toBeVisible();
    });

    // ── Admin force-open + bet submission ───────────────────────

    test('Force-open unlocks a past race and revert restores lock', async ({ page }) => {
        await page.goto('/admin');
        await enterAdminPin(page);

        const r1 = page.locator('button').filter({ hasText: /Australian GP/ });
        await r1.click();

        const toggle = page.locator('div').filter({ hasText: /Australian GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();

        // Force-open if currently auto-locked
        if ((await toggle.innerText()).includes('AUTO-LOCK')) {
            await toggle.click();
            await expect(toggle).toContainText('FORCED OPEN', { timeout: 5000 });
        }

        // Bet page should now be accessible (no locked indicator)
        await page.goto('/bets/race/1');
        await expect(page.locator('span.lock-indicator.locked')).not.toBeVisible();

        // Revert to AUTO-LOCK
        await page.goto('/admin');
        await enterAdminPin(page);
        const r1b = page.locator('button').filter({ hasText: /Australian GP/ });
        await r1b.click();
        const lockToggle = page.locator('div').filter({ hasText: /Australian GP/ })
            .locator('button').filter({ hasText: /AUTO-LOCK|FORCED OPEN/ }).last();
        if ((await lockToggle.innerText()).includes('FORCED OPEN')) {
            await lockToggle.click();
        }
        await expect(lockToggle).toContainText('AUTO-LOCK', { timeout: 5000 });
    });
});
