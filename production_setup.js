const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function purgeAndSetup() {
    try {
        console.log("--- 1. Deleting Dynamic Data ---");

        // Delete Scores
        const { error: scoreErr } = await supabase.from('scores').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        if (scoreErr) console.error("Error deleting scores:", scoreErr.message);

        // Delete Race Bets
        const { error: raceBetErr } = await supabase.from('bets_race').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        if (raceBetErr) console.error("Error deleting race bets:", raceBetErr.message);

        // Delete Year Bets
        const { error: yearBetErr } = await supabase.from('bets_year').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        if (yearBetErr) console.error("Error deleting year bets:", yearBetErr.message);

        // Delete Year End Results
        const { error: yearResultErr } = await supabase.from('year_results').delete().neq('season', 0);
        if (yearResultErr) console.error("Error deleting year results:", yearResultErr.message);

        // Reset Races
        const { error: raceResetErr } = await supabase.from('races').update({
            result_p1: null,
            result_p2: null,
            result_p3: null,
            result_dnf_drivers: null,
            result_team_most_points: null,
            special_category_answer: null,
            is_scored: false,
            is_locked: false
        }).neq('round', 0);
        if (raceResetErr) console.error("Error resetting races:", raceResetErr.message);

        console.log("--- 2. Managing Users ---");
        const requestedUsers = [
            'MiguelV', 'CarlotaBV', 'LuisV', 'CarlotaRS', 'GoncaloRS', 'MargaridaB', 'SegismundoB'
        ];

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const keepList = [...requestedUsers.map(u => u.toLowerCase()), 'braganca', 'stcbr']; // stcbr is likely the admin or test user I should keep for now unless sure

        for (const user of users) {
            const emailPrefix = user.email.split('@')[0].toLowerCase();
            const usernameMeta = (user.user_metadata?.username || "").toLowerCase();

            if (!keepList.includes(emailPrefix) && !keepList.includes(usernameMeta)) {
                console.log(`Deleting user: ${user.email} (${user.id})`);
                await supabase.auth.admin.deleteUser(user.id);
            } else {
                console.log(`Keeping user: ${user.email}`);
            }
        }

        // 3. Create/Ensure Requested Users
        for (const username of requestedUsers) {
            const existing = users.find(u =>
                u.email.toLowerCase().startsWith(username.toLowerCase() + '@') ||
                (u.user_metadata?.username || "").toLowerCase() === username.toLowerCase()
            );

            if (!existing) {
                console.log(`Creating user: ${username}`);
                const { data, error } = await supabase.auth.admin.createUser({
                    email: `${username.toLowerCase()}@fantasyf1.com`,
                    password: 'fantasyf1',
                    email_confirm: true,
                    user_metadata: { username: username }
                });

                if (error) {
                    console.error(`Error creating ${username}:`, error.message);
                } else if (data.user) {
                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        display_name: username,
                        avatar_emoji: '🏎️'
                    });
                }
            } else {
                console.log(`User ${username} already exists (Email: ${existing.email})`);
                // Ensure profile exists correctly
                await supabase.from('profiles').upsert({
                    id: existing.id,
                    display_name: username
                });
            }
        }

        console.log("\n--- COMPLETE ---");
    } catch (err) {
        console.error("CRITICAL ERROR:", err);
    }
}

purgeAndSetup();
