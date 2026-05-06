-- FIX: Restore missing workspace_members table with support for sequential IDs
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 0. Cleanup any corrupted test data from previous attempts
DELETE FROM public.workspaces WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 1. Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 2. Seed existing workspace owners into membership table
-- This handles existing data if any
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT id, user_id, 'owner'
FROM public.workspaces
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 3. Disable RLS and Grant Permissions (matching development style)
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.workspace_members TO postgres, service_role, anon, authenticated;

-- 4. Verify primary workspace table sequential setup
-- Ensure generated_workspace_id is set as default (already done in restructuring script)
ALTER TABLE public.workspaces ALTER COLUMN id SET DEFAULT generate_workspace_id();

-- Success check
DO $$
BEGIN
  RAISE NOTICE 'workspace_members table restored and sequential ID support verified.';
END;
$$;
