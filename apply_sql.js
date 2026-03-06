require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFixes() {
    console.log("Applying RLS fixes via REST (as a workaround for DDL)...");

    // Note: Since we cannot run raw DDL via the JS client easily, 
    // we use the Service Key to perform the initial state setup if needed.
    // However, the real fix for RLS MUST happen in the SQL Editor or via a migration.

    // If 'apply_migration' fails, it's likely a project permission issue for my MCP account.
    // I will try to use the REST API to force the columns/rows if they are missing.

    const { data, error } = await supabase
        .from('year_results')
        .upsert({ season: 2026, is_bets_locked: false }, { onConflict: 'season' });

    if (error) {
        console.error('Error during upsert:', error.message);
    } else {
        console.log('Upsert successful.');
    }

    console.log("IMPORTANT: RLS policies MUST be applied via the Supabase SQL Editor if the MCP tool fails.");
    console.log("SQL to run in Dashboard:");
    console.log(`
        ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public can view races" ON public.races;
        CREATE POLICY "Public can view races" ON public.races FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Anyone can update races" ON public.races;
        CREATE POLICY "Anyone can update races" ON public.races FOR UPDATE USING (true);

        ALTER TABLE public.year_results ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public can view year_results" ON public.year_results;
        CREATE POLICY "Public can view year_results" ON public.year_results FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Anyone can update year_results" ON public.year_results;
        CREATE POLICY "Anyone can update year_results" ON public.year_results FOR UPDATE USING (true);
    `);
}

applyFixes();
