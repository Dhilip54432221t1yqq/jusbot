import { supabase } from '../utils/supabase.js';

/**
 * Middleware to verify that the logged-in user has access to a workspace.
 * Prevents IDOR by validating the user's role in the workspace.
 * 
 * Extracts the workspace ID from:
 * 1. req.params.workspaceId
 * 2. req.params.id (if explicitly mapped or if it's the only ID parameter)
 * 3. req.query.workspace_id
 * 4. req.headers['x-workspace-id']
 * 5. req.body.workspace_id
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'admin', 'member'])
 */
export const requireWorkspaceAccess = (allowedRoles = ['owner', 'admin', 'member']) => {
    return async (req, res, next) => {
        // 1. Identify workspace ID
        const workspaceId = 
            req.params?.workspaceId || 
            req.query?.workspace_id || 
            req.query?.workspaceId || 
            req.headers?.['x-workspace-id'] || 
            req.body?.workspace_id ||
            req.body?.workspaceId ||
            req.params?.id; // Fallback for routes like PUT /api/workspaces/:id

        if (!workspaceId) {
            return res.status(400).json({ error: 'Workspace ID is required for access control' });
        }

        const userId = req.userId; // Provided by authMiddleware
        if (!userId) {
            return res.status(401).json({ error: 'User ID missing. Authentication required.' });
        }

        try {
            // 2. Query workspace_members
            const { data: member, error } = await supabase
                .from('workspace_members')
                .select('role')
                .eq('workspace_id', workspaceId)
                .eq('user_id', userId)
                .single();

            if (error || !member) {
                console.warn(`[IDOR Block] User ${userId} attempted to access workspace ${workspaceId}`);
                return res.status(403).json({ error: 'Access denied: You do not belong to this workspace' });
            }

            // 3. Validate Role
            if (!allowedRoles.includes(member.role)) {
                console.warn(`[IDOR Block] User ${userId} (Role: ${member.role}) attempted unauthorized action on workspace ${workspaceId}`);
                return res.status(403).json({ error: `Access denied: Requires one of roles: ${allowedRoles.join(', ')}` });
            }

            // 4. Inject validated workspace info to req
            req.workspaceId = workspaceId;
            req.userRole = member.role;

            next();
        } catch (err) {
            console.error('requireWorkspaceAccess Error:', err);
            res.status(500).json({ error: 'Internal server error validating access' });
        }
    };
};
