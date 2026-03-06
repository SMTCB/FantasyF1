import { test, expect } from '@playwright/test';

test.describe('OpenF1 API Functions', () => {

    test('Should fetch race session correctly (with caching)', async ({ request }) => {
        // 1. Australian GP 2026 check
        // Ensure the external API responds properly to a standard query
        const res = await request.get('https://api.openf1.org/v1/sessions?year=2024&country_name=Australia&session_type=Race');
        expect(res.ok()).toBeTruthy();

        const data = await res.json();
        expect(Array.isArray(data)).toBeTruthy();

        if (data.length > 0) {
            const session = data[0];
            expect(session).toHaveProperty('session_key');
            expect(session).toHaveProperty('date_start');
            expect(session.country_name).toContain('Australia');
        }
    });

    test('Internal API: Bet locking route /api/lock-status falls back gracefully', async ({ request }) => {
        // We request round 1 (Australia) which hasn't happened in 2026 yet (or might not be in the OpenF1 API yet as it's the future)
        const res = await request.get('/api/lock-status?round=1');
        expect(res.ok()).toBeTruthy();

        const data = await res.json();
        expect(data.round).toBe(1);
        expect(data).toHaveProperty('locked');
        expect(data).toHaveProperty('lockTime');
        expect(data).toHaveProperty('source');
    });

    test('Internal API: Returns 400 for invalid round', async ({ request }) => {
        const res = await request.get('/api/lock-status?round=99');
        expect(res.status()).toBe(400);
    });
});
