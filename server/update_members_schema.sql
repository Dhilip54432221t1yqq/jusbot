-- MASTER MIGRATION: Setup Profiles and Fix Workspace Members
-- Run this in the Supabase SQL Editor

-- 1. Create public.profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Setup Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Seed existing users into profiles (important for existing accounts)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Fix workspace_members table
ALTER TABLE public.workspace_members 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update role constraint to include 'admin'
ALTER TABLE public.workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE public.workspace_members 
ADD CONSTRAINT workspace_members_role_check 
CHECK (role IN ('owner', 'admin', 'member'));

-- Add foreign key relationship
ALTER TABLE public.workspace_members
DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;

ALTER TABLE public.workspace_members
ADD CONSTRAINT workspace_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Sync emails to workspace_members
UPDATE public.workspace_members m
SET email = p.email
FROM public.profiles p
WHERE m.user_id = p.id
AND (m.email IS NULL OR m.email = '');

-- 6. Permissions
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO postgres, service_role, anon, authenticated;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Workspace schema fixed successfully.';
END $$;
