-- WhatsApp Payments (India) Configuration Table

CREATE TABLE IF NOT EXISTS whatsapp_payments_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    payment_mode TEXT DEFAULT 'gateway', -- 'gateway' or 'upi'
    pg_provider TEXT DEFAULT 'razorpay',
    pg_merchant_id TEXT,
    pg_api_key TEXT,
    pg_secret TEXT,
    upi_vpa TEXT,
    upi_mcc TEXT,
    upi_pc TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (workspace_id)
);

ALTER TABLE whatsapp_payments_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE whatsapp_payments_settings TO postgres, service_role, anon, authenticated;
