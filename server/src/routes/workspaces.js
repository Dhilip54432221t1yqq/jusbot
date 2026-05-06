import express from 'express';
import { supabase } from '../utils/supabase.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// 1. Get all workspaces for the current user (via membership)
router.get('/', async (req, res) => {
    // userId comes from auth middleware (JWT verified)
    const userId = req.userId;

    try {
        // Fetch workspaces where user is a member/owner
        const { data, error } = await supabase
            .from('workspace_members')
            .select(`
                role,
                workspaces (
                    id,
                    name,
                    created_at
                )
            `)
            .eq('user_id', userId);

        if (error) throw error;

        // Flatten the response
        const workspaces = data.map(m => ({
            ...m.workspaces,
            role: m.role
        }));

        res.json(workspaces);
    } catch (err) {
        console.error('Error fetching workspaces:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Update workspace details (Owner/Admin only)
router.put('/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { name, logo_url, timezone, default_theme } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .update({
                name,
                logo_url,
                timezone,
                default_theme
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error updating workspace:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Create new workspace
router.post('/', async (req, res) => {
    const userId = req.userId;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        // 1. Create the workspace
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({
                name,
                user_id: userId
            })
            .select()
            .single();

        if (wsError) {
            console.error('[Workspaces] Create WS Error:', wsError);
            throw wsError;
        }

        // 2. Add creator as owner in membership table
        const { error: memError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: userId,
                role: 'owner'
            });

        if (memError) {
            console.error('[Workspaces] Member Insert Error:', memError);
            throw memError;
        }

        res.status(201).json({
            ...workspace,
            role: 'owner'
        });
    } catch (err) {
        console.error('Error creating workspace:', err);
        res.status(500).json({ error: err.message });
    }
});


// 4. Get all members of a specific workspace
router.get('/:id/members', requireWorkspaceAccess(['owner', 'admin', 'member']), async (req, res) => {
    const { id } = req.params;
    
    try {
        // First, try to fetch with profiles join
        const { data, error } = await supabase
            .from('workspace_members')
            .select(`
                id,
                user_id,
                role,
                created_at,
                profiles:user_id (
                    email,
                    full_name,
                    avatar_url
                )
            `)
            .eq('workspace_id', id);

        if (error) {
            console.warn('[Members] Join fetch failed, trying fallback:', error.message);
            // Fallback: Fetch without join if profiles table is missing or relationship is broken
            const { data: simpleData, error: simpleError } = await supabase
                .from('workspace_members')
                .select('id, user_id, role, created_at')
                .eq('workspace_id', id);

            if (simpleError) throw simpleError;
            
            return res.json(simpleData.map(m => ({
                ...m,
                email: 'Unknown (Run SQL)',
                name: 'Member'
            })));
        }
        
        // Flatten and format
        const members = data.map(m => ({
            id: m.id,
            user_id: m.user_id,
            role: m.role,
            created_at: m.created_at,
            email: Array.isArray(m.profiles) ? m.profiles[0]?.email : m.profiles?.email || 'Unknown',
            name: Array.isArray(m.profiles) ? m.profiles[0]?.full_name : m.profiles?.full_name || 'Member'
        }));

        res.json(members);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ error: err.message });
    }
});

// 5. Add a member to a workspace (Owner/Admin only)
router.post('/:id/members', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // 1. Find user by email in profiles
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (pError || !profile) {
            return res.status(404).json({ error: 'User not found. They must sign up for Reflx first.' });
        }

        // 2. Add as member
        const { data: member, error: mError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: id,
                user_id: profile.id,
                role
            })
            .select()
            .single();

        if (mError) {
            if (mError.code === '23505') return res.status(400).json({ error: 'User is already a member' });
            throw mError;
        }

        res.status(201).json(member);
    } catch (err) {
        console.error('Error adding member:', err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Remove a member (Owner/Admin only)
router.delete('/:workspaceId/members/:userId', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { workspaceId, userId } = req.params;

    try {
        const { error } = await supabase
            .from('workspace_members')
            .delete()
            .eq('workspace_id', workspaceId)
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
