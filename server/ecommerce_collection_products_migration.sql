-- Create ecommerce_collection_products junction table
CREATE TABLE IF NOT EXISTS ecommerce_collection_products (
    collection_id TEXT REFERENCES ecommerce_collections(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (collection_id, product_id)
);

-- Disable RLS
ALTER TABLE ecommerce_collection_products DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE ecommerce_collection_products TO postgres, service_role, anon, authenticated;
