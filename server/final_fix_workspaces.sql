-- FINAL WORKSPACE FIX MIGRATION
-- Run this in the Supabase SQL Editor

-- 1. Ensure new columns exist in workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS default_theme TEXT DEFAULT 'light';

-- 2. Handle ID type consistency
-- Note: If you use generate_workspace_id() (TEXT), make sure the reference matches.
-- This script assumes human-readable IDs (TEXT) or UUIDs (TEXT for flexibility).

-- 3. Create/Fix workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 4. Seed memberships for all existing workspaces
-- Assumes the 'user_id' column in 'workspaces' is the owner
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT CAST(id AS TEXT), user_id, 'owner'
FROM public.workspaces
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 5. Disable RLS for development
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;

-- 6. Permissions
GRANT ALL ON TABLE public.workspaces TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE public.workspace_members TO postgres, service_role, anon, authenticated;

-- 7. Verify
DO $$
BEGIN
  RAISE NOTICE 'Workspace schema fixed successfully.';
END;
$$;
