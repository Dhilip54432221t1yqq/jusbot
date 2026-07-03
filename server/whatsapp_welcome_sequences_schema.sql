-- WhatsApp Ads / Welcome Message Sequences Tables

CREATE TABLE IF NOT EXISTS whatsapp_welcome_sequences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id TEXT NOT NULL,
    sequence_id TEXT NOT NULL, -- Returned by Meta
    name TEXT NOT NULL,
    welcome_message_sequence_json JSONB NOT NULL,
    is_used_in_ad BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE whatsapp_welcome_sequences DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE whatsapp_welcome_sequences TO postgres, service_role, anon, authenticated;
