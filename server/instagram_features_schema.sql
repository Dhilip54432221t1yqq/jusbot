-- Instagram Features Schema

-- Instagram Accounts Table
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  ig_user_id TEXT NOT NULL UNIQUE,
  username TEXT,
  full_name TEXT,
  profile_picture_url TEXT,
  followers_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instagram Tokens Table
CREATE TABLE IF NOT EXISTS instagram_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ig_user_id TEXT REFERENCES instagram_accounts(ig_user_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'long-lived',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ig_user_id)
);

-- Instagram Media Table
CREATE TABLE IF NOT EXISTS instagram_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ig_user_id TEXT REFERENCES instagram_accounts(ig_user_id) ON DELETE CASCADE,
  media_id TEXT NOT NULL UNIQUE,
  media_type TEXT, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url TEXT,
  permalink TEXT,
  caption TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  like_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instagram Comments Table
CREATE TABLE IF NOT EXISTS instagram_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ig_user_id TEXT REFERENCES instagram_accounts(ig_user_id) ON DELETE CASCADE,
  media_id TEXT REFERENCES instagram_media(media_id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL UNIQUE,
  text TEXT,
  username TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instagram Automations Table
CREATE TABLE IF NOT EXISTS instagram_automations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  ig_user_id TEXT REFERENCES instagram_accounts(ig_user_id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'comment_keyword', 'mention', 'direct_message'
  keyword TEXT,
  response_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instagram Logs Table
CREATE TABLE IF NOT EXISTS instagram_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for and Grant Permissions (Development mode)
ALTER TABLE instagram_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_automations DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_logs DISABLE ROW LEVEL SECURITY;

GRANT ALL ON instagram_accounts TO postgres, service_role, anon, authenticated;
GRANT ALL ON instagram_tokens TO postgres, service_role, anon, authenticated;
GRANT ALL ON instagram_media TO postgres, service_role, anon, authenticated;
GRANT ALL ON instagram_comments TO postgres, service_role, anon, authenticated;
GRANT ALL ON instagram_automations TO postgres, service_role, anon, authenticated;
GRANT ALL ON instagram_logs TO postgres, service_role, anon, authenticated;
