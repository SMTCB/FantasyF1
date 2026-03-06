const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase.from('races').update({
        result_p1: null,
        result_p2: null,
        result_p3: null,
        result_dnf_drivers: null,
        result_team_most_points: null,
        special_category_answer: null,
        is_scored: false,
        is_locked: false
    }).eq('round', 1).select();

    console.log(JSON.stringify({ data, error }, null, 2));
}

check();
