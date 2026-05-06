
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function checkSchema() {
    console.log('--- Checking Column Types ---');
    try {
        // We can check if we can insert a string into the ID column
        // If it's still a UUID, it will fail
        console.log('Testing if ID column accepts TEXT...');
        const { error } = await supabase
            .from('workspaces')
            .insert({ id: 'RWTEST1', name: 'Test Schema', user_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error) {
            console.log('Insert FAILED:', error.message);
            if (error.message.includes('invalid input syntax for type uuid')) {
                console.log('CONFIRMED: Column is still UUID.');
            }
        } else {
            console.log('SUCCESS: Column is TEXT.');
            // Cleanup
            await supabase.from('workspaces').delete().eq('id', 'RWTEST1');
        }

        // Check if there is a sequence or default
        console.log('Checking current default by omitting ID...');
        const { data, error: error2 } = await supabase
            .from('workspaces')
            .insert({ name: 'Default Test', user_id: '00000000-0000-0000-0000-000000000000' })
            .select('id')
            .single();
        
        if (data) {
            console.log('Generated ID:', data.id);
            // Cleanup
            await supabase.from('workspaces').delete().eq('id', data.id);
        } else {
            console.log('Failed to generate automatic ID:', error2.message);
        }

    } catch (err) {
        console.error('Unexpected crash:', err);
    }
}

checkSchema();
