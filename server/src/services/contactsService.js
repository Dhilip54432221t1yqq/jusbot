import { supabase } from '../utils/supabase.js';

export const contactsService = {

    // Advanced search and filtering
    async listContacts(workspaceId, filters = {}) {
        const { 
            search, 
            tags = [], 
            channel, 
            email_exists,
            phone_exists,
            country,
            last_interaction_before,
            last_interaction_after,
            subscribed_before,
            subscribed_after,
            fieldFilters = [], // [{ field_id, operator, value }]
            logicalOperator = 'AND',
            page = 1,
            limit = 20
        } = filters;

        // Build a complex query
        let query = supabase
            .from('contacts')
            .select(`
                *,
                user_tags(tag_id, tags(name)),
                user_field_values(field_id, fields(field_name), value)
            `, { count: 'exact' })
            .eq('workspace_id', workspaceId);

        // Basic Search
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // Channel filter — filter by checking the platform-specific user_id column
        if (channel) {
            const channelColumnMap = {
                whatsapp: 'whatsapp_user_id',
                instagram: 'instagram_user_id',
                facebook: 'facebook_user_id',
                telegram: 'telegram_user_id'
            };
            const col = channelColumnMap[channel];
            if (col) query = query.not(col, 'is', null);
        }

        if (email_exists === 'true') query = query.not('email', 'is', null);
        if (phone_exists === 'true') query = query.not('phone', 'is', null);

        // Date Filters
        if (last_interaction_after) query = query.gte('last_interaction', last_interaction_after);
        if (last_interaction_before) query = query.lte('last_interaction', last_interaction_before);
        if (subscribed_after) query = query.gte('subscribed_at', subscribed_after);
        if (subscribed_before) query = query.lte('subscribed_at', subscribed_before);

        // Tag Filters (Simple implementation)
        if (tags.length > 0) {
            const { data: contactIds } = await supabase
                .from('user_tags')
                .select('contact_id')
                .in('tag_id', tags);
            
            if (contactIds) {
                query = query.in('id', contactIds.map(c => c.contact_id));
            }
        }

        const { data, count, error } = await query
            .range((page - 1) * limit, page * limit - 1)
            .order('last_interaction', { ascending: false });

        if (error) throw error;

        // Derive 'channel' field for frontend from platform-specific columns
        const items = (data || []).map(c => {
            let derivedChannel = 'unknown';
            if (c.whatsapp_user_id) derivedChannel = 'whatsapp';
            else if (c.instagram_user_id) derivedChannel = 'instagram';
            else if (c.facebook_user_id) derivedChannel = 'facebook';
            else if (c.telegram_user_id) derivedChannel = 'telegram';
            return { ...c, channel: derivedChannel };
        });

        return { items, total: count };
    },

    async getContactProfile(contactId) {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
                *,
                user_tags(tag_id, tags(name)),
                user_field_values(field_id, fields(field_name, variable_type), value),
                contact_notes(id, content, created_at, agent_id)
            `)
            .eq('id', contactId)
            .single();
        
        if (error) throw error;
        return data;
    },

    async createOrUpdateContact(workspaceId, contactData) {
        const { channel_user_id, channel, name, email, phone, avatar_url, language, timezone } = contactData;
        
        // Map the generic channel to the correct column name
        const channelColumnMap = {
            whatsapp: 'whatsapp_user_id',
            instagram: 'instagram_user_id',
            facebook: 'facebook_user_id',
            telegram: 'telegram_user_id'
        };
        const channelCol = channelColumnMap[channel] || 'whatsapp_user_id';
        
        // Try to find existing contact by workspace + platform user id
        let existing = null;
        if (channel_user_id) {
            const { data } = await supabase
                .from('contacts')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq(channelCol, channel_user_id)
                .maybeSingle();
            existing = data;
        }

        // Also try to match by phone if provided and no match yet
        if (!existing && phone) {
            const { data } = await supabase
                .from('contacts')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('phone', phone)
                .maybeSingle();
            existing = data;
        }

        const updatePayload = {
            name: name || undefined,
            email: email || undefined,
            phone: phone || undefined,
            avatar_url: avatar_url || undefined,
            language: language || undefined,
            timezone: timezone || undefined,
            last_interaction: new Date(),
            updated_at: new Date()
        };

        // Set the platform-specific user ID
        if (channel_user_id) {
            updatePayload[channelCol] = channel_user_id;
        }

        // Remove undefined values
        Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

        if (existing) {
            const { data, error } = await supabase
                .from('contacts')
                .update(updatePayload)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('contacts')
                .insert([{ 
                    ...updatePayload, 
                    workspace_id: workspaceId, 
                    subscribed_at: new Date() 
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    // Variable Mapping & Field Autocreation
    async saveFieldValue(workspaceId, contactId, fieldName, value) {
        // 1. Find field or create it
        let { data: field } = await supabase
            .from('fields')
            .select('id, variable_type')
            .eq('workspace_id', workspaceId)
            .eq('field_name', fieldName)
            .eq('field_scope', 'user')
            .single();

        if (!field) {
            // Autocreate field
            const { data: newField, error: createError } = await supabase
                .from('fields')
                .insert([{
                    workspace_id: workspaceId,
                    field_name: fieldName,
                    field_scope: 'user',
                    variable_type: 'Text', // Default to text
                    description: 'Automatically created from flow builder',
                    is_editable: true
                }])
                .select()
                .single();
            
            if (createError) throw createError;
            field = newField;
        }

        // 2. Upsert value
        const { error: upsertError } = await supabase
            .from('user_field_values')
            .upsert({
                contact_id: contactId,
                field_id: field.id,
                value: String(value),
                updated_at: new Date()
            });
        
        if (upsertError) throw upsertError;
        return true;
    },

    // Segments
    async listSegments(workspaceId) {
        const { data, error } = await supabase
            .from('segments')
            .select('*')
            .eq('workspace_id', workspaceId);
        if (error) throw error;
        return data;
    },

    async createSegment(workspaceId, segmentData) {
        const { data, error } = await supabase
            .from('segments')
            .insert([{ ...segmentData, workspace_id: workspaceId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateSegment(workspaceId, segmentId, segmentData) {
        const { data, error } = await supabase
            .from('segments')
            .update(segmentData)
            .eq('id', segmentId)
            .eq('workspace_id', workspaceId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteSegment(workspaceId, segmentId) {
        const { error } = await supabase
            .from('segments')
            .delete()
            .eq('id', segmentId)
            .eq('workspace_id', workspaceId);
        if (error) throw error;
        return true;
    },

    // Notes
    async addNote(contactId, agentId, content) {
        const { data, error } = await supabase
            .from('contact_notes')
            .insert([{ contact_id: contactId, agent_id: agentId, content }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Import logic
    async listImportJobs(workspaceId) {
        const { data, error } = await supabase
            .from('import_jobs')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async startImport(workspaceId, filename, rows) {
        // 1. Create Job record
        const { data: job, error: jobError } = await supabase
            .from('import_jobs')
            .insert([{ 
                workspace_id: workspaceId, 
                filename, 
                total_rows: rows.length, 
                status: 'processing' 
            }])
            .select()
            .single();
        
        if (jobError) throw jobError;

        // 2. Process rows async (for now just a promise that we don't await)
        this._processImport(job.id, workspaceId, rows).catch(console.error);

        return job;
    },

    async _processImport(jobId, workspaceId, rows) {
        let processed = 0;
        for (const row of rows) {
            try {
                // name, email, phone, tag, city
                const contact = await this.createOrUpdateContact(workspaceId, {
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    channel: 'import',
                    channel_user_id: row.email || row.phone || `imp_${Date.now()}_${processed}`
                });

                // Handle Tags
                if (row.tag) {
                    const tagNames = row.tag.split(',').map(t => t.trim());
                    for (const tagName of tagNames) {
                        // Find or create tag
                        let { data: tag } = await supabase
                            .from('tags')
                            .select('id')
                            .eq('workspace_id', workspaceId)
                            .eq('name', tagName)
                            .maybeSingle();
                        
                        if (!tag) {
                            const { data: newTag } = await supabase
                                .from('tags')
                                .insert([{ workspace_id: workspaceId, name: tagName }])
                                .select()
                                .single();
                            tag = newTag;
                        }

                        if (tag) {
                            await supabase.from('user_tags').upsert({ contact_id: contact.id, tag_id: tag.id });
                        }
                    }
                }

                // Handle city (as a custom field)
                if (row.city) {
                    await this.saveFieldValue(workspaceId, contact.id, 'city', row.city);
                }

                processed++;
                if (processed % 10 === 0 || processed === rows.length) {
                    await supabase.from('import_jobs').update({ processed_rows: processed }).eq('id', jobId);
                }
            } catch (err) {
                console.error(`Import error on row ${processed}:`, err);
            }
        }

        await supabase.from('import_jobs').update({ status: 'completed' }).eq('id', jobId);
    }
}
