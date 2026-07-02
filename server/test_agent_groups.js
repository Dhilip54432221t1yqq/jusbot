import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('agent_groups')
    .select(`
        *,
        agent_group_members (
            id, user_id, weighting, created_at,
            profiles:user_id (email, full_name, avatar_url)
        )
    `)
    .limit(1);
    
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

check();
