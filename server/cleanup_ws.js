
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function cleanupInvalidWorkspaces() {
    console.log('--- Cleaning Up Invalid Workspaces ---');
    try {
        // Find workspaces with the dummy ID
        const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, user_id');
        
        if (error) {
            console.error('Error fetching workspaces:', error);
            return;
        }

        console.log('Current Workspaces:', data);

        const invalid = data.filter(ws => ws.user_id === '00000000-0000-0000-0000-000000000000');
        
        if (invalid.length > 0) {
            console.log('Found invalid workspaces:', invalid);
            const { error: delError } = await supabase
                .from('workspaces')
                .delete()
                .eq('user_id', '00000000-0000-0000-0000-000000000000');
            
            if (delError) {
                console.error('Error deleting invalid workspaces:', delError);
            } else {
                console.log('Successfully deleted invalid workspaces.');
            }
        } else {
            console.log('No invalid workspaces found.');
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

cleanupInvalidWorkspaces();
