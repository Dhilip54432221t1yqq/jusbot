-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en_US',
    parameter_format TEXT DEFAULT 'named',
    components JSONB,
    status TEXT DEFAULT 'Draft',
    quality_rating TEXT,
    meta_template_id TEXT,
    rejection_reason TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE whatsapp_templates DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE whatsapp_templates TO postgres, service_role, anon, authenticated;
