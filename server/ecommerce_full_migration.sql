-- Comprehensive Ecommerce Module Schema (Base + V2 Features)

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    compare_price DECIMAL(12,2) DEFAULT 0.00,
    sku TEXT,
    barcode TEXT,
    stock_quantity INTEGER DEFAULT 0,
    track_quantity BOOLEAN DEFAULT false,
    has_variants BOOLEAN DEFAULT false,
    image_url TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'out_of_stock'
    category TEXT,
    vendor TEXT,
    tags TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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

-- 3. Ecommerce Collections Table
CREATE TABLE IF NOT EXISTS ecommerce_collections (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    type TEXT DEFAULT 'manual', -- 'manual', 'auto'
    match_type TEXT DEFAULT 'all', -- 'all', 'any'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ecommerce Collection Conditions Table
CREATE TABLE IF NOT EXISTS ecommerce_collection_conditions (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES ecommerce_collections(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    operator TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ecommerce Discounts Table
CREATE TABLE IF NOT EXISTS ecommerce_discounts (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
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

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded', 'failed'
    payment_method TEXT,
    shipping_address JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Cart Table
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contact_id, workspace_id)
);

-- 9. Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- Disable RLS for Development
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_collection_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON TABLE products TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE product_variants TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_collections TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_collection_conditions TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_discounts TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE orders TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE order_items TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE carts TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE cart_items TO postgres, service_role, anon, authenticated;

-- 10. Ecommerce Tags Table
CREATE TABLE IF NOT EXISTS ecommerce_tags (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Ecommerce Vendors Table
CREATE TABLE IF NOT EXISTS ecommerce_vendors (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Ecommerce Types Table
CREATE TABLE IF NOT EXISTS ecommerce_types (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ecommerce_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_types DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE ecommerce_tags TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_vendors TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_types TO postgres, service_role, anon, authenticated;
