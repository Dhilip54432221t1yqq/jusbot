import { supabase } from '../src/utils/supabase.js';

async function run() {
    console.log('Adding continue_selling to products...');
    const { error: err1 } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS continue_selling BOOLEAN DEFAULT false;'
    });
    if (err1) console.error('Error 1:', err1);

    console.log('Adding continue_selling to product_variants...');
    const { error: err2 } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS continue_selling BOOLEAN DEFAULT false;'
    });
    if (err2) console.error('Error 2:', err2);

    console.log('Done.');
}

run();
