
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjlngemrulrgmlhixjbs.supabase.co';
const supabaseKey = 'sb_publishable_FmjpCd8p-PCgYNAbybefPw_EPUsbMuE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking database connection...');

    // Check folders table
    const { data: folders, error: foldersError } = await supabase.from('folders').select('count').limit(1);

    if (foldersError) {
        console.error('Error accessing folders table:', foldersError.message);
        if (foldersError.code === '42P01') {
            console.log('CONFIRMED: folders table does not exist.');
        }
    } else {
        console.log('folders table exists.');
    }

    // Check flows table
    const { data: flows, error: flowsError } = await supabase.from('flows').select('count').limit(1);

    if (flowsError) {
        console.error('Error accessing flows table:', flowsError.message);
        if (flowsError.code === '42P01') {
            console.log('CONFIRMED: flows table does not exist.');
        }
    } else {
        console.log('flows table exists.');
    }
}

checkTables();
