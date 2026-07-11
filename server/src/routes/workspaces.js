import express from 'express';
import { supabase } from '../utils/db.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// 1. Get all workspaces for the current user (via membership)
router.get('/', async (req, res) => {
    // userId comes from auth middleware (JWT verified)
    const userId = req.userId;

    try {
        // Fetch workspaces where user is a member/owner
        const { data: memberships, error: memError } = await supabase
            .from('workspace_members')
            .select('*')
            .eq('user_id', userId);

        if (memError) throw memError;

        const workspaces = [];
        for (const membership of memberships) {
            const { data: ws } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', membership.workspace_id)
                .single();

            if (ws) {
                workspaces.push({
                    id: ws.id,
                    name: ws.name,
                    created_at: ws.created_at,
                    logo_url: ws.logo_url,
                    timezone: ws.timezone,
                    default_theme: ws.default_theme,
                    role: membership.role
                });
            }
        }

        res.json(workspaces);
    } catch (err) {
        console.error('Error fetching workspaces:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Update workspace details (Owner/Admin only)
router.put('/:id', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { name, logo_url, timezone, default_theme, business_hours } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .update({
                name,
                logo_url,
                timezone,
                default_theme,
                business_hours
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
        // Fetch workspace members
        const { data: members, error: memError } = await supabase
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', id);

        if (memError) throw memError;

        const results = [];
        for (const m of members) {
            let profile = null;
            if (m.user_id) {
                const { data: profData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', m.user_id)
                    .maybeSingle();
                profile = profData;
            }
            
            results.push({
                id: m.id,
                user_id: m.user_id,
                role: m.role,
                created_at: m.created_at,
                email: profile?.email || m.email || 'Unknown',
                name: profile?.full_name || (
                    m.role === 'owner' ? 'Owner' : 
                    m.role === 'admin' ? 'Admin' : 
                    (m.user_id ? 'Member' : 'Invited (Pending)')
                ),
                avatar_url: profile?.avatar_url
            });
        }

        res.json(results);
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
        // 1. Find user by email in profiles (optional)
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        // 2. Add as member (with user_id if found, otherwise just email)
        const memberData = {
            workspace_id: id,
            user_id: profile?.id || null,
            role,
            email: email.toLowerCase()
        };

        const { data: member, error: mError } = await supabase
            .from('workspace_members')
            .insert(memberData)
            .select()
            .single();

        if (mError) {
            if (mError.code === '23505') return res.status(400).json({ error: 'User is already invited or a member' });
            throw mError;
        }

        res.status(201).json(member);
    } catch (err) {
        console.error('Error adding member:', err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Remove a member (Owner/Admin only)
router.delete('/:workspaceId/members/:memberId', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { workspaceId, memberId } = req.params;

    try {
        const { error } = await supabase
            .from('workspace_members')
            .delete()
            .eq('workspace_id', workspaceId)
            .eq('id', memberId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({ error: err.message });
    }
});

// 7. Update member role (Owner/Admin only)
router.patch('/:workspaceId/members/:memberId/role', requireWorkspaceAccess(['owner', 'admin']), async (req, res) => {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;

    if (!role) return res.status(400).json({ error: 'Role is required' });

    try {
        const { error } = await supabase
            .from('workspace_members')
            .update({ role })
            .eq('workspace_id', workspaceId)
            .eq('id', memberId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
