import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verify() {
    console.log('--- Verification Script ---');

    try {
        // 1. Get current user
        const testUserId = 'd229ed3d-cf7f-4793-91a6-dd52df7f0e16';
        console.log('Using test user ID:', testUserId);

        // 2. Simulate workspace creation logic (similar to Login.jsx)
        console.log('Simulating workspace creation for user:', testUserId);
        const { data: newWs, error: wsError } = await supabase
            .from('workspaces')
            .insert([{ name: 'Test Workspace ' + Date.now(), user_id: testUserId }])
            .select()
            .single();

        if (wsError) throw wsError;
        const workspaceId = newWs.id;
        console.log('Created Workspace:', workspaceId);

        // 3. Insert default fields (as per Login.jsx)
        const defaultFields = [
            { name: 'User Name', type: 'Text', workspace_id: workspaceId },
            { name: 'User Id', type: 'Number', workspace_id: workspaceId },
            { name: 'Phone', type: 'Text', workspace_id: workspaceId },
            { name: 'Email', type: 'Text', workspace_id: workspaceId },
            { name: 'Last User Input', type: 'Text', workspace_id: workspaceId }
        ];

        const { error: fieldsError } = await supabase
            .from('user_fields')
            .insert(defaultFields);

        if (fieldsError) throw fieldsError;
        console.log('Inserted default fields successfully.');

        // 4. Verify fields exist
        const { data: fields } = await supabase
            .from('user_fields')
            .select('name')
            .eq('workspace_id', workspaceId);

        console.log('Fields in new workspace:', fields.map(f => f.name));
        const expected = ['User Name', 'User Id', 'Phone', 'Email', 'Last User Input'];
        const missing = expected.filter(name => !fields.find(f => f.name === name));

        if (missing.length === 0) {
            console.log('SUCCESS: All default fields found.');
        } else {
            console.error('FAILURE: Missing fields:', missing);
        }

        // 5. Cleanup
        await supabase.from('workspaces').delete().eq('id', workspaceId);
        console.log('Test workspace cleaned up.');

    } catch (err) {
        console.error('Verification error:', err);
    }
}

verify();
