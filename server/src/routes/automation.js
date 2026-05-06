import express from 'express';
import { supabase } from '../utils/supabase.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';

const router = express.Router();

// ─── Get automation settings ─────────────────────────────────────────────────
router.get('/settings', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

  try {
    const { data, error } = await supabase
      .from('automation_settings')
      .select('*, flows:default_reply_flow_id(id, name)')
      .eq('workspace_id', workspace_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    // If not found, return defaults
    if (!data) {
        return res.json({
            workspace_id,
            default_reply_enabled: false,
            default_reply_flow_id: null,
            default_reply_frequency: 'every_time'
        });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Update/Upsert automation settings ───────────────────────────────────────
router.patch('/settings', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id, default_reply_enabled, default_reply_flow_id, default_reply_frequency } = req.body;
  if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

  try {
    const { data, error } = await supabase
      .from('automation_settings')
      .upsert({ 
          workspace_id, 
          default_reply_enabled, 
          default_reply_flow_id: default_reply_flow_id || null, 
          default_reply_frequency: default_reply_frequency || 'every_time',
          updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, settings: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
