import { createUserField, listUserFields } from './src/services/content.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    try {
        // 1. Get a workspace ID
        const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
        if (!workspaces || workspaces.length === 0) {
            console.error('No workspaces found to test with.');
            return;
        }
        const workspaceId = workspaces[0].id;
        console.log('Testing with Workspace ID:', workspaceId);

        // 2. Try to create a user field
        const newField = {
            name: 'Test Field ' + Date.now(),
            type: 'Text',
            description: 'Test Description',
            workspace_id: workspaceId
        };

        console.log('Attempting to create user field:', newField);
        const created = await createUserField(newField);
        console.log('Created Field:', created);

        // 3. Verify it's in the list
        const list = await listUserFields(workspaceId);
        const found = list.find(f => f.id === created.id);
        if (found) {
            console.log('SUCCESS: Field found in list.');
        } else {
            console.error('FAILURE: Field NOT found in list.');
        }

    } catch (err) {
        console.error('Unexpected error during test:', err);
    }
}

test();
