import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
    console.log('--- Final Database Diagnostic ---');
    const tablesToCheck = ['workspaces', 'app_workspaces', 'folders', 'flows'];

    for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.log(`Table [${table}]: ERROR - ${error.code}: ${error.message}`);
        } else {
            console.log(`Table [${table}]: OK (Visible)`);
        }
    }
}

checkTables();
