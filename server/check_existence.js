
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function listTables() {
    console.log('--- Listing All Tables in Public Schema ---');
    try {
        const { data, error } = await supabase
            .rpc('get_tables'); // This might not exist, alternative below

        if (error) {
            // Alternative: try to select from a non-existent table to see error or use a known one
            const { data: data2, error: error2 } = await supabase
                .from('workspace_members')
                .select('*')
                .limit(1);
            
            if (error2) {
                console.log('Error selecting from workspace_members:', error2.message);
                if (error2.message.includes('does not exist')) {
                    console.log('CONFIRMED: workspace_members table DOES NOT EXIST.');
                }
            } else {
                console.log('SUCCESS: workspace_members table EXISTS.');
            }
            
            // Try to list schemas if possible
            const { data: data3, error: error3 } = await supabase.from('workspaces').select('id').limit(1);
            if (!error3) console.log('workspaces table EXISTS.');
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

listTables();
