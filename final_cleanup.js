const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalCleanup() {
    console.log("Cleaning up all tables with correct schema...");

    await supabase.from('scores').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bets_race').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bets_year').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('year_results').delete().neq('season', 0);

    console.log("Resetting races...");
    const { error } = await supabase.from('races').update({
        result_p1: null,
        result_p2: null,
        result_p3: null,
        result_dnf_drivers: null,
        result_team_most_points: null,
        special_category_answer: null,
        is_scored: false,
        is_manual_unlock: false
    }).gte('round', 1);

    if (error) console.error("Races Reset Error:", error.message);
    else console.log("Races Reset Success!");

    console.log("Cleanup done.");
}

finalCleanup();
