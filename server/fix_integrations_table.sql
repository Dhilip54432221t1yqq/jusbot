-- STANDALONE FIX: Run this in your Supabase SQL Editor
-- This renames the expiry column and adds a unique constraint.

DO $$ 
BEGIN 
    -- 1. Rename column if it exists with the old name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='integrations' AND column_name='token_expiry') THEN
        ALTER TABLE public.integrations RENAME COLUMN token_expiry TO expires_at;
    END IF;

    -- 2. Change type to BIGINT if it's not already (for JS timestamps compatibility)
    ALTER TABLE public.integrations ALTER COLUMN expires_at TYPE BIGINT USING EXTRACT(EPOCH FROM expires_at)::bigint * 1000;

    -- 3. Add UNIQUE constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='integrations' AND constraint_name='integrations_user_workspace_provider_key') THEN
        ALTER TABLE public.integrations ADD CONSTRAINT integrations_user_workspace_provider_key UNIQUE (user_id, workspace_id, provider);
    END IF;
END $$;

-- 4. Reload PostgREST cache
COMMENT ON TABLE public.integrations IS 'Table for storing third-party OAuth integrations';

-- 5. Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'integrations';
