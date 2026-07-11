import express from 'express';
import { whatsappCatalogService } from '../services/whatsappCatalogService.js';
import { supabase } from '../utils/db.js';

const router = express.Router();

router.get('/settings', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        const settings = await whatsappCatalogService.getSettings(workspaceId);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/settings', async (req, res) => {
    try {
        const { workspaceId, ...payload } = req.body;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });
        
        const settings = await whatsappCatalogService.updateSettings(workspaceId, payload);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/products/:internalId/sync', async (req, res) => {
    try {
        const { internalId } = req.params;
        const { workspaceId, catalogId, productData } = req.body;
        
        const mapping = await whatsappCatalogService.syncProductToWhatsAppCatalog(workspaceId, internalId, catalogId, productData);
        res.json({ success: true, mapping });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/messages/single-product', async (req, res) => {
    try {
        const { workspaceId, to, catalogId, productRetailerId } = req.body;
        const result = await whatsappCatalogService.sendSingleProductMessage(workspaceId, to, catalogId, productRetailerId);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Extend to orders, inquiries, webhooks, compliance...
router.get('/orders', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const { data } = await supabase.from('whatsapp_catalog_orders').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
        res.json(data || []);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/products', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        // In reality, this joins ecommerce products table.
        const { data } = await supabase.from('whatsapp_catalog_product_mappings').select('*').eq('workspace_id', workspaceId);
        res.json(data || []);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
