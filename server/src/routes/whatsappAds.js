import express from 'express';
import { whatsappAdsService } from '../services/whatsappAdsService.js';

const router = express.Router();

router.get('/welcome-sequences', async (req, res) => {
    try {
        const { workspaceId, wabaId } = req.query;
        if (!workspaceId || !wabaId) return res.status(400).json({ error: 'Missing workspaceId or wabaId' });
        
        const sequences = await whatsappAdsService.getWelcomeSequences(workspaceId, wabaId);
        res.json(sequences);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/welcome-sequences', async (req, res) => {
    try {
        const { workspaceId, wabaId, ...sequenceData } = req.body;
        if (!workspaceId || !wabaId) return res.status(400).json({ error: 'Missing workspaceId or wabaId' });
        
        const result = await whatsappAdsService.createOrUpdateSequence(workspaceId, wabaId, sequenceData);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/welcome-sequences/:sequenceId', async (req, res) => {
    try {
        const { sequenceId } = req.params;
        const { workspaceId, wabaId } = req.query;
        
        const result = await whatsappAdsService.deleteSequence(workspaceId, wabaId, sequenceId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
