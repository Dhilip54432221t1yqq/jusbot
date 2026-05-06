-- Merge Contacts RPC Function

CREATE OR REPLACE FUNCTION merge_contacts(
    p_workspace_id UUID,
    p_primary_id UUID,
    p_secondary_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_latest_interaction TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Verify both contacts belong to the same workspace
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_primary_id AND workspace_id = p_workspace_id) OR
       NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_secondary_id AND workspace_id = p_workspace_id) THEN
        RAISE EXCEPTION 'One or both contacts not found in the specified workspace';
    END IF;

    -- 2. Determine latest interaction
    SELECT GREATEST(c1.last_interaction, c2.last_interaction)
    INTO v_latest_interaction
    FROM contacts c1, contacts c2
    WHERE c1.id = p_primary_id AND c2.id = p_secondary_id;

    -- 3. Merge Tags (Duplicate tags will fail gracefully or we can use ON CONFLICT)
    INSERT INTO user_tags (contact_id, tag_id)
    SELECT p_primary_id, tag_id
    FROM user_tags
    WHERE contact_id = p_secondary_id
    ON CONFLICT (contact_id, tag_id) DO NOTHING;

    -- 4. Merge Field Values
    -- We keep primary values if they exist, otherwise take secondary
    INSERT INTO user_field_values (contact_id, field_id, value, updated_at)
    SELECT p_primary_id, field_id, value, updated_at
    FROM user_field_values
    WHERE contact_id = p_secondary_id
    ON CONFLICT (contact_id, field_id) DO NOTHING;

    -- 5. Move Notes
    UPDATE contact_notes
    SET contact_id = p_primary_id
    WHERE contact_id = p_secondary_id;

    -- 6. Move Conversations
    UPDATE conversations
    SET contact_id = p_primary_id
    WHERE contact_id = p_secondary_id;

    -- 7. Update Primary Contact
    UPDATE contacts
    SET last_interaction = v_latest_interaction,
        updated_at = NOW()
    WHERE id = p_primary_id;

    -- 8. Delete Secondary Contact
    DELETE FROM contacts WHERE id = p_secondary_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
