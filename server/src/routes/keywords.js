import express from 'express';
import { supabase } from '../utils/supabase.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';
import { requireResourceOwnership } from '../middleware/requireResourceOwnership.js';

const router = express.Router();


// ─── List all keywords ───────────────────────────────────────────────────────
router.get('/', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

  try {
    const { data, error } = await supabase
      .from('keywords')
      .select('*, flows(id, name)')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Create keyword ──────────────────────────────────────────────────────────
router.post('/', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id, match_type, keywords, flow_id, status } = req.body;
  if (!workspace_id || !match_type || !keywords || !flow_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic validation: comma-separated, no spaces between commas
  if (keywords.includes(', ')) {
      return res.status(400).json({ error: 'Invalid keyword format. Use commas without spaces (e.g. hi,hello).' });
  }

  try {
    const { data, error } = await supabase
      .from('keywords')
      .insert([{ workspace_id, match_type, keywords, flow_id, status: status || 'active' }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, keyword: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Update keyword ──────────────────────────────────────────────────────────
router.put('/:id', requireResourceOwnership('id', 'keywords'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id, match_type, keywords, flow_id, status } = req.body;

  try {
    const { data, error } = await supabase
      .from('keywords')
      .update({ match_type, keywords, flow_id, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspace_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, keyword: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Delete keyword ──────────────────────────────────────────────────────────
router.delete('/:id', requireResourceOwnership('id', 'keywords'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id } = req.query;

  try {
    const { error } = await supabase
      .from('keywords').delete().eq('id', id).eq('workspace_id', workspace_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
