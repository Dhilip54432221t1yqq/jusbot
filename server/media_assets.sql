-- Migration: Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
  url TEXT NOT NULL,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE media_assets DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE media_assets TO postgres, service_role, anon, authenticated;
