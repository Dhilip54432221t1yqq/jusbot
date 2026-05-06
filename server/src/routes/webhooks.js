import express from 'express';
import { supabase } from '../utils/supabase.js';
import { livechatService } from '../services/livechatService.js';
import { contactsService } from '../services/contactsService.js';
import { fireTriggersByEvent } from './triggers.js';
import { processAutomation } from '../services/automationService.js';

const router = express.Router();


// Unified webhook handler
const handleIncomingMessage = async (channelType, payload) => {
  const io = router.get('io'); // Will be set via app.get('io')

  // This is a generic handler, specific mappings should be done per channel
  const { externalSenderId, content, workspaceId, channelId, name, avatarUrl } = payload;

  // 1. Find or create contact
  const contact = await contactsService.createOrUpdateContact(workspaceId, {
    channel_user_id: externalSenderId,
    channel: channelType,
    name: name,
    avatar_url: avatarUrl,
    language: payload.language || 'en',
    timezone: payload.timezone || 'UTC'
  });

  // 2. Find or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('contact_id', contact.id)
    .eq('channel_type', channelType)
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: newConversation } = await supabase
      .from('conversations')
      .insert([{
        workspace_id: workspaceId,
        contact_id: contact.id,
        channel_id: channelId,
        channel_type: channelType,
        status: 'open',
        last_message: content,
        last_message_at: new Date()
      }])
      .select()
      .single();
    conversation = newConversation;
  }

  // 3. Save message
  const message = await livechatService.sendMessage(conversation.id, {
    sender_type: 'user',
    sender_id: contact.id,
    content: content,
    message_type: 'text'
  });

  // 4. Real-time broadcast
  // We need to access io from the app
  return { conversation, message };
};

const handleBotHandoff = async (conversationId, workspaceId) => {
  const { data: conversation } = await supabase
    .from('conversations')
    .update({ 
      status: 'waiting_for_agent',
      updated_at: new Date()
    })
    .eq('id', conversationId)
    .select()
    .single();

  const message = await livechatService.sendMessage(conversationId, {
    sender_type: 'bot',
    content: "An agent will respond shortly.",
    message_type: 'text'
  });

  return { conversation, message };
};

// WhatsApp Webhook
router.post('/whatsapp', async (req, res) => {
  try {
    // Basic verification and mapping for WhatsApp Cloud API
    const body = req.body;
    
    // Check if it's a message event
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            const message = change.value.messages[0];
            const contact = change.value.contacts[0];
            const phone = message.from;
            const text = message.text ? message.text.body : '';
            
            const result = await handleIncomingMessage('whatsapp', {
              externalSenderId: phone,
              content: text,
              workspaceId: req.query.workspaceId, // Passed in webhook URL
              channelId: req.query.channelId,
              name: contact.profile.name
            });

            req.app.get('io')?.to(`conversation:${result.conversation.id}`).emit('new_message', result.message);
            req.app.get('io')?.emit('inbox_update', { workspaceId: req.query.workspaceId });

            // Fire matching triggers
            await fireTriggersByEvent(req.query.workspaceId, 'whatsapp_incoming', {
              phone, text, contact_name: contact.profile.name,
              message_id: message.id, conversation_id: result.conversation?.id
            });

            // Process Keyword Automation & Default Reply
            const automationMatch = await processAutomation(req.query.workspaceId, text, result.conversation?.contact_id);
            if (automationMatch) {
                // Here we would trigger the flow engine
                // console.log('Automation triggered flow:', automationMatch.flow_id);
            }
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    res.sendStatus(500);
  }
});

// Instagram DM Webhook
router.post('/instagram', async (req, res) => {
  try {
    const body = req.body;
    
    // Check if it's an instagram message event
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        for (const messaging of entry.messaging) {
          if (messaging.message) {
            const senderId = messaging.sender.id;
            const recipientId = messaging.recipient.id; // Page ID
            const message = messaging.message;
            const text = message.text || '';
            const attachments = message.attachments || [];

            // 1. Find the channel for this recipientId
            const { data: channel } = await supabase
              .from('channels')
              .select('*')
              .eq('external_id', recipientId)
              .eq('channel_type', 'instagram')
              .single();

            if (channel) {
              const result = await handleIncomingMessage('instagram', {
                externalSenderId: senderId,
                content: text,
                workspaceId: channel.workspace_id,
                channelId: channel.id,
                name: `Instagram User ${senderId}`, // Display name can be fetched via API later
                avatarUrl: null,
                attachments: attachments
              });

              req.app.get('io')?.to(`conversation:${result.conversation.id}`).emit('new_message', result.message);
              req.app.get('io')?.emit('inbox_update', { workspaceId: channel.workspace_id });

              // Fire matching triggers
              await fireTriggersByEvent(channel.workspace_id, 'instagram_incoming', {
                sender_id: senderId, text, channel_id: channel.id,
                conversation_id: result.conversation?.id
              });

              // Process Keyword Automation & Default Reply
              const automationMatch = await processAutomation(channel.workspace_id, text, result.conversation?.contact_id);
              if (automationMatch) {
                  // Trigger flow engine
              }
            }
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Instagram Webhook Error:', error);
    res.sendStatus(500);
  }
});

// FB Messenger Webhook
router.post('/facebook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const workspaceId = req.query.workspaceId;
        for (const messaging of (entry.messaging || [])) {
          if (messaging.message) {
            const senderId = messaging.sender.id;
            const recipientId = messaging.recipient.id;
            const text = messaging.message.text || '';

            // Find channel by page ID
            const { data: channel } = await supabase
              .from('channels').select('*')
              .eq('external_id', recipientId).eq('channel_type', 'facebook').single();

            if (channel) {
              const result = await handleIncomingMessage('facebook', {
                externalSenderId: senderId, content: text,
                workspaceId: channel.workspace_id, channelId: channel.id,
                name: `Facebook User ${senderId}`
              });

              req.app.get('io')?.to(`conversation:${result.conversation?.id}`).emit('new_message', result.message);
              req.app.get('io')?.emit('inbox_update', { workspaceId: channel.workspace_id });

              // Fire matching triggers
              await fireTriggersByEvent(channel.workspace_id, 'facebook_incoming', {
                sender_id: senderId, text, channel_id: channel.id,
                conversation_id: result.conversation?.id
              });

              // Process Keyword Automation & Default Reply
              const automationMatch = await processAutomation(channel.workspace_id, text, result.conversation?.contact_id);
              if (automationMatch) {
                  // Trigger flow engine
              }
            }
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Facebook Webhook Error:', error);
    res.sendStatus(500);
  }
});

// Verification for Webhooks (Applies to FB/IG/WhatsApp)
router.get(['/whatsapp', '/instagram', '/facebook'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

export default router;
