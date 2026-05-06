import express from 'express';
import { supabase } from '../utils/supabase.js';
import { subscribeUser } from '../services/sequenceService.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';
import { requireResourceOwnership } from '../middleware/requireResourceOwnership.js';

const router = express.Router();

// ─── List Sequences ──────────────────────────────────────────────────────────
router.get('/', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

  try {
    const { data, error } = await supabase
      .from('sequences')
      .select('*, sequence_messages(count)')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Create Sequence ─────────────────────────────────────────────────────────
router.post('/', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id, name } = req.body;
  if (!workspace_id || !name) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data, error } = await supabase
      .from('sequences')
      .insert([{ workspace_id, name }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, sequence: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Update Sequence ─────────────────────────────────────────────────────────
router.put('/:id', requireResourceOwnership('id', 'sequences'), async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  try {
    const { data, error } = await supabase
      .from('sequences')
      .update({ name, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, sequence: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Delete Sequence ─────────────────────────────────────────────────────────
router.delete('/:id', requireResourceOwnership('id', 'sequences'), async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('sequences').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── List Messages in Sequence ───────────────────────────────────────────────
router.get('/:id/messages', requireResourceOwnership('id', 'sequences'), async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('sequence_messages')
        .select('*, flows(id, name)')
        .eq('sequence_id', req.params.id)
        .order('order_index', { ascending: true });
  
      if (error) throw error;
      res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Add Message to Sequence ─────────────────────────────────────────────────
router.post('/:id/messages', requireResourceOwnership('id', 'sequences'), async (req, res) => {
    const { delay_value, delay_unit, send_anytime, time_start, time_end, days, content_type, flow_id, order_index } = req.body;
    try {
      const { data, error } = await supabase
        .from('sequence_messages')
        .insert([{
            sequence_id: req.params.id,
            delay_value, delay_unit, send_anytime, time_start, time_end, 
            days: days || [0,1,2,3,4,5,6], 
            content_type, flow_id, order_index
        }])
        .select()
        .single();
  
      if (error) throw error;
      res.json({ success: true, message: data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Update Message ──────────────────────────────────────────────────────────
router.put('/messages/:msgId', async (req, res) => {
    const { delay_value, delay_unit, send_anytime, time_start, time_end, days, content_type, flow_id, order_index } = req.body;
    try {
      // Manual IDOR check for sequence_messages -> sequences
      const { data: msg } = await supabase.from('sequence_messages').select('sequence_id').eq('id', req.params.msgId).single();
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      
      const { data: seq } = await supabase.from('sequences').select('workspace_id').eq('id', msg.sequence_id).single();
      const { data: mem } = await supabase.from('workspace_members').select('role').eq('workspace_id', seq?.workspace_id).eq('user_id', req.userId).single();
      if (!mem) return res.status(403).json({ error: 'Access denied' });
      const { data, error } = await supabase
        .from('sequence_messages')
        .update({
            delay_value, delay_unit, send_anytime, time_start, time_end, 
            days, content_type, flow_id, order_index
        })
        .eq('id', req.params.msgId)
        .select()
        .single();
  
      if (error) throw error;
      res.json({ success: true, message: data });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Delete Message ──────────────────────────────────────────────────────────
router.delete('/messages/:msgId', async (req, res) => {
    try {
      // Manual IDOR check
      const { data: msg } = await supabase.from('sequence_messages').select('sequence_id').eq('id', req.params.msgId).single();
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      
      const { data: seq } = await supabase.from('sequences').select('workspace_id').eq('id', msg.sequence_id).single();
      const { data: mem } = await supabase.from('workspace_members').select('role').eq('workspace_id', seq?.workspace_id).eq('user_id', req.userId).single();
      if (!mem) return res.status(403).json({ error: 'Access denied' });
      const { error } = await supabase.from('sequence_messages').delete().eq('id', req.params.msgId);
      if (error) throw error;
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Subscribe User ──────────────────────────────────────────────────────────
router.post('/subscribe', requireWorkspaceAccess(), async (req, res) => {
    const { workspace_id, contact_id, sequence_id } = req.body;
    if (!workspace_id || !contact_id || !sequence_id) return res.status(400).json({ error: 'Missing fields' });

    const result = await subscribeUser(workspace_id, contact_id, sequence_id);
    if (result.error) return res.status(500).json({ error: result.error });
    res.json(result);
});

// ─── Unsubscribe User ────────────────────────────────────────────────────────
router.post('/unsubscribe', async (req, res) => {
    const { contact_id, sequence_id } = req.body;
    try {
        const { error } = await supabase
            .from('sequence_subscriptions')
            .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
            .eq('contact_id', contact_id)
            .eq('sequence_id', sequence_id);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
