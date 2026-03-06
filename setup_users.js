const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupUsers() {
    // 1. Ensure 'braganca' is an admin
    console.log('Ensuring braganca is admin...');
    const { data: p1, error: e1 } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('display_name', 'Braganca');

    if (e1) console.error('Failed to update braganca:', e1.message);

    // 2. Create 'stcbr' user
    console.log('Creating user stcbr...');
    const email = 'stcbr@f1.local';
    const password = 'fantasyf1';

    // Check if exists
    const { data: existing, error: e2 } = await supabase.auth.admin.listUsers();
    const userExists = existing && existing.users.find(u => u.email === email);

    if (!userExists) {
        const { data: newUser, error: e3 } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name: 'Stcbr' }
        });
        if (e3) {
            console.error('Failed to create user:', e3.message);
        } else {
            console.log('User stcbr created.');
        }
    } else {
        console.log('User stcbr already exists.');
    }
}

setupUsers();
