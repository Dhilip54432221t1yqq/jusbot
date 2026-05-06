-- Keyword Automation Table
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL, -- 'is', 'contains', 'starts_with'
  keywords TEXT NOT NULL, -- comma-separated string, no spaces between commas
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active'|'inactive'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automation Settings (Default Reply, etc.)
CREATE TABLE IF NOT EXISTS automation_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  default_reply_enabled BOOLEAN DEFAULT false,
  default_reply_flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
  default_reply_frequency TEXT DEFAULT 'every_time', -- 'every_time', 'once_per_session', 'custom'
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure index for fast workspace lookups
CREATE INDEX IF NOT EXISTS idx_keywords_workspace ON keywords(workspace_id);
