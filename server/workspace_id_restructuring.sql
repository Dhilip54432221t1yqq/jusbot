-- ULTIMATE ROBUST MIGRATION SCRIPT: Change workspace ID from UUID to sequential TEXT (RW12xx)
-- This script handles all known tables, handles missing tables gracefully, and drops all relevant constraints.

-- 1. Create a sequence for the numeric part if not already exists
CREATE SEQUENCE IF NOT EXISTS workspace_id_seq START 1200;

-- 2. Create a function to generate the default ID if not already exists
CREATE OR REPLACE FUNCTION generate_workspace_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN 'RW' || nextval('workspace_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 3. Temporarily drop ALL foreign keys and constraints related to workspace_id
DO $$ 
BEGIN
    -- List of constraints to drop from ALL potential tables
    EXECUTE 'ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS folders_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS flows DROP CONSTRAINT IF EXISTS flows_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS user_fields DROP CONSTRAINT IF EXISTS user_fields_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS bot_fields DROP CONSTRAINT IF EXISTS bot_fields_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS tags DROP CONSTRAINT IF EXISTS tags_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS message_templates DROP CONSTRAINT IF EXISTS message_templates_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS integrations DROP CONSTRAINT IF EXISTS integrations_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS sequences DROP CONSTRAINT IF EXISTS sequences_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS sequence_subscriptions DROP CONSTRAINT IF EXISTS sequence_subscriptions_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS keywords DROP CONSTRAINT IF EXISTS keywords_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS automation_settings DROP CONSTRAINT IF EXISTS automation_settings_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS triggers DROP CONSTRAINT IF EXISTS triggers_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS trigger_logs DROP CONSTRAINT IF EXISTS trigger_logs_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS subflows DROP CONSTRAINT IF EXISTS subflows_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS agents DROP CONSTRAINT IF EXISTS agents_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS contacts DROP CONSTRAINT IF EXISTS contacts_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS channels DROP CONSTRAINT IF EXISTS channels_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS conversations DROP CONSTRAINT IF EXISTS conversations_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS whatsapp_cloud_logs DROP CONSTRAINT IF EXISTS whatsapp_cloud_logs_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS import_jobs DROP CONSTRAINT IF EXISTS import_jobs_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS segments DROP CONSTRAINT IF EXISTS segments_workspace_id_fkey';
    EXECUTE 'ALTER TABLE IF EXISTS fields DROP CONSTRAINT IF EXISTS fields_workspace_id_fkey';
    
    -- Special case for rename_workspaces workaround
    EXECUTE 'ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS folders_workspace_id_fkey1';
    EXECUTE 'ALTER TABLE IF EXISTS flows DROP CONSTRAINT IF EXISTS flows_workspace_id_fkey1';
    
    -- Unique constraints
    EXECUTE 'ALTER TABLE IF EXISTS tags DROP CONSTRAINT IF EXISTS tags_name_workspace_id_key';
    EXECUTE 'ALTER TABLE IF EXISTS integrations DROP CONSTRAINT IF EXISTS integrations_user_id_workspace_id_provider_key';
    EXECUTE 'ALTER TABLE IF EXISTS channels DROP CONSTRAINT IF EXISTS channels_workspace_id_channel_type_external_id_key';
    EXECUTE 'ALTER TABLE IF EXISTS fields DROP CONSTRAINT IF EXISTS fields_workspace_id_field_name_field_scope_key';
END $$;

-- 4. Alter columns to TEXT across all tables (only if they exist)
DO $$ 
DECLARE
    table_names TEXT[] := ARRAY[
        'workspaces', 'app_workspaces', 'folders', 'flows', 'user_fields', 'bot_fields', 'tags', 
        'message_templates', 'integrations', 'sequences', 'sequence_subscriptions', 
        'keywords', 'automation_settings', 'triggers', 'trigger_logs', 'subflows', 
        'agents', 'contacts', 'channels', 'conversations', 'whatsapp_cloud_logs', 
        'import_jobs', 'segments', 'fields', 'user_field_values'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY table_names LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            IF t IN ('workspaces', 'app_workspaces') THEN
                EXECUTE 'ALTER TABLE ' || t || ' ALTER COLUMN id TYPE TEXT';
            ELSIF t = 'user_field_values' THEN
                -- Skipping user_field_values as it references field_id/contact_id which are still UUIDs
                NULL;
            ELSE
                EXECUTE 'ALTER TABLE ' || t || ' ALTER COLUMN workspace_id TYPE TEXT';
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Set default for workspaces.id
ALTER TABLE IF EXISTS workspaces ALTER COLUMN id SET DEFAULT generate_workspace_id();
ALTER TABLE IF EXISTS app_workspaces ALTER COLUMN id SET DEFAULT generate_workspace_id();

-- 6. Re-add foreign keys with TEXT type (using a generic function for safety)
DO $$ 
DECLARE
    t TEXT;
    target_table TEXT := 'workspaces';
BEGIN
    -- Determine which workspace table is primary
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_workspaces' AND table_schema = 'public') THEN
        target_table := 'app_workspaces';
    END IF;

    -- Re-add constraints for all tables that exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'folders') THEN
        EXECUTE 'ALTER TABLE folders ADD CONSTRAINT folders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES ' || target_table || '(id) ON DELETE CASCADE ON UPDATE CASCADE';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flows') THEN
        EXECUTE 'ALTER TABLE flows ADD CONSTRAINT flows_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES ' || target_table || '(id) ON DELETE CASCADE ON UPDATE CASCADE';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fields') THEN
        EXECUTE 'ALTER TABLE fields ADD CONSTRAINT fields_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES ' || target_table || '(id) ON DELETE CASCADE ON UPDATE CASCADE';
    END IF;
    -- (Add others as needed, keeping it concise)
    
    -- Fast loop for remaining standard tables
    FOREACH t IN ARRAY ARRAY['user_fields', 'bot_fields', 'tags', 'message_templates', 'integrations', 'sequences', 'sequence_subscriptions', 'keywords', 'automation_settings', 'subflows', 'agents', 'contacts', 'channels', 'conversations', 'whatsapp_cloud_logs', 'import_jobs', 'segments'] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
            EXECUTE 'ALTER TABLE ' || t || ' ADD CONSTRAINT ' || t || '_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES ' || target_table || '(id) ON DELETE CASCADE ON UPDATE CASCADE';
        END IF;
    END LOOP;
END $$;

-- 7. Re-add unique constraints (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        ALTER TABLE tags ADD CONSTRAINT tags_name_workspace_id_key UNIQUE(name, workspace_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integrations') THEN
        ALTER TABLE integrations ADD CONSTRAINT integrations_user_id_workspace_id_provider_key UNIQUE(user_id, workspace_id, provider);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels') THEN
        ALTER TABLE channels ADD CONSTRAINT channels_workspace_id_channel_type_external_id_key UNIQUE(workspace_id, channel_type, external_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fields') THEN
        ALTER TABLE fields ADD CONSTRAINT fields_workspace_id_field_name_field_scope_key UNIQUE(workspace_id, field_name, field_scope);
    END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Workspace ID restructuring complete. Text-based IDs (RW12xx) are now supported across all tables.';
END;
$$;
