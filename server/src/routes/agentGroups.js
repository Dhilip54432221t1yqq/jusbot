import express from 'express';
import { supabase } from '../utils/db.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// 1. Get all agent groups for a workspace
router.get('/workspace/:workspaceId', requireWorkspaceAccess(['owner', 'admin', 'member']), async (req, res) => {
    const { workspaceId } = req.params;

    try {
        const { data, error } = await supabase
            .from('agent_groups')
            .select(`
                *,
                agent_group_members (
                    id, user_id, weighting, created_at
                )
            `)
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[Agent Groups] Fetch Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Create a new agent group
router.post('/workspace/:workspaceId', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { workspaceId } = req.params;
    const { name, image_url, assign_method, assign_by_status, group_chat_enabled, conversation_visibility, members } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        // Create the group
        const { data: group, error: groupError } = await supabase
            .from('agent_groups')
            .insert({
                workspace_id: workspaceId,
                name,
                image_url,
                assign_method,
                assign_by_status,
                group_chat_enabled,
                conversation_visibility
            })
            .select()
            .single();

        if (groupError) throw groupError;

        // Add members if any
        if (members && members.length > 0) {
            const membersToInsert = members.map(m => ({
                agent_group_id: group.id,
                user_id: m.user_id,
                weighting: m.weighting || 0
            }));
            
            const { error: membersError } = await supabase
                .from('agent_group_members')
                .insert(membersToInsert);
                
            if (membersError) {
                console.error('[Agent Groups] Error adding members:', membersError);
            }
        }

        res.status(201).json(group);
    } catch (err) {
        console.error('[Agent Groups] Create Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Update an agent group
router.put('/:groupId', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { groupId } = req.params;
    const { name, image_url, assign_method, assign_by_status, group_chat_enabled, conversation_visibility, members } = req.body;

    try {
        // Update the group details
        const { data: group, error: groupError } = await supabase
            .from('agent_groups')
            .update({
                name,
                image_url,
                assign_method,
                assign_by_status,
                group_chat_enabled,
                conversation_visibility,
                updated_at: new Date().toISOString()
            })
            .eq('id', groupId)
            .select()
            .single();

        if (groupError) throw groupError;

        // Update members: delete all and re-insert
        if (members) {
            await supabase
                .from('agent_group_members')
                .delete()
                .eq('agent_group_id', groupId);
                
            if (members.length > 0) {
                const membersToInsert = members.map(m => ({
                    agent_group_id: groupId,
                    user_id: m.user_id,
                    weighting: m.weighting || 0
                }));
                
                await supabase
                    .from('agent_group_members')
                    .insert(membersToInsert);
            }
        }

        res.json(group);
    } catch (err) {
        console.error('[Agent Groups] Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete an agent group
router.delete('/:groupId', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { groupId } = req.params;

    try {
        const { error } = await supabase
            .from('agent_groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('[Agent Groups] Delete Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
