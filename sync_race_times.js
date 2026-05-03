require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Must mirror ROUND_TO_COUNTRY and CALENDAR in src/lib/f1-data.ts exactly.
// Bahrain (old round 4) and Saudi Arabia (old round 5) were cancelled;
// migration 004 renumbered all subsequent rounds down by 2.
const ROUND_TO_COUNTRY = {
    1: 'Australia', 2: 'China', 3: 'Japan', 4: 'United States',
    5: 'Canada', 6: 'Monaco', 7: 'Spain', 8: 'Austria',
    9: 'Great Britain', 10: 'Belgium', 11: 'Hungary', 12: 'Netherlands',
    13: 'Italy', 14: 'Spain', 15: 'Azerbaijan', 16: 'Singapore',
    17: 'United States', 18: 'Mexico', 19: 'Brazil', 20: 'United States',
    21: 'Qatar', 22: 'United Arab Emirates',
};

// Race dates used to disambiguate countries that host multiple GPs (e.g. Spain, USA).
const ROUND_TO_DATE = {
    1: '2026-03-08', 2: '2026-03-15', 3: '2026-03-29', 4: '2026-05-03',
    5: '2026-05-24', 6: '2026-06-07', 7: '2026-06-14', 8: '2026-06-28',
    9: '2026-07-05', 10: '2026-07-19', 11: '2026-07-26', 12: '2026-08-23',
    13: '2026-09-06', 14: '2026-09-13', 15: '2026-09-26', 16: '2026-10-11',
    17: '2026-10-25', 18: '2026-11-01', 19: '2026-11-08', 20: '2026-11-21',
    21: '2026-11-29', 22: '2026-12-06',
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncRaceTimes() {
    console.log("Starting Race Time Sync with OpenF1 API...");

    for (const [round, country] of Object.entries(ROUND_TO_COUNTRY)) {
        const roundNum = parseInt(round);
        const expectedDate = ROUND_TO_DATE[roundNum];
        console.log(`Checking Round ${round} (${country}, ~${expectedDate})...`);

        try {
            const res = await fetch(
                `https://api.openf1.org/v1/sessions?year=2026&country_name=${encodeURIComponent(country)}&session_type=Race`
            );

            if (!res.ok) {
                console.warn(`Failed to fetch session for ${country}`);
                continue;
            }

            const data = await res.json();

            // Prefer the Grand Prix session (session_name === 'Race') over Sprint Race.
            // Sprint weekends return both 'Sprint Race' and 'Race' for session_type=Race.
            const gpSessions = data.filter(s => s.session_name === 'Race');
            const candidates = gpSessions.length > 0 ? gpSessions : data;

            // Disambiguate countries hosting multiple GPs by picking closest to expected date.
            let session = candidates[0];
            if (candidates.length > 1 && expectedDate) {
                const target = new Date(expectedDate).getTime();
                session = candidates.reduce((best, s) => {
                    const diff = Math.abs(new Date(s.date_start).getTime() - target);
                    const bestDiff = Math.abs(new Date(best.date_start).getTime() - target);
                    return diff < bestDiff ? s : best;
                }, candidates[0]);
            }

            if (session && session.date_start) {
                console.log(`Found session for ${country}: ${session.date_start}`);

                const { error } = await supabase
                    .from('races')
                    .update({ session_start: session.date_start })
                    .eq('round', parseInt(round));

                if (error) console.error(`Error updating DB for round ${round}:`, error.message);
                else console.log(`✅ Round ${round} updated with session time.`);
            } else {
                console.log(`No session data found for ${country} in 2026 yet.`);
            }
        } catch (e) {
            console.error(`Fetch error for ${country}:`, e.message);
        }
    }
    console.log("Sync complete.");
}

syncRaceTimes();
