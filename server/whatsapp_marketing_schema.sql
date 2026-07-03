-- WhatsApp Marketing Tables

CREATE TABLE IF NOT EXISTS whatsapp_marketing_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id TEXT,
    phone_number_id TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    default_product_policy TEXT DEFAULT 'CLOUD_API_FALLBACK',
    default_message_activity_sharing TEXT DEFAULT 'default',
    disable_marketing_messages_on_cloud_api BOOLEAN DEFAULT FALSE,
    onboarding_status TEXT DEFAULT 'pending',
    prerequisites_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    flow_id UUID REFERENCES whatsapp_flows(id) ON DELETE SET NULL,
    audience_segment_id UUID,
    status TEXT DEFAULT 'Draft',
    product_policy TEXT DEFAULT 'CLOUD_API_FALLBACK',
    message_activity_sharing TEXT DEFAULT 'default',
    variable_mapping_json JSONB,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_marketing_message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES whatsapp_marketing_campaigns(id) ON DELETE CASCADE,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    contact_id TEXT,
    phone_number TEXT,
    bsuid TEXT,
    meta_message_id TEXT,
    request_payload JSONB,
    response_payload JSONB,
    status TEXT DEFAULT 'queued',
    sent_via TEXT,
    product_policy TEXT,
    message_activity_sharing TEXT,
    pricing_category TEXT,
    conversation_origin_type TEXT,
    error_code TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_creative_optimization_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    scope TEXT DEFAULT 'WABA', -- 'WABA' or 'TEMPLATE'
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE CASCADE,
    waba_id TEXT,
    creative_features_spec_json JSONB,
    raw_meta_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & Grants
ALTER TABLE whatsapp_marketing_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_marketing_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_marketing_message_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_creative_optimization_settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE whatsapp_marketing_settings TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_marketing_campaigns TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_marketing_message_logs TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_creative_optimization_settings TO postgres, service_role, anon, authenticated;
