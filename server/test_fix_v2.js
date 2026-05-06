
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function testWithValidUser() {
    console.log('--- Testing with Valid User ID ---');
    try {
        // 1. Get a valid user ID from existing workspaces
        const { data: workspaces, error: listError } = await supabase
            .from('workspaces')
            .select('user_id')
            .limit(1);
        
        if (listError || !workspaces || workspaces.length === 0) {
            console.error('Could not find a valid user ID in existing workspaces table.');
            return;
        }

        const validUserId = workspaces[0].user_id;
        console.log('Using valid user ID:', validUserId);

        // 2. Try to insert a new workspace
        const { data: newWs, error: insertError } = await supabase
            .from('workspaces')
            .insert({ name: 'Testing WS Fix', user_id: validUserId })
            .select()
            .single();
        
        if (insertError) {
            console.error('INSERT FAILED:', insertError);
            console.log('Error Code:', insertError.code);
            console.log('Error Message:', insertError.message);
            console.log('Error Details:', insertError.details);
            console.log('Error Hint:', insertError.hint);
        } else {
            console.log('INSERT SUCCESSFUL:', newWs.id);
            
            // 3. Try membership
            const { error: memError } = await supabase
                .from('workspace_members')
                .insert({ workspace_id: newWs.id, user_id: validUserId, role: 'owner' });
            
            if (memError) {
                console.error('MEMBERSHIP INSERT FAILED:', memError);
            } else {
                console.log('MEMBERSHIP INSERT SUCCESS!');
            }
        }
    } catch (err) {
        console.error('Unexpected crash:', err);
    }
}

testWithValidUser();
