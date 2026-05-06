-- Import Jobs Table

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    filename TEXT,
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE import_jobs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE import_jobs TO postgres, service_role, anon, authenticated;
