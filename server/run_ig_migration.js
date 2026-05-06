import { supabase } from './src/utils/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('--- Attempting to run Instagram Features Schema Migration ---');
    const sqlPath = path.resolve(__dirname, 'instagram_features_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        // Many Supabase setups have an 'exec_sql' RPC for migrations
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.error('Migration failed via exec_sql:', error.message);
            console.log('\nPlease run the SQL in instagram_features_schema.sql manually in the Supabase SQL Editor.');
        } else {
            console.log('Migration SUCCESSFUL:', data);
        }
    } catch (err) {
        console.error('Unexpected crash during migration:', err);
    }
}

runMigration();
