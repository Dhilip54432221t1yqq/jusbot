import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Update products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS compare_price DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS track_quantity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT,
ADD COLUMN IF NOT EXISTS note TEXT;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_name1 TEXT,
    option_value1 TEXT,
    option_name2 TEXT,
    option_value2 TEXT,
    price DECIMAL(12,2) DEFAULT 0.00,
    quantity INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ecommerce_collections table
CREATE TABLE IF NOT EXISTS ecommerce_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    type TEXT DEFAULT 'manual', -- 'manual', 'auto'
    match_type TEXT DEFAULT 'all', -- 'all', 'any'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ecommerce_collection_conditions table
CREATE TABLE IF NOT EXISTS ecommerce_collection_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES ecommerce_collections(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    operator TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ecommerce_discounts table
CREATE TABLE IF NOT EXISTS ecommerce_discounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed', 'shipping'
    percentage DECIMAL(5,2),
    fixed_amount DECIMAL(12,2),
    applies_to TEXT DEFAULT 'entire', -- 'entire', 'collections', 'products'
    min_req TEXT DEFAULT 'none', -- 'none', 'amount', 'qty'
    min_amount DECIMAL(12,2),
    min_qty INTEGER,
    total_limit BOOLEAN DEFAULT false,
    total_limit_val INTEGER,
    per_customer BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_collection_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_discounts DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE product_variants TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_collections TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_collection_conditions TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_discounts TO postgres, service_role, anon, authenticated;
`;

async function runMigration() {
    try {
        console.log('Running migration...');
        // Execute SQL via an RPC or query if possible, or just raw query via pg
        // However, Supabase JS client doesn't directly run raw SQL unless there is an RPC.
        // Let's try to use rest API via fetch
        
        const response = await fetch(\`\${supabaseUrl}/rest/v1/\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${supabaseKey}\`,
                'apikey': supabaseKey,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: sql })
        });
        
        if (!response.ok) {
            console.log("Direct SQL via REST not supported, using pg library if possible, or requiring manual execution.");
            console.log("Please run this SQL in your Supabase SQL editor:");
            console.log(sql);
        } else {
            console.log("Migration successful!");
        }
    } catch (err) {
        console.error("Migration failed", err);
    }
}

runMigration();
