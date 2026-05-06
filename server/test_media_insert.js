import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testMediaInsert() {
    console.log('Testing media insert...');
    
    // Test 1: Try with size
    console.log('\n--- Test 1: Insert WITH size column ---');
    const { data: d1, error: e1 } = await supabase.from('media_assets').insert({
        name: 'test_file.png',
        type: 'image',
        url: 'https://example.com/test.png',
        size: '10.7 KB',
        workspace_id: 'RW1207'
    }).select();
    if (e1) console.log('Error with size:', e1.code, e1.message, e1.details, e1.hint);
    else console.log('Success with size:', d1);

    // Test 2: Try without size
    console.log('\n--- Test 2: Insert WITHOUT size column ---');
    const { data: d2, error: e2 } = await supabase.from('media_assets').insert({
        name: 'test_file2.png',
        type: 'image',
        url: 'https://example.com/test2.png',
        workspace_id: 'RW1207'
    }).select();
    if (e2) console.log('Error without size:', e2.code, e2.message, e2.details, e2.hint);
    else console.log('Success without size:', d2);
    
    // Test 3: Check what columns exist
    console.log('\n--- Test 3: Query existing media ---');
    const { data: d3, error: e3 } = await supabase.from('media_assets').select('*').limit(1);
    if (e3) console.log('Query error:', e3.code, e3.message);
    else console.log('Query result:', d3);
}

testMediaInsert();
