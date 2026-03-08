const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabase() {
    console.log("Fixing SegismundoB admin status...");
    const { error: adminError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('display_name', 'SegismundoB');

    if (adminError) {
        console.error("Error updating admin status:", adminError.message);
    } else {
        console.log("SegismundoB is now an admin!");
    }

    console.log("Ensuring 2026 year_results row exists...");
    const { error: yearError } = await supabase
        .from('year_results')
        .upsert({ season: 2026, is_bets_locked: false }, { onConflict: 'season' });

    if (yearError) {
        console.error("Error upserting year_results:", yearError.message);
    } else {
        console.log("Year results 2026 row ensured!");
    }
}

fixDatabase();
