-- Migration: Unified Variable Management System

-- Create unified fields table
CREATE TABLE IF NOT EXISTS fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_scope TEXT NOT NULL CHECK (field_scope IN ('user', 'bot', 'system')),
  variable_type TEXT NOT NULL CHECK (variable_type IN ('Text', 'Number', 'Boolean', 'Date', 'DateTime', 'JSON')),
  default_value TEXT, -- Default value for bot fields
  description TEXT,
  folder TEXT DEFAULT 'General',
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, field_name, field_scope)
);

-- Seed System Fields for all existing workspaces
DO $$
DECLARE
    w_id UUID;
BEGIN
    FOR w_id IN SELECT id FROM workspaces LOOP
        -- User System Fields
        INSERT INTO fields (workspace_id, field_name, field_scope, variable_type, description, is_editable)
        VALUES 
            (w_id, 'User Id', 'system', 'Text', 'Unique identifier for the user', false),
            (w_id, 'First Name', 'system', 'Text', 'Users first name', true),
            (w_id, 'Last Name', 'system', 'Text', 'Users last name', true),
            (w_id, 'Full Name', 'system', 'Text', 'Users display name', true),
            (w_id, 'Email', 'system', 'Text', 'Users email address', true),
            (w_id, 'Phone', 'system', 'Text', 'Users phone number', true),
            (w_id, 'Last Interaction', 'system', 'DateTime', 'When the user last messaged', false),
            (w_id, 'Subscribed', 'system', 'Boolean', 'Whether user is subscribed to bot', false),
            (w_id, 'Language', 'system', 'Text', 'Users preferred language', true),
            (w_id, 'Timezone', 'system', 'Text', 'Users detected timezone', false),
            (w_id, 'Profile Image', 'system', 'Text', 'URL to user avatar', false),
            (w_id, 'Flow Id', 'system', 'Text', 'Current flow user is in', false),
            (w_id, 'Subflow Id', 'system', 'Text', 'Current subflow user is in', false)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Migrate existing user_fields if any
INSERT INTO fields (workspace_id, field_name, field_scope, variable_type, description, created_at)
SELECT workspace_id, name, 'user', type, description, created_at FROM user_fields
ON CONFLICT DO NOTHING;

-- Migrate existing bot_fields if any
INSERT INTO fields (workspace_id, field_name, field_scope, variable_type, default_value, description, created_at)
SELECT workspace_id, name, 'bot', type, value, description, created_at FROM bot_fields
ON CONFLICT DO NOTHING;

-- Disable RLS
ALTER TABLE fields DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE fields TO postgres, service_role, anon, authenticated;
