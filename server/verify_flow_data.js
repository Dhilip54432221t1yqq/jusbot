import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyColumn() {
    console.log('--- Database Column Verification ---');

    // We try to select the column specifically
    const { data, error } = await supabase
        .from('flows')
        .select('flow_data')
        .limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('flow_data')) {
            console.log('❌ COLUMN MISSING: flow_data does not exist in the flows table.');
            console.log('Please run the SQL in fix_flow_data.sql in your Supabase SQL Editor.');
        } else {
            console.log('❌ ERROR:', error.message);
        }
    } else {
        console.log('✅ COLUMN OK: flow_data column exists and is accessible.');
    }
}

verifyColumn();
