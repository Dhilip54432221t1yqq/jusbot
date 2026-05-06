import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createMediaTable() {
    console.log('Creating media_assets table via Supabase RPC...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
            CREATE TABLE IF NOT EXISTS media_assets (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
                url TEXT NOT NULL,
                size TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE media_assets DISABLE ROW LEVEL SECURITY;
            GRANT ALL ON TABLE media_assets TO postgres, service_role, anon, authenticated;
        `
    });
    
    if (error) {
        console.log('RPC approach failed (expected if exec_sql does not exist):', error.message);
        console.log('\n⚠️  You need to run this SQL in the Supabase Dashboard > SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
    url TEXT NOT NULL,
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE media_assets DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE media_assets TO postgres, service_role, anon, authenticated;
        `);
    } else {
        console.log('Table created successfully!', data);
    }
}

createMediaTable();
