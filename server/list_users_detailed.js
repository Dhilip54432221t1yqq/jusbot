
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function listAllUserIds() {
    console.log('--- Listing All User IDs ---');
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .select('user_id, id, name');
        
        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('Found', data.length, 'workspaces.');
        data.forEach((ws, i) => {
            console.log(`[${i}] WS_ID: ${ws.id} | USER_ID: "${ws.user_id}" | LENGTH: ${ws.user_id ? ws.user_id.length : 0}`);
        });

    } catch (err) {
        console.error('Unexpected crash:', err);
    }
}

listAllUserIds();
