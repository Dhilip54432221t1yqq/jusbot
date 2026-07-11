
import { supabase } from '../utils/db.js';
import axios from 'axios';

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

export const testRequest = async ({
    method = 'GET',
    url = '',
    headers = [],
    params = [],
    bodyType = 'none',
    bodyRaw = '',
    bodyParams = [],
    authType = 'none',
    authBasicUsername = '',
    authBasicPassword = '',
    authBasicUsernameTest = '',
    authBasicPasswordTest = '',
    authBearerToken = '',
    authBearerTokenTest = '',
    authDigestUsername = '',
    authDigestPassword = '',
    authDigestUsernameTest = '',
    authDigestPasswordTest = '',
    workspaceId = null
}) => {
    // 1. Build variable substitution mappings
    const mappings = {};
    const collectMappings = (list) => {
        if (Array.isArray(list)) {
            list.forEach(item => {
                if (item.value) {
                    const match = item.value.match(/\{\{\s*(.*?)\s*\}\}/);
                    if (match && match[1]) {
                        mappings[match[1]] = item.testValue !== undefined && item.testValue !== '' ? item.testValue : item.value;
                    }
                }
            });
        }
    };
    collectMappings(params);
    collectMappings(headers);
    collectMappings(bodyParams);

    // Fetch workspace fields from database to use as fallbacks for variables if workspaceId is provided
    if (workspaceId) {
        try {
            const { data: dbFields } = await supabase
                .from('fields')
                .select('field_name, default_value')
                .eq('workspace_id', workspaceId);
            if (dbFields) {
                dbFields.forEach(f => {
                    if (f.field_name && !(f.field_name in mappings)) {
                        mappings[f.field_name] = f.default_value !== null && f.default_value !== undefined && f.default_value !== '' ? f.default_value : `[${f.field_name}]`;
                    }
                });
            }
        } catch (e) {
            console.error("Error fetching fallback fields for test request:", e);
        }
    }

    const sub = (text) => {
        if (typeof text !== 'string') return text;
        let result = text;
        for (const key in mappings) {
            const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'gi');
            result = result.replace(pattern, mappings[key]);
        }
        // Fallback for remaining unmapped placeholders
        result = result.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, g1) => {
            const trimmed = g1.trim();
            return mappings[trimmed] !== undefined ? mappings[trimmed] : `[${trimmed}]`;
        });
        return result;
    };

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 2. Resolve URL
    let resolvedUrl = sub(url);
    if (resolvedUrl && !resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
        resolvedUrl = 'http://' + resolvedUrl;
    }

    // 3. Resolve URL query parameters
    const queryParams = {};
    if (Array.isArray(params)) {
        params.forEach(p => {
            if (p.key) {
                queryParams[p.key] = sub(p.value);
            }
        });
    }

    // 4. Resolve headers
    const reqHeaders = {
        'User-Agent': 'Reflx-Dynamic-Tester/1.0'
    };
    if (Array.isArray(headers)) {
        headers.forEach(h => {
            if (h.key) {
                reqHeaders[h.key] = sub(h.value);
            }
        });
    }

    // 5. Resolve Auth
    let axiosAuth = null;
    if (authType === 'basic') {
        const u = authBasicUsernameTest || authBasicUsername;
        const p = authBasicPasswordTest || authBasicPassword;
        axiosAuth = { username: sub(u), password: sub(p) };
    } else if (authType === 'digest') {
        const u = authDigestUsernameTest || authDigestUsername;
        const p = authDigestPasswordTest || authDigestPassword;
        const authString = 'Digest username="' + sub(u) + '", password="' + sub(p) + '"';
        reqHeaders['Authorization'] = authString;
    } else if (authType === 'bearer') {
        const token = authBearerTokenTest || authBearerToken;
        reqHeaders['Authorization'] = `Bearer ${sub(token)}`;
    }

    // 6. Resolve Body
    let reqData = null;
    if (bodyType === 'raw' && bodyRaw) {
        reqData = sub(bodyRaw);
        const isJson = Object.keys(reqHeaders).some(k => k.toLowerCase() === 'content-type' && reqHeaders[k].includes('json'));
        if (isJson) {
            try {
                reqData = JSON.parse(reqData);
            } catch (e) {
                // Keep raw string
            }
        }
    } else if (bodyType === 'urlencoded' && Array.isArray(bodyParams)) {
        const urlParams = new URLSearchParams();
        bodyParams.forEach(bp => {
            if (bp.key) urlParams.append(bp.key, sub(bp.value));
        });
        reqData = urlParams.toString();
        reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (bodyType === 'multipart' && Array.isArray(bodyParams)) {
        const formData = {};
        bodyParams.forEach(bp => {
            if (bp.key) formData[bp.key] = sub(bp.value);
        });
        reqData = formData;
        reqHeaders['Content-Type'] = 'application/json';
    }

    // 7. Execute request
    const startTime = Date.now();
    try {
        const response = await axios({
            method: method.toUpperCase(),
            url: resolvedUrl,
            params: queryParams,
            headers: reqHeaders,
            data: reqData,
            auth: axiosAuth,
            timeout: 8000,
            validateStatus: () => true
        });

        const duration = Date.now() - startTime;
        return {
            success: true,
            status: response.status,
            statusText: response.statusText,
            timeMs: duration,
            headers: response.headers,
            body: response.data
        };
    } catch (err) {
        const duration = Date.now() - startTime;
        return {
            success: false,
            error: err.message,
            timeMs: duration
        };
    }
};
