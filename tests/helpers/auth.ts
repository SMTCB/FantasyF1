import { Page, expect } from '@playwright/test';

export const TEST_ADMIN = {
    username: process.env.TEST_ADMIN_USERNAME ?? '',
    password: process.env.TEST_ADMIN_PASSWORD ?? '',
};

export const TEST_USER = {
    username: process.env.TEST_USER_USERNAME ?? TEST_ADMIN.username,
    password: process.env.TEST_USER_PASSWORD ?? TEST_ADMIN.password,
};

export async function loginAs(page: Page, username: string, password: string) {
    await page.goto('/login');
    await page.fill('input[placeholder="Enter username"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
}

export async function loginAsAdmin(page: Page) {
    await loginAs(page, TEST_ADMIN.username, TEST_ADMIN.password);
}

export async function loginAsUser(page: Page) {
    await loginAs(page, TEST_USER.username, TEST_USER.password);
}

export async function enterAdminPin(page: Page) {
    // Wait for the auth check to settle (loading spinner disappears)
    await page.locator('button:has-text("AUTHENTICATE")').waitFor({ state: 'visible', timeout: 15000 });
    await page.fill('input[type="password"]', '2026');
    await page.click('button:has-text("AUTHENTICATE")');
}
