import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sql = fs.readFileSync('whatsapp_templates_schema.sql', 'utf8');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    console.log("Error:", error);
    console.log("Data:", data);
}

run();
