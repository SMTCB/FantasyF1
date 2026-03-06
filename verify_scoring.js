const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyData() {
    const { data: raceBets } = await supabase.from('bets_race').select('user_id, p1, p2, p3, dnf_driver, team_most_points, special_category_answer').eq('round', 1);
    console.log("ROUND 1 RACE BETS:", JSON.stringify(raceBets, null, 2));

    const { data: races } = await supabase.from('races').select('round, result_p1, result_p2, result_p3, is_scored').eq('round', 1);
    console.log("ROUND 1 RESULTS:", JSON.stringify(races, null, 2));

    const { data: scores } = await supabase.from('scores').select('user_id, round, total_points, score_type');
    console.log("SCORES:", JSON.stringify(scores, null, 2));

    const { data: leaderboard } = await supabase.from('leaderboard').select('display_name, total_points');
    console.log("LEADERBOARD:", JSON.stringify(leaderboard, null, 2));
}

verifyData();
