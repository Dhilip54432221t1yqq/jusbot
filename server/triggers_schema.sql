-- Triggers System Schema
-- Run this in your Supabase SQL Editor

-- Main triggers table
CREATE TABLE IF NOT EXISTS triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  -- event types: 'custom', 'whatsapp_incoming', 'instagram_incoming', 'facebook_incoming',
  -- 'tag_added', 'tag_removed', 'field_changed', 'webhook', 'form_submitted', 'payment_success'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  flow_id UUID,
  condition_json JSONB DEFAULT '{}',
  data_mapping JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger execution logs
CREATE TABLE IF NOT EXISTS trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES triggers(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed')),
  payload JSONB DEFAULT '{}',
  error TEXT,
  fired_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_triggers_workspace ON triggers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_triggers_event_type ON triggers(workspace_id, event_type);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_trigger ON trigger_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_workspace ON trigger_logs(workspace_id);
