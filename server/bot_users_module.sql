-- Bot Users (Contacts) Module Migration

-- Rename contacts to users (Optional, but let's keep it as contacts for backward compatibility in the core, 
-- but add the requested columns and ensure it handles the 'users' logic.)
-- If we rename it, we must update all foreign key references in conversations, messages, etc.
-- For safety and stability, I will keep the table name 'contacts' but add the required columns.

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'subscribed'; -- 'subscribed', 'unsubscribed'

-- Add more channel ID columns for explicit mapping
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS facebook_user_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_user_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;

-- User Field Values (Normalized storage for custom fields)
CREATE TABLE IF NOT EXISTS user_field_values (
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (contact_id, field_id)
);

-- User Tags (Junction table for contacts and tags)
CREATE TABLE IF NOT EXISTS user_tags (
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);

-- Segments Table
CREATE TABLE IF NOT EXISTS segments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    conditions JSONB DEFAULT '[]', -- Array of conditions {field, operator, value}
    logical_operator TEXT DEFAULT 'AND', -- 'AND', 'OR'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Notes Table
CREATE TABLE IF NOT EXISTS contact_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and Grant Permissions (matching development style)
ALTER TABLE user_field_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE user_field_values TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE user_tags TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE segments TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE contact_notes TO postgres, service_role, anon, authenticated;
