import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runMigration() {
    console.log('--- Database Migration ---');
    const sqlPath = path.resolve(__dirname, 'live_chat_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase JS client doesn't support running raw SQL directly via .rpc() easily without a helper function.
    // However, we can try to create the tables one by one or use an RPC if available.
    // Since I can't easily run arbitrary SQL, I'll check if the tables exist first.
    
    const tables = ['agents', 'contacts', 'channels', 'conversations', 'messages', 'conversation_tags'];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.log(`Table [${table}] does NOT exist or error: ${error.message}`);
        } else {
            console.log(`Table [${table}] OK`);
        }
    }
    
    console.log('\nIMPORTANT: If tables do not exist, please run the SQL in live_chat_schema.sql in the Supabase SQL Editor.');
}

runMigration();
