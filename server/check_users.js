
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function checkUserData() {
    console.log('--- Checking User IDs in Workspaces ---');
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, user_id');
        
        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('Total Workspaces:', data.length);
        data.forEach(ws => {
            console.log(`WS: ${ws.id} | Name: ${ws.name} | UserID: ${ws.user_id} | Length: ${ws.user_id ? ws.user_id.length : 'NULL'}`);
        });

        // Also check if any exist in auth.users (if we can)
        // Usually we can't select from auth.users directly via anon key
    } catch (err) {
        console.error('Unexpected crash:', err);
    }
}

checkUserData();
