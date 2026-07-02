import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Using URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY not set in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.from('workspaces').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase query error:', error);
    } else {
      console.log('Successfully connected! Workspace head/count data:', data);
    }
  } catch (err) {
    console.error('Fetch/network error:', err);
  }
}

run();
