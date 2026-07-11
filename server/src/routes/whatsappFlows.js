import express from 'express';
import { whatsappFlowService } from '../services/whatsappFlowService.js';
import { supabase } from '../utils/db.js';

const router = express.Router();

// Publish flow to Meta
router.post('/publish', async (req, res) => {
    try {
        const { flowId, wabaId, workspaceId } = req.body;
        if (!flowId || !wabaId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const result = await whatsappFlowService.publishFlowToMeta(flowId, wabaId);
        res.json(result);
    } catch (error) {
        console.error("Flow Publish Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// WhatsApp Flows Endpoint (Dynamic Flows Webhook)
router.post('/endpoint', async (req, res) => {
    try {
        // Meta sends an encrypted payload for endpoint interaction
        const encryptedBody = req.body;
        
        // Example implementation stub (Real implementation needs crypto logic)
        // const decrypted = decryptRequest(encryptedBody);
        
        const decryptedStub = {
            action: 'ping', // stub
            data: {}
        };
        
        const responsePayload = await whatsappFlowService.handleEndpointRequest(decryptedStub, encryptedBody);
        
        // Log endpoint request asynchronously
        supabase.from('whatsapp_flow_endpoint_logs').insert([{
            action: decryptedStub.action,
            request_payload: decryptedStub,
            response_payload: responsePayload,
            status: 'SUCCESS'
        }]).then();
        
        // Encrypt and send
        res.json(responsePayload); // Send encrypted payload in real scenario
    } catch (error) {
        console.error("Endpoint Error:", error);
        res.status(500).send("Endpoint Failure");
    }
});

export default router;
