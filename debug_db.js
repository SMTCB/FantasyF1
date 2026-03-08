const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentUsers() {
    console.log("Fetching profiles...");
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching profiles:", error.message);
        return;
    }
    console.log(JSON.stringify(profiles, null, 2));

    console.log("\nFetching year_results...");
    const { data: yearResults } = await supabase.from('year_results').select('*');
    console.log(JSON.stringify(yearResults, null, 2));
}

checkCurrentUsers();
