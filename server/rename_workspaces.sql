-- DANGEROUS: Renaming workspaces to app_workspaces to bypass cache error PGRST205.

-- 1. Drop EVERYTHING to start clean
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS flows CASCADE;
DROP TABLE IF EXISTS user_fields CASCADE;
DROP TABLE IF EXISTS bot_fields CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS app_workspaces CASCADE;

-- 2. Recreate Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Recreate app_workspaces Table
CREATE TABLE public.app_workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Reflx',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recreate Folders Table
CREATE TABLE public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recreate other tables
CREATE TABLE public.flows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  nodes INTEGER DEFAULT 1,
  flow_data JSONB,
  preview TEXT DEFAULT 'main',
  workspace_name TEXT DEFAULT 'Reflx',
  tag TEXT,
  tag_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  folder TEXT,
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.bot_fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT,
  description TEXT,
  folder TEXT,
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, workspace_id)
);

CREATE TABLE public.message_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  header_type TEXT,
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB,
  status TEXT DEFAULT 'PENDING',
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, provider)
);

-- 6. Disable RLS
ALTER TABLE public.app_workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations DISABLE ROW LEVEL SECURITY;

-- 7. Grant ALL permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- 8. Refresh PostgREST cache
COMMENT ON TABLE public.app_workspaces IS 'New workspace table';
