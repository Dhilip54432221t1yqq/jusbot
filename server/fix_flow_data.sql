-- STANDALONE FIX: Run this in your Supabase SQL Editor
-- This adds the missing 'flow_data' column and refreshes the schema cache.

-- 1. Add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flows' AND column_name='flow_data') THEN
        ALTER TABLE public.flows ADD COLUMN flow_data JSONB;
    END IF;
END $$;

-- 2. Force PostgREST to reload the schema cache
-- By changing a comment, we trigger a cache refresh
COMMENT ON TABLE public.flows IS 'Flows table with multi-action support';

-- 3. Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'flows' AND column_name = 'flow_data';
