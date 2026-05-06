
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function diagnoseDatabase() {
    console.log('--- Deep Database Diagnosis ---');
    try {
        // 1. Check primary user ID
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current Auth User:', user ? user.id : 'NOT LOGGED IN');

        // 2. Check workspaces table structure and data
        const { data: wsData, error: wsError } = await supabase
            .from('workspaces')
            .select('*')
            .limit(5);
        
        if (wsError) {
            console.error('Error fetching workspaces:', wsError);
        } else {
            console.log('Recent Workspaces:', wsData);
        }

        // 3. Check workspace_members existence and schema hints
        const { data: memData, error: memError } = await supabase
            .from('workspace_members')
            .select('*')
            .limit(1);
        
        if (memError) {
            console.error('Error fetching workspace_members:', memError);
        } else {
            console.log('workspace_members table exists and is accessible.');
        }

        // 4. Test a REAL insert (using a valid user if possible, or just checking types)
        // If we have a user, let's try a dry run insert
        if (user) {
            console.log('Attempting dry-run insert with real user ID:', user.id);
            const testName = 'Diagnostic WS ' + Date.now();
            const { data: newWs, error: insertError } = await supabase
                .from('workspaces')
                .insert({ name: testName, user_id: user.id })
                .select()
                .single();
            
            if (insertError) {
                console.error('Insert INTO workspaces FAILED:', insertError);
            } else {
                console.log('Insert INTO workspaces SUCCESS:', newWs);
                // Try membership
                const { error: memInsertError } = await supabase
                    .from('workspace_members')
                    .insert({ workspace_id: newWs.id, user_id: user.id, role: 'owner' });
                
                if (memInsertError) {
                    console.error('Insert INTO workspace_members FAILED:', memInsertError);
                } else {
                    console.log('Insert INTO workspace_members SUCCESS!');
                }
            }
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

diagnoseDatabase();
