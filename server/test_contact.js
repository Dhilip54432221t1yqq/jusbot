import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFix() {
    console.log('--- Testing contact creation with the fixed schema ---');
    
    const { data, error } = await supabase.from('contacts').insert({
        workspace_id: 'RW1207',
        name: 'D Tech',
        email: null,
        phone: '+919488010981',
        whatsapp_user_id: `usr_${Date.now()}`,
        last_interaction: new Date(),
        subscribed_at: new Date(),
        updated_at: new Date()
    }).select().single();
    
    if (error) console.log('ERROR:', error.code, error.message);
    else {
        console.log('SUCCESS! Created contact:', data.name, data.id);
        // Clean up test
        await supabase.from('contacts').delete().eq('id', data.id);
        console.log('Cleaned up test record');
    }
}

testFix();
