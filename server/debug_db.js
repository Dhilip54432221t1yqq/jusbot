import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, './.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- Workspaces ---');
    const { data: ws, error: wsErr } = await supabase.from('workspaces').select('*');
    if (wsErr) console.error('Workspaces Error:', wsErr);
    else ws.forEach(w => console.log(`ID: ${w.id}, Name: ${w.name}, UserID: ${w.user_id}`));

    console.log('\n--- Workspace Members ---');
    const { data: mem, error: memErr } = await supabase.from('workspace_members').select('*');
    if (memErr) console.error('Members Error:', memErr);
    else mem.forEach(m => console.log(`ID: ${m.id}, WS_ID: ${m.workspace_id}, User_ID: ${m.user_id}, Role: ${m.role}`));
}

check();
