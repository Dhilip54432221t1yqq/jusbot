import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', process.env.VITE_SUPABASE_URL);

    try {
        const { data, error } = await supabase.from('workspaces').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Error querying workspaces:', error);
        } else {
            console.log('Workspaces table exists. Count:', data);
        }

        const { data: tables, error: tablesError } = await supabase.rpc('get_tables'); // Won't work without custom RPC
        if (tablesError) {
            console.log('get_tables RPC failed (expected if not defined)');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();
