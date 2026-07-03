-- WhatsApp Catalog Commerce Tables

CREATE TABLE IF NOT EXISTS whatsapp_catalog_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id TEXT,
    phone_number_id TEXT,
    catalog_id TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    catalog_visible BOOLEAN DEFAULT TRUE,
    cart_enabled BOOLEAN DEFAULT TRUE,
    product_questions_enabled BOOLEAN DEFAULT TRUE,
    auto_create_orders BOOLEAN DEFAULT TRUE,
    auto_reserve_stock BOOLEAN DEFAULT TRUE,
    default_order_status TEXT DEFAULT 'pending',
    sync_frequency TEXT DEFAULT 'manual',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In a real environment, internal_product_id references existing ecommerce 'products' table.
-- Since this is an extension, we assume an existing 'products' and 'orders' system.
CREATE TABLE IF NOT EXISTS whatsapp_catalog_product_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    internal_product_id UUID, -- References internal ecommerce products table
    internal_variant_id UUID,
    catalog_id TEXT,
    meta_catalog_item_id TEXT,
    product_retailer_id TEXT,
    sync_status TEXT DEFAULT 'not_synced',
    availability TEXT DEFAULT 'in stock',
    rejection_reason TEXT,
    last_sync_payload JSONB,
    last_sync_response JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_catalog_message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id TEXT,
    conversation_id TEXT,
    message_id TEXT,
    message_type TEXT,
    catalog_id TEXT,
    product_ids_json JSONB,
    payload_json JSONB,
    response_json JSONB,
    status TEXT,
    error_code TEXT,
    error_message TEXT,
    sent_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_catalog_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    ecommerce_order_id UUID, -- References internal ecommerce orders table
    contact_id TEXT,
    conversation_id TEXT,
    phone_number TEXT,
    catalog_id TEXT,
    whatsapp_order_id TEXT,
    items_json JSONB,
    raw_webhook_payload JSONB,
    subtotal NUMERIC,
    currency TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_product_inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id TEXT,
    conversation_id TEXT,
    internal_product_id UUID,
    meta_catalog_item_id TEXT,
    product_retailer_id TEXT,
    message_text TEXT,
    raw_webhook_payload JSONB,
    assigned_to UUID,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_catalog_sync_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    internal_product_id UUID,
    action TEXT,
    status TEXT,
    request_payload JSONB,
    response_payload JSONB,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE whatsapp_catalog_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_catalog_product_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_catalog_message_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_catalog_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_product_inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_catalog_sync_logs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE whatsapp_catalog_settings TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_catalog_product_mappings TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_catalog_message_logs TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_catalog_orders TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_product_inquiries TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_catalog_sync_logs TO postgres, service_role, anon, authenticated;
