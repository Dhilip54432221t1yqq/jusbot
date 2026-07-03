import express from 'express';
import { whatsappTemplateService } from '../services/whatsappTemplateService.js';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

// Middleware to verify auth if needed - skipping for MVP, using body workspaceId
// In real app, we'd use requireAuth

router.post('/submit', async (req, res) => {
    try {
        const { templateId, workspaceId, wabaId } = req.body;
        if (!templateId || !workspaceId || !wabaId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Get the local template
        const { data: tmpl, error } = await supabase.from('whatsapp_templates').select('*').eq('id', templateId).single();
        if (error || !tmpl) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // 2. Validate
        whatsappTemplateService.validateTemplatePayload(tmpl);

        // 3. Build Payload
        const payload = whatsappTemplateService.buildMetaTemplatePayload(tmpl);

        // 4. Submit to Meta
        const metaResponse = await whatsappTemplateService.submitTemplateToMeta(wabaId, payload);

        // 5. Update local status
        const metaId = metaResponse.id || null;
        await whatsappTemplateService.updateLocalTemplate(templateId, {
            status: 'In Review',
            meta_template_id: metaId,
            submitted_at: new Date().toISOString()
        });

        res.json({ success: true, meta_id: metaId, status: 'In Review' });
    } catch (error) {
        console.error("Template Submission Error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/sync', async (req, res) => {
    try {
        const { templateId, wabaId } = req.body;
        const { data: tmpl } = await supabase.from('whatsapp_templates').select('*').eq('id', templateId).single();
        
        if (!tmpl || !tmpl.meta_template_id) {
            return res.status(400).json({ error: 'Invalid template for sync' });
        }

        const metaData = await whatsappTemplateService.syncTemplateStatus(wabaId, tmpl.meta_template_id);
        
        if (metaData && metaData.status) {
            let status = 'Unknown';
            if (metaData.status === 'APPROVED') status = 'Approved';
            else if (metaData.status === 'PENDING') status = 'In Review';
            else if (metaData.status === 'REJECTED') status = 'Rejected';
            
            await whatsappTemplateService.updateLocalTemplate(templateId, {
                status,
                quality_rating: metaData.quality_score?.score || null,
                rejection_reason: metaData.rejected_reason || null
            });
            
            return res.json({ success: true, status });
        }
        
        res.json({ success: false, message: 'No update from Meta' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/meta/:id', async (req, res) => {
    try {
        const { wabaId, name } = req.query;
        await whatsappTemplateService.deleteTemplateFromMeta(wabaId, name);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
