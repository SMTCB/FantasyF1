const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refactorUsers() {
    console.log("--- STARTING USER REFACTOR ---");

    // 1. Fetch current users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error.message);
        return;
    }

    const deleteList = ['stcbr', 'braganca'];
    const usersToDelete = users.filter(u => {
        const username = (u.user_metadata?.username || u.email.split('@')[0]).toLowerCase();
        return deleteList.includes(username);
    });

    for (const u of usersToDelete) {
        console.log(`Deleting user: ${u.email} (${u.id})`);
        // Auth deletion cascades if profile is set up with ON DELETE CASCADE
        await supabase.auth.admin.deleteUser(u.id);
    }

    // 2. Assign unique emojis to remaining users
    const requestedUsers = [
        { name: 'MiguelV', emoji: '🏁' },
        { name: 'CarlotaBV', emoji: '🏎️' },
        { name: 'LuisV', emoji: '🏆' },
        { name: 'CarlotaRS', emoji: '🚥' },
        { name: 'GoncaloRS', emoji: '🧤' },
        { name: 'MargaridaB', emoji: '⛽' },
        { name: 'SegismundoB', emoji: '🛡️' }
    ];

    for (const config of requestedUsers) {
        const user = users.find(u =>
            (u.user_metadata?.username || "").toLowerCase() === config.name.toLowerCase() ||
            u.email.toLowerCase().startsWith(config.name.toLowerCase() + '@')
        );

        if (user) {
            console.log(`Updating ${config.name} with emoji ${config.emoji}`);
            await supabase.from('profiles').upsert({
                id: user.id,
                display_name: config.name,
                avatar_emoji: config.emoji
            });
        } else {
            console.warn(`User ${config.name} not found for emoji update.`);
        }
    }

    console.log("--- REFACTOR COMPLETE ---");
}

refactorUsers();
