-- WhatsApp Flows Tables

CREATE TABLE IF NOT EXISTS whatsapp_flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    flow_type TEXT DEFAULT 'STATIC',
    flow_json_version TEXT DEFAULT '3.1',
    data_api_version TEXT,
    endpoint_url TEXT,
    flow_json JSONB,
    status TEXT DEFAULT 'DRAFT',
    meta_flow_id TEXT,
    meta_response_payload JSONB,
    validation_errors JSONB,
    endpoint_enabled BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    deprecated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS whatsapp_flow_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
    meta_flow_id TEXT,
    contact_id TEXT,
    phone_number TEXT,
    flow_token TEXT,
    response_payload JSONB,
    raw_webhook_payload JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_flow_endpoint_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
    action TEXT,
    request_payload JSONB,
    response_payload JSONB,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Flow relationship mapping
CREATE TABLE IF NOT EXISTS whatsapp_template_flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES message_templates(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
    button_text TEXT,
    flow_token_strategy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE whatsapp_flows DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flow_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flow_endpoint_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_template_flows DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE whatsapp_flows TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_flow_responses TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_flow_endpoint_logs TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE whatsapp_template_flows TO postgres, service_role, anon, authenticated;
