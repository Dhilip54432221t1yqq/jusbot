import express from 'express';
import { livechatService } from '../services/livechatService.js';
import { requireWorkspaceAccess } from '../middleware/requireWorkspaceAccess.js';
import { requireResourceOwnership } from '../middleware/requireResourceOwnership.js';

const router = express.Router();

// Get all conversations for a workspace
router.get('/:workspaceId/conversations', requireWorkspaceAccess(), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { status, agentId } = req.query;
    const conversations = await livechatService.getConversations(workspaceId, { status, assigned_agent_id: agentId });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single conversation
router.get('/conversations/:id', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await livechatService.getConversationById(id);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update conversation status
router.patch('/conversations/:id/status', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await livechatService.updateConversationStatus(id, status);
    
    // Notify via Socket.io (this will be handled by the controller/service layer later)
    req.app.get('io')?.to(`conversation:${id}`).emit('conversation_status_changed', updated);
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign conversation
router.patch('/conversations/:id/assign', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const updated = await livechatService.assignConversation(id, agentId);
    
    req.app.get('io')?.to(`conversation:${id}`).emit('conversation_assigned', updated);
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await livechatService.getMessages(id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/conversations/:id/messages', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id } = req.params;
    const messageData = req.body;
    const message = await livechatService.sendMessage(id, messageData);
    
    // Real-time broadcast
    req.app.get('io')?.to(`conversation:${id}`).emit('new_message', message);
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tags management
router.post('/conversations/:id/tags', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tagId } = req.body;
    await livechatService.addTagToConversation(id, tagId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/conversations/:id/tags/:tagId', requireResourceOwnership('id', 'conversations'), async (req, res) => {
  try {
    const { id, tagId } = req.params;
    await livechatService.removeTagFromConversation(id, tagId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
