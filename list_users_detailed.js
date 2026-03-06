const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error.message);
        return;
    }
    console.log("Current Users:");
    users.forEach(u => {
        console.log(`- ${u.email} (${u.user_metadata?.username || 'no username'}) - ID: ${u.id}`);
    });

    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log("\nProfiles:");
    console.table(profiles);
}

checkCurrentUsers();
