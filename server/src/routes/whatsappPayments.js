import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

router.get('/settings', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        let { data, error } = await supabase.from('whatsapp_payments_settings').select('*').eq('workspace_id', workspaceId).single();
        
        if (!data) {
            // Return defaults
            return res.json({
                payment_mode: 'gateway',
                pg_provider: 'razorpay',
                pg_merchant_id: '',
                pg_api_key: '',
                pg_secret: '',
                upi_vpa: '',
                upi_mcc: '',
                upi_pc: '',
                enabled: false
            });
        }
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/settings', async (req, res) => {
    try {
        const { workspaceId, ...payload } = req.body;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        const { data, error } = await supabase.from('whatsapp_payments_settings').upsert({
            workspace_id: workspaceId,
            ...payload,
            updated_at: new Date().toISOString()
        }, { onConflict: 'workspace_id' }).select().single();
        
        if (error) throw new Error(error.message);
        
        res.json({ success: true, settings: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
