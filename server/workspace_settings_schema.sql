-- Advanced Workspace Settings and Multi-tenancy Schema

-- 1. Update workspaces table with new settings columns
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS default_theme TEXT DEFAULT 'light';

-- 2. Create workspace_members table for roles
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Seed existing owners into workspace_members
-- We assume the user_id currently in the workspaces table is the owner
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT id, user_id, 'owner'
FROM workspaces
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 4. Disable RLS and Grant Permissions (matching development style)
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE workspace_members TO postgres, service_role, anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Workspace settings and membership schema applied successfully.';
END;
$$;
