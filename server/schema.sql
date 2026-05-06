
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Reflx',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folders Table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flows Table
CREATE TABLE IF NOT EXISTS flows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  nodes INTEGER DEFAULT 1,
  flow_data JSONB,
  preview TEXT DEFAULT 'main',
  workspace_name TEXT DEFAULT 'Reflx',
  tag TEXT,
  tag_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Fields Table
CREATE TABLE IF NOT EXISTS user_fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Text', 'Number', 'Boolean', 'Date', 'Datetime', 'JSON'
  description TEXT,
  folder TEXT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot Fields Table
CREATE TABLE IF NOT EXISTS bot_fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Text', 'Number', 'Boolean', 'Date', 'Datetime', 'JSON'
  value TEXT, -- Stored as text, parsed based on type
  description TEXT,
  folder TEXT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, workspace_id)
);

-- Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  language TEXT NOT NULL DEFAULT 'en',
  header_type TEXT, -- 'None', 'Text', 'Image', 'Video', 'Document'
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB, -- Array of button objects
  status TEXT DEFAULT 'PENDING', -- 'APPROVED', 'REJECTED', 'PENDING'
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations Table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google_sheets', 'razorpay', etc.
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT, -- Using BIGINT for JS timestamps
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, provider)
);

-- Disable RLS for all tables to allow access (Development mode)
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE flows DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE bot_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;

-- Grant permissions (Development mode)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, anon, authenticated;
