require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Map based on your lock-status/route.ts
const ROUND_TO_COUNTRY = {
    1: 'Australia', 2: 'China', 3: 'Japan', 4: 'Bahrain',
    5: 'Saudi Arabia', 6: 'United States', 7: 'Canada', 8: 'Monaco',
    9: 'Spain', 10: 'Austria', 11: 'Great Britain', 12: 'Belgium',
    13: 'Hungary', 14: 'Netherlands', 15: 'Italy', 16: 'Spain',
    17: 'Azerbaijan', 18: 'Singapore', 19: 'United States', 20: 'Mexico',
    21: 'Brazil', 22: 'United States', 23: 'Qatar', 24: 'United Arab Emirates',
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncRaceTimes() {
    console.log("Starting Race Time Sync with OpenF1 API...");

    for (const [round, country] of Object.entries(ROUND_TO_COUNTRY)) {
        console.log(`Checking Round ${round} (${country})...`);

        try {
            const res = await fetch(
                `https://api.openf1.org/v1/sessions?year=2026&country_name=${encodeURIComponent(country)}&session_type=Race`
            );

            if (!res.ok) {
                console.warn(`Failed to fetch session for ${country}`);
                continue;
            }

            const data = await res.json();
            const session = data[0];

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
