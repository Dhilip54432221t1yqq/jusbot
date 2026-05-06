
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function testCreateWorkspace() {
    console.log('--- Testing Workspace Creation (sequential IDs) ---');
    
    // Use a dummy user ID that likely exists or bypass FK if RLS is off
    // If auth.users FK is active, we need a valid user ID.
    // Let's try to get a random user from auth.users or just use a known UUID-like string
    const testUserId = '00000000-0000-0000-0000-000000000000'; // This might fail if FK is strict

    try {
        console.log('Attempting to insert into workspaces...');
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({
                name: 'Test Sequential Workspace',
                user_id: testUserId 
            })
            .select()
            .single();

        if (wsError) {
            console.error('Workspace Insert Error:', wsError);
            return;
        }

        console.log('Workspace Created Successfully:', workspace);

        console.log('Attempting to insert into workspace_members...');
        const { error: memError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: testUserId,
                role: 'owner'
            });

        if (memError) {
            console.error('Membership Insert Error:', memError);
        } else {
            console.log('Membership Created Successfully!');
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testCreateWorkspace();
