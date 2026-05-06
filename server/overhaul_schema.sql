-- Omnichannel Flow Builder Overhaul Schema

-- 1. Enhanced Folders for Hierarchical Organization
ALTER TABLE folders ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES folders(id) ON DELETE CASCADE;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'flow' CHECK (type IN ('flow', 'subflow', 'global'));

-- 2. Labels with Colors
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, workspace_id)
);

-- 3. Enhanced Flows Table
ALTER TABLE flows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE flows ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS published_version INTEGER;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS label_ids UUID[] DEFAULT '{}';

-- 4. SubFlows Table
CREATE TABLE IF NOT EXISTS sub_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'workflow', 'function')),
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  label_ids UUID[] DEFAULT '{}',
  config_json JSONB DEFAULT '{"nodes": [], "edges": []}',
  version INTEGER DEFAULT 1,
  channel_compatibility TEXT[] DEFAULT '{"whatsapp", "instagram", "facebook", "web", "voice"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Variables Engine
CREATE TABLE IF NOT EXISTS variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE, -- Nullable if workspace scoped
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'date', 'datetime', 'json')),
  scope TEXT DEFAULT 'flow' CHECK (scope IN ('flow', 'workspace', 'session')),
  default_value_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, workspace_id, flow_id)
);

-- 6. Update Triggers to map to SubFlows
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS sub_flow_id UUID REFERENCES sub_flows(id) ON DELETE SET NULL;

-- 7. Flow Versions (for history)
CREATE TABLE IF NOT EXISTS flow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full dump of subflows and connections
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sub_flows_flow ON sub_flows(flow_id);
CREATE INDEX IF NOT EXISTS idx_variables_workspace ON variables(workspace_id);
CREATE INDEX IF NOT EXISTS idx_labels_workspace ON labels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_flow_versions_flow ON flow_versions(flow_id);

-- Enable RLS and permissions
ALTER TABLE labels DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_flows DISABLE ROW LEVEL SECURITY;
ALTER TABLE variables DISABLE ROW LEVEL SECURITY;
ALTER TABLE flow_versions DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
