import express from 'express';
import { whatsappMarketingMessagesService } from '../services/whatsappMarketingService.js';
import { supabase } from '../utils/db.js';

const router = express.Router();

router.get('/settings', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        const settings = await whatsappMarketingMessagesService.getMarketingApiSettings(workspaceId);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/settings', async (req, res) => {
    try {
        const { workspaceId, ...payload } = req.body;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        const settings = await whatsappMarketingMessagesService.updateMarketingApiSettings(workspaceId, payload);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/prerequisites', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const checks = await whatsappMarketingMessagesService.checkMarketingPrerequisites(workspaceId);
        res.json(checks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/messages/send', async (req, res) => {
    try {
        const { workspaceId, to, recipient, templateName, languageCode, components, productPolicy, messageActivitySharing } = req.body;
        
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        // Validation handled inside service
        const metaResponse = await whatsappMarketingMessagesService.sendMarketingTemplateMessage({
            to, recipient, templateName, languageCode, components, productPolicy, messageActivitySharing
        });

        // Log the send
        const metaId = metaResponse.messages?.[0]?.id || null;
        
        await whatsappMarketingMessagesService.logMarketingMessageSend(workspaceId, {
            phone_number: to,
            bsuid: recipient,
            meta_message_id: metaId,
            request_payload: req.body,
            response_payload: metaResponse,
            status: metaId ? 'sent' : 'failed',
            product_policy: productPolicy,
            message_activity_sharing: String(messageActivitySharing)
        });

        res.json({ success: true, metaResponse });
    } catch (err) {
        // Also log failure if we can
        const { workspaceId, to, recipient, productPolicy, messageActivitySharing } = req.body;
        if (workspaceId) {
            whatsappMarketingMessagesService.logMarketingMessageSend(workspaceId, {
                phone_number: to,
                bsuid: recipient,
                request_payload: req.body,
                status: 'failed',
                product_policy: productPolicy,
                message_activity_sharing: String(messageActivitySharing),
                error_message: err.message
            }).catch(console.error);
        }
        
        res.status(500).json({ error: err.message });
    }
});

router.post('/cloud-api-status', async (req, res) => {
    try {
        const { wabaId, disable } = req.body;
        const response = await whatsappMarketingMessagesService.setCloudApiMarketingDisabled(wabaId, disable);
        res.json(response);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
