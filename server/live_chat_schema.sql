
-- Agents Table (Mapping auth users to names/availablity if needed)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'online', -- 'online', 'offline', 'busy'
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  instagram_user_id TEXT,
  avatar_url TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels Table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'website', 'telegram'
  channel_name TEXT,
  external_id TEXT, -- e.g., WhatsApp Business ID or FB Page ID
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, channel_type, external_id)
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  assigned_agent_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open', -- 'open', 'pending', 'resolved', 'waiting_for_agent'
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user', 'bot', 'agent'
  sender_id UUID, -- References contact.id, bot.id (from flows), or agent.id
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'template', 'note'
  content TEXT,
  attachments JSONB DEFAULT '[]', -- Array of {url, type, name}
  metadata JSONB DEFAULT '{}', -- Quick replies, templates, etc.
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Tags Junction Table
CREATE TABLE IF NOT EXISTS conversation_tags (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, tag_id)
);

-- Enable RLS for these tables (though the project seems to disable it in development)
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE agents TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE contacts TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE channels TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE conversations TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE messages TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE conversation_tags TO postgres, service_role, anon, authenticated;
