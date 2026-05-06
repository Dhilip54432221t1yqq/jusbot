-- WhatsApp Cloud Channel Schema Setup

-- 1. Create WhatsApp Cloud Logs Table
CREATE TABLE IF NOT EXISTS whatsapp_cloud_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'webhook', 'api', 'error'
    status TEXT NOT NULL, -- 'success', 'failed'
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}', -- Store full JSON payload for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (disabled for development consistency with other tables)
ALTER TABLE whatsapp_cloud_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE whatsapp_cloud_logs TO postgres, service_role, anon, authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_workspace_id ON whatsapp_cloud_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_channel_id ON whatsapp_cloud_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_cloud_logs(created_at DESC);

-- Note: The `channels` table already has a `credentials` JSONB column which is suitable 
-- for storing Phone Number ID, WABA ID, Access Token, and Verify Token.
--
-- Example credentials JSON structure for WhatsApp Cloud:
-- {
--   "phone_number_id": "1234567890",
--   "waba_id": "0987654321",
--   "access_token": "EAA...",
--   "verify_token": "my_secure_token_123",
--   "api_version": "v23.0"
-- }
