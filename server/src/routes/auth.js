import express from 'express';
import { getAuthUrl, saveTokens } from '../services/googleSheets.js';

const router = express.Router();

// Step 1: Redirect to Google
router.get('/google', (req, res) => {
    const { user_id, workspace_id } = req.query;
    if (!user_id || !workspace_id) {
        return res.status(400).json({ error: 'User ID and Workspace ID required' });
    }
    const url = getAuthUrl(user_id, workspace_id);
    res.redirect(url);
});

// Step 2: Callback from Google
router.get('/google/callback', async (req, res) => {
    const code = req.query.code;
    const stateStr = req.query.state;

    if (!code || !stateStr) {
        return res.status(400).json({ error: 'Invalid callback' });
    }

    try {
        const { userId, workspaceId } = JSON.parse(stateStr);
        await saveTokens(userId, workspaceId, code);
        // Redirect back to frontend
        res.redirect(`http://localhost:5173/${workspaceId}/integrations?status=success`);
    } catch (error) {
        console.error('Error saving tokens:', error);
        res.redirect(`http://localhost:5173/${workspaceId}/integrations?status=error`);
    }
});

export default router;
