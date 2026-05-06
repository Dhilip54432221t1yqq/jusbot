import express from 'express';
import { listSpreadsheets, appendRow, updateRow, getRows, getSpreadsheetDetails } from '../services/googleSheets.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// Auth is handled globally by authenticate middleware in index.js
// req.userId is set from the JWT token

router.get('/list', requireWorkspaceAccess(), async (req, res) => {
    const userId = req.userId;
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required (x-workspace-id header)' });
    }

    try {
        const files = await listSpreadsheets(userId, workspaceId);
        res.json({ files });
    } catch (error) {
        console.error('Error listing sheets:', error);
        res.status(500).json({ error: error.message });
    }
});



router.get('/:id/details', requireWorkspaceAccess(), async (req, res) => {
    const userId = req.userId;
    const workspaceId = req.headers['x-workspace-id'];
    const { id } = req.params;
    try {
        const details = await getSpreadsheetDetails(userId, id, workspaceId);
        res.json(details);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/headers', requireWorkspaceAccess(), async (req, res) => {
    const userId = req.userId;
    const workspaceId = req.headers['x-workspace-id'];
    const { spreadsheetId, sheetName } = req.body;
    try {
        // Fetch first row of the specific sheet
        const range = `${sheetName}!A1:Z1`;
        const rows = await getRows(userId, spreadsheetId, range, workspaceId);
        // rows is [[col1, col2, ...]]
        res.json({ headers: rows && rows.length > 0 ? rows[0] : [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/append', requireWorkspaceAccess(), async (req, res) => {
    const userId = req.userId;
    const workspaceId = req.headers['x-workspace-id'];
    const { spreadsheetId, range, values } = req.body;

    try {
        const result = await appendRow(userId, spreadsheetId, range, values, workspaceId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
