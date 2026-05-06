-- Ecommerce Settings Table
CREATE TABLE IF NOT EXISTS ecommerce_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Store Details
    store_name VARCHAR(100) DEFAULT '',
    store_email VARCHAR(500) DEFAULT '',
    store_phone VARCHAR(100) DEFAULT '',
    store_industry VARCHAR(100) DEFAULT 'Services',
    
    -- Store Address
    biz_name VARCHAR(100) DEFAULT '',
    address TEXT DEFAULT '',
    country VARCHAR(100) DEFAULT 'India',
    
    -- Shipping Method
    pickup_checked BOOLEAN DEFAULT false,
    delivery_checked BOOLEAN DEFAULT false,
    delivery_area VARCHAR(50) DEFAULT 'all',
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    postcode_input VARCHAR(50) DEFAULT '',
    
    -- Payment Method
    payment_tags JSONB DEFAULT '[]'::jsonb,
    currency VARCHAR(50) DEFAULT 'INR - Indian Rupee',
    bank_info TEXT DEFAULT '',
    tax_percent INTEGER DEFAULT 0,
    
    -- Formats
    order_prefix VARCHAR(20) DEFAULT '',
    order_suffix VARCHAR(20) DEFAULT '',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workspace_id)
);

-- Ecommerce Tags Table
CREATE TABLE IF NOT EXISTS ecommerce_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ecommerce Vendors Table
CREATE TABLE IF NOT EXISTS ecommerce_vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ecommerce Types Table
CREATE TABLE IF NOT EXISTS ecommerce_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for Development (or set up proper policies later)
ALTER TABLE ecommerce_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_types DISABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON TABLE ecommerce_settings TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_tags TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_vendors TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE ecommerce_types TO postgres, service_role, anon, authenticated;
