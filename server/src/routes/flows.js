import express from 'express';
import { supabase } from '../utils/supabase.js';
import { requireResourceOwnership } from '../middleware/requireResourceOwnership.js';

const router = express.Router();

// No more inline checkSession — auth is handled globally by authenticate middleware in index.js
// req.userId is set by the auth middleware

// Get flow structure (nodes and edges)
router.get('/:flowId', requireResourceOwnership('flowId', 'flows'), async (req, res) => {
  const { flowId } = req.params;
  const { version = 1 } = req.query;

  try {
    const { data: nodes, error: nodesError } = await supabase
      .from('flow_nodes')
      .select('*')
      .eq('flow_id', flowId)
      .eq('version', version);

    if (nodesError) throw nodesError;

    const { data: edges, error: edgesError } = await supabase
      .from('node_connections')
      .select('*')
      .eq('flow_id', flowId)
      .eq('version', version);

    if (edgesError) throw edgesError;

    res.json({ nodes, edges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save flow (upsert nodes and connections)
router.post('/:flowId/save', requireResourceOwnership('flowId', 'flows'), async (req, res) => {
  const { flowId } = req.params;
  const { nodes, edges, version = 1 } = req.body;

  try {
    // 1. Delete existing nodes and edges for this version
    await supabase.from('flow_nodes').delete().eq('flow_id', flowId).eq('version', version);
    await supabase.from('node_connections').delete().eq('flow_id', flowId).eq('version', version);

    // 2. Insert new nodes
    if (nodes && nodes.length > 0) {
      const nodesToInsert = nodes.map(n => ({
        flow_id: flowId,
        node_id: n.id,
        node_type: n.type,
        position_x: n.position.x,
        position_y: n.position.y,
        config_json: n.data,
        version
      }));
      const { error: nodeInsertError } = await supabase.from('flow_nodes').insert(nodesToInsert);
      if (nodeInsertError) throw nodeInsertError;
    }

    // 3. Insert new edges
    if (edges && edges.length > 0) {
      const edgesToInsert = edges.map(e => ({
        flow_id: flowId,
        source_node_id: e.source,
        source_handle: e.sourceHandle,
        target_node_id: e.target,
        target_handle: e.targetHandle,
        version
      }));
      const { error: edgeInsertError } = await supabase.from('node_connections').insert(edgesToInsert);
      if (edgeInsertError) throw edgeInsertError;
    }

    // 4. Update flows table flow_data for quick loading
    await supabase.from('flows').update({ 
      flow_data: { nodes, edges },
      updated_at: new Date().toISOString()
    }).eq('id', flowId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish flow (copy version 1 to version 2/production)
router.post('/:flowId/publish', requireResourceOwnership('flowId', 'flows'), async (req, res) => {
  const { flowId } = req.params;

  try {
    // Get current draft (version 1)
    const { data: nodes } = await supabase.from('flow_nodes').select('*').eq('flow_id', flowId).eq('version', 1);
    const { data: edges } = await supabase.from('node_connections').select('*').eq('flow_id', flowId).eq('version', 1);

    // Clear and copy to published version (using version 0 as published for simplicity)
    await supabase.from('flow_nodes').delete().eq('flow_id', flowId).eq('version', 0);
    await supabase.from('node_connections').delete().eq('flow_id', flowId).eq('version', 0);

    if (nodes?.length) {
      const publishedNodes = nodes.map(n => ({ ...n, id: undefined, version: 0, created_at: undefined, updated_at: undefined }));
      await supabase.from('flow_nodes').insert(publishedNodes);
    }
    if (edges?.length) {
      const publishedEdges = edges.map(e => ({ ...e, id: undefined, version: 0, created_at: undefined }));
      await supabase.from('node_connections').insert(publishedEdges);
    }

    await supabase.from('flows').update({ 
      status: 'published',
      published_at: new Date().toISOString()
    }).eq('id', flowId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
