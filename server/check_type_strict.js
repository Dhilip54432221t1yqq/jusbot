
import './src/config/env.js';
import { supabase } from './src/utils/supabase.js';

async function checkColumnType() {
    console.log('--- Testing user_id Column Type ---');
    try {
        console.log('Attempting to insert a NON-UUID into user_id...');
        const { error } = await supabase
            .from('workspaces')
            .insert({ name: 'Type Test', user_id: 'NOT-A-UUID' });
        
        if (error) {
            console.log('Error Message:', error.message);
            if (error.message.includes('invalid input syntax for type uuid')) {
                console.log('RESULT: user_id is definitely UUID type.');
            } else {
                console.log('RESULT: user_id might be TEXT type, but failed for another reason.');
            }
        } else {
            console.log('RESULT: user_id IS TEXT TYPE! (Inserted "NOT-A-UUID")');
            // Cleanup
            await supabase.from('workspaces').delete().eq('user_id', 'NOT-A-UUID');
        }
    } catch (err) {
        console.error('Unexpected crash:', err);
    }
}

checkColumnType();
