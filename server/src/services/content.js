
import { supabase } from '../utils/supabase.js';

// Unified Fields (User, Bot, System)
export const listFields = async (workspaceId, scope = null) => {
    let query = supabase
        .from('fields')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('field_scope', { ascending: false }) // system, user, bot
        .order('field_name', { ascending: true });

    if (scope) {
        query = query.eq('field_scope', scope);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const createField = async (field) => {
    // Check if field already exists (handled by UNIQUE constraint but better to catch here)
    const { data, error } = await supabase.from('fields').insert(field).select();
    if (error) throw error;
    return data[0];
};

export const updateField = async (id, updates, workspaceId) => {
    // Prevent updating name or scope of system fields if needed, 
    // but the SQL schema or UI usually handles this.
    const { data, error } = await supabase
        .from('fields')
        .update(updates)
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .eq('is_editable', true) // Protection
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteField = async (id, workspaceId) => {
    const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .eq('is_editable', true); // Protection
    if (error) throw error;
    return true;
};

// Tags
export const listTags = async (workspaceId) => {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createTag = async (tag) => {
    const { data, error } = await supabase.from('tags').insert(tag).select();
    if (error) throw error;
    return data[0];
};

export const deleteTag = async (id, workspaceId) => {
    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId);
    if (error) throw error;
    return true;
};

// Templates
export const listTemplates = async (workspaceId) => {
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createTemplate = async (template) => {
    const { data, error } = await supabase.from('message_templates').insert(template).select();
    if (error) throw error;
    return data[0];
};

export const updateTemplate = async (id, updates, workspaceId) => {
    const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteTemplate = async (id, workspaceId) => {
    const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId);
    if (error) throw error;
    return true;
};

// Media Assets
export const listMedia = async (workspaceId) => {
    const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createMedia = async (media) => {
    // Try with size column first
    try {
        const { data, error } = await supabase.from('media_assets').insert({
            name: media.name,
            type: media.type,
            url: media.url,
            size: media.size,
            workspace_id: media.workspace_id
        }).select();
        if (error) throw error;
        return data[0];
    } catch (err) {
        // Fallback: insert without size if column doesn't exist
        console.warn('createMedia fallback (size column may be missing):', err.message);
        const { data, error } = await supabase.from('media_assets').insert({
            name: media.name,
            type: media.type,
            url: media.url,
            workspace_id: media.workspace_id
        }).select();
        if (error) throw error;
        return data[0];
    }
};

export const deleteMedia = async (id, workspaceId) => {
    const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId);
    if (error) throw error;
    return true;
};
