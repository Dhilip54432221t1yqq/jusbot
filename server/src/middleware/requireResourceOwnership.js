import { supabase } from '../utils/supabase.js';

/**
 * Middleware to verify that a requested resource belongs to a workspace
 * that the logged-in user has access to.
 * 
 * @param {string} paramName - The name of the parameter in req.params (e.g., 'flowId', 'id')
 * @param {string} tableName - The Supabase table name to query (e.g., 'flows', 'contacts')
 * @param {string} workspaceColumn - The column in the table that stores the workspace ID (default is 'workspace_id')
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'admin', 'member'])
 */
export const requireResourceOwnership = (paramName, tableName, workspaceColumn = 'workspace_id', allowedRoles = ['owner', 'admin', 'member']) => {
    return async (req, res, next) => {
        const resourceId = req.params[paramName];
        if (!resourceId) {
            return res.status(400).json({ error: `Missing ${paramName} parameter` });
        }

        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            // 1. Fetch the resource to get its workspace_id
            const { data: resource, error: resourceError } = await supabase
                .from(tableName)
                .select(workspaceColumn)
                .eq('id', resourceId)
                .single();

            if (resourceError || !resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            const workspaceId = resource[workspaceColumn];

            // 2. Query workspace_members
            const { data: member, error: memberError } = await supabase
                .from('workspace_members')
                .select('role')
                .eq('workspace_id', workspaceId)
                .eq('user_id', userId)
                .single();

            if (memberError || !member) {
                console.warn(`[IDOR Block] User ${userId} attempted to access resource ${resourceId} in table ${tableName}`);
                return res.status(403).json({ error: 'Access denied: You do not have permission to access this resource' });
            }

            // 3. Validate Role
            if (!allowedRoles.includes(member.role)) {
                return res.status(403).json({ error: `Access denied: Requires one of roles: ${allowedRoles.join(', ')}` });
            }

            // 4. Inject validated workspace info
            req.workspaceId = workspaceId;
            req.userRole = member.role;

            next();
        } catch (err) {
            console.error('requireResourceOwnership Error:', err);
            res.status(500).json({ error: 'Internal server error validating access' });
        }
    };
};
