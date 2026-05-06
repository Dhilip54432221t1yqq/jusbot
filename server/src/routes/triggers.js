import express from 'express';
import { supabase } from '../utils/supabase.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';
import { requireResourceOwnership } from '../middleware/requireResourceOwnership.js';

const router = express.Router();

// ─── List all triggers ───────────────────────────────────────────────────────
router.get('/', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

  try {
    const { data, error } = await supabase
      .from('triggers')
      .select('*, flows(id, name)')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Create trigger ──────────────────────────────────────────────────────────
router.post('/', requireWorkspaceAccess(), async (req, res) => {
  const { workspace_id, name, description, event_type, flow_id, condition_json, data_mapping } = req.body;
  if (!workspace_id || !name || !event_type) {
    return res.status(400).json({ error: 'workspace_id, name and event_type required' });
  }

  try {
    const { data, error } = await supabase
      .from('triggers')
      .insert([{ workspace_id, name, description, event_type, flow_id: flow_id || null, condition_json: condition_json || {}, data_mapping: data_mapping || [] }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, trigger: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Update trigger ──────────────────────────────────────────────────────────
router.put('/:id', requireResourceOwnership('id', 'triggers'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id, name, description, event_type, flow_id, condition_json, data_mapping, status } = req.body;

  try {
    const { data, error } = await supabase
      .from('triggers')
      .update({ name, description, event_type, flow_id: flow_id || null, condition_json, data_mapping, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspace_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, trigger: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Toggle enable/disable ───────────────────────────────────────────────────
router.patch('/:id/toggle', requireResourceOwnership('id', 'triggers'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id } = req.body;

  try {
    const { data: current, error: fetchError } = await supabase
      .from('triggers').select('status').eq('id', id).single();
    if (fetchError) throw fetchError;

    const newStatus = current.status === 'active' ? 'inactive' : 'active';
    const { data, error } = await supabase
      .from('triggers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspace_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, status: newStatus, trigger: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Delete trigger ──────────────────────────────────────────────────────────
router.delete('/:id', requireResourceOwnership('id', 'triggers'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id } = req.query;

  try {
    const { error } = await supabase
      .from('triggers').delete().eq('id', id).eq('workspace_id', workspace_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Fire Trigger ────────────────────────────────────────────────────────────
router.post('/:id/fire', requireResourceOwnership('id', 'triggers'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id, payload = {} } = req.body;

  try {
    // 1. Get trigger
    const { data: trigger, error: triggerError } = await supabase
      .from('triggers')
      .select('*, flows(id, name, flow_data)')
      .eq('id', id)
      .single();

    if (triggerError) throw triggerError;
    if (!trigger) return res.status(404).json({ error: 'Trigger not found' });
    if (trigger.status === 'inactive') return res.status(400).json({ error: 'Trigger is inactive' });

    // 2. Build enriched payload with data_mapping applied
    const mappedData = {};
    if (Array.isArray(trigger.data_mapping)) {
      for (const { key, value } of trigger.data_mapping) {
        // Resolve {{placeholders}} from incoming payload
        mappedData[key] = value?.replace(/{{(.*?)}}/g, (_, k) => payload[k.trim()] ?? '') || value;
      }
    }

    const enrichedPayload = {
      event: trigger.event_type,
      trigger_id: trigger.id,
      trigger_name: trigger.name,
      workspace_id: workspace_id,
      data: { ...payload, ...mappedData },
      fired_at: new Date().toISOString()
    };

    // 3. Log the fire event
    await supabase.from('trigger_logs').insert([{
      trigger_id: id,
      workspace_id,
      status: 'success',
      payload: enrichedPayload
    }]);

    // 4. Return enriched payload (actual flow execution handled by client or future engine)
    res.json({ success: true, payload: enrichedPayload, flow: trigger.flows || null });
  } catch (e) {
    // Log failure
    await supabase.from('trigger_logs').insert([{
      trigger_id: id,
      workspace_id,
      status: 'failed',
      error: e.message,
      payload: { raw: req.body }
    }]).catch(() => {});
    res.status(500).json({ error: e.message });
  }
});

// ─── Fire trigger by event type (called by webhooks) ─────────────────────────
export const fireTriggersByEvent = async (workspaceId, eventType, payload) => {
  try {
    const { data: triggers } = await supabase
      .from('triggers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('event_type', eventType)
      .eq('status', 'active');

    if (!triggers?.length) return;

    for (const trigger of triggers) {
      const mappedData = {};
      if (Array.isArray(trigger.data_mapping)) {
        for (const { key, value } of trigger.data_mapping) {
          mappedData[key] = value?.replace(/{{(.*?)}}/g, (_, k) => payload[k.trim()] ?? '') || value;
        }
      }

      const enrichedPayload = {
        event: eventType,
        trigger_id: trigger.id,
        trigger_name: trigger.name,
        workspace_id: workspaceId,
        data: { ...payload, ...mappedData },
        fired_at: new Date().toISOString()
      };

      await supabase.from('trigger_logs').insert([{
        trigger_id: trigger.id,
        workspace_id: workspaceId,
        status: 'success',
        payload: enrichedPayload
      }]).catch(console.error);

      console.log(`[Trigger] Fired "${trigger.name}" (${eventType}) for workspace ${workspaceId}`);
    }
  } catch (e) {
    console.error('[Trigger] fireTriggersByEvent error:', e.message);
  }
};

// ─── Get trigger logs ─────────────────────────────────────────────────────────
router.get('/:id/logs', requireResourceOwnership('id', 'triggers'), async (req, res) => {
  const { id } = req.params;
  const { workspace_id } = req.query;

  try {
    const { data, error } = await supabase
      .from('trigger_logs')
      .select('*')
      .eq('trigger_id', id)
      .eq('workspace_id', workspace_id)
      .order('fired_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Webhook endpoint: fire trigger by name ───────────────────────────────────
router.post('/webhook/:triggerName', requireWorkspaceAccess(), async (req, res) => {
  const { triggerName } = req.params;
  const { workspace_id } = req.query;
  const payload = req.body;

  if (!workspace_id) return res.status(400).json({ error: 'workspace_id required' });

  try {
    const { data: trigger } = await supabase
      .from('triggers')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('name', triggerName)
      .eq('status', 'active')
      .single();

    if (!trigger) return res.status(404).json({ error: 'No active trigger found' });

    await supabase.from('trigger_logs').insert([{
      trigger_id: trigger.id,
      workspace_id,
      status: 'success',
      payload: { event: 'webhook', data: payload, fired_at: new Date().toISOString() }
    }]);

    res.json({ success: true, trigger_name: triggerName, received: payload });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
