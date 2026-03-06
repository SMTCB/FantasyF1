const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestUsers() {
    const users = [
        { email: 'stcbr@f1.local', password: 'fantasyf1', username: 'stcbr' },
        { email: 'test_racer@f1.local', password: 'fantasyf1', username: 'test_racer' }
    ];

    for (const u of users) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { username: u.username }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log(`User ${u.username} already exists`);
            } else {
                console.error(`Error creating ${u.username}:`, error.message);
            }
        } else {
            console.log(`User ${u.username} created`);
            // Ensure profile exists
            await supabase.from('profiles').upsert({
                id: data.user.id,
                display_name: u.username,
                avatar_emoji: '🏎️'
            });
        }
    }
}

setupTestUsers();
