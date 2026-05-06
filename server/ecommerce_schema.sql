-- Ecommerce Module Schema

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'out_of_stock'
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
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

-- Order Items Table (Junction table for orders and products)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Table (For managing active shopping sessions)
CREATE TABLE IF NOT EXISTS carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contact_id, workspace_id)
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- Disable RLS for Development
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON TABLE products TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE orders TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE order_items TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE carts TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE cart_items TO postgres, service_role, anon, authenticated;
