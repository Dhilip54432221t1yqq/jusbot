
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function checkMetadata() {
    console.log('--- Checking Column Metadata ---');
    try {
        // Query information_schema
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'workspaces'"
        });
        
        if (error) {
            console.log('RPC exec_sql FAILED or not found. trying direct select trick...');
            // Try to get one row and check types if possible in JS
            const { data: rows } = await supabase.from('workspaces').select('*').limit(1);
            if (rows && rows.length > 0) {
                console.log('Sample Data Structure:', Object.keys(rows[0]).map(k => `${k}: ${typeof rows[0][k]}`));
                console.log('User ID Example:', rows[0].user_id);
            }
        } else {
            console.log('Column Metadata:', data);
        }
    } catch (err) {
        console.error('Unexpected crash:', err);
    }
}

checkMetadata();
