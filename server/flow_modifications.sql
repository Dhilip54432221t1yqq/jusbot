-- Migration: Advanced Flow Builder Structure

-- Add versioning and status to flows table
ALTER TABLE flows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'; -- 'draft', 'published'
ALTER TABLE flows ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Subflows Table
CREATE TABLE IF NOT EXISTS subflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flow Nodes Table
CREATE TABLE IF NOT EXISTS flow_nodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  node_id TEXT NOT NULL, -- The ID from ReactFlow (e.g., 'message-123')
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  subflow_id UUID REFERENCES subflows(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL, -- 'message', 'question', 'condition', 'action', etc.
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  config_json JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(flow_id, node_id, version)
);

-- Node Connections Table (Edges)
CREATE TABLE IF NOT EXISTS node_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_node_id TEXT NOT NULL,
  target_handle TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(flow_id, source_node_id, source_handle, target_node_id, target_handle, version)
);

-- Disable RLS for new tables
ALTER TABLE subflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE node_connections DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE subflows TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE flow_nodes TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE node_connections TO postgres, service_role, anon, authenticated;
