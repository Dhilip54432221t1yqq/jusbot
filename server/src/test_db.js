
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Dotenv error:', result.error);
} else {
    console.log('Dotenv parsed:', result.parsed ? Object.keys(result.parsed) : 'EMPTY');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);
console.log('Using Key:', supabaseKey ? 'PRESENT' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('--- Testing user_fields ---');
    const { data: listData, error: listError } = await supabase.from('user_fields').select('*').limit(1);
    if (listError) {
        console.error('List error:', listError);
    } else {
        console.log('List success, items count:', listData.length);
    }

    console.log('--- Testing Insert ---');
    const testField = { name: 'Test Field ' + Date.now(), type: 'Text' };
    const { data: insertData, error: insertError } = await supabase.from('user_fields').insert(testField).select();
    if (insertError) {
        console.error('Insert error:', insertError);
    } else {
        console.log('Insert success:', insertData[0]);
    }
}

testConnection().catch(console.error);
