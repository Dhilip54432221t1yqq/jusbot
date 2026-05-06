-- Sequences Table
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active'|'inactive'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence Messages
CREATE TABLE IF NOT EXISTS sequence_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  delay_value INTEGER DEFAULT 0,
  delay_unit TEXT DEFAULT 'minutes', -- 'minutes'|'hours'|'days'
  send_anytime BOOLEAN DEFAULT true,
  time_start TIME,
  time_end TIME,
  days JSONB DEFAULT '[0,1,2,3,4,5,6]', -- 0=Sunday, 1=Monday...
  content_type TEXT DEFAULT 'default', 
  notification_type TEXT DEFAULT 'regular',
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence Subscriptions
CREATE TABLE IF NOT EXISTS sequence_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active'|'completed'|'unsubscribed'
  next_message_index INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ, -- Exact time to fire next message
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, sequence_id)
);

-- Ensure index for fast worker lookups
CREATE INDEX IF NOT EXISTS idx_seq_subscriptions_scheduled ON sequence_subscriptions(scheduled_at, status) WHERE status = 'active';
