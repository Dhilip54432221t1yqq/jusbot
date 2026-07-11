import axios from 'axios';
import { supabase } from '../utils/db.js';
import { whatsappCloudService } from './whatsappCloudService.js';

export const livechatService = {
  // Inbox / Conversations
  async getConversations(workspaceId, filters = {}) {
    let query = supabase
      .from('conversations')
      .select('*, contacts(*)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.assigned_agent_id) {
      query = query.eq('assigned_agent_id', filters.assigned_agent_id);
    }
    
    if (filters.channel && filters.channel !== 'all') {
      query = query.eq('channel_type', filters.channel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getConversationById(conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, contacts(*)')
      .eq('id', conversationId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async findOrCreateConversation(workspaceId, contactId, channelType = 'whatsapp') {
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*, contacts(*)')
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contactId)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (!findError && existing && existing.length > 0) {
      return existing[0];
    }
    
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{
        workspace_id: workspaceId,
        contact_id: contactId,
        channel_type: channelType,
        status: 'open',
        last_message: '',
        last_message_at: new Date()
      }])
      .select('*, contacts(*)')
      .single();
      
    if (createError) throw createError;
    return newConv;
  },

  async updateConversationStatus(conversationId, status) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ status, updated_at: new Date() })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async assignConversation(conversationId, agentId) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        assigned_agent_id: agentId, 
        status: 'open',
        updated_at: new Date() 
      })
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Messages
  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async sendMessage(conversationId, messageData) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, channels(*)')
      .eq('id', conversationId)
      .single();

    if (!conversation) throw new Error('Conversation not found');

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_type: messageData.sender_type,
        sender_id: messageData.sender_id,
        message_type: messageData.message_type || 'text',
        content: messageData.content,
        attachments: messageData.attachments || [],
        metadata: messageData.metadata || {},
        status: 'sent'
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Trigger external channel APIs if sent by agent
    if (messageData.sender_type === 'agent') {
      if (conversation.channel_type === 'instagram' && conversation.channels?.credentials?.page_access_token) {
        try {
          // Instagram Graph API call
          await axios.post(
            `https://graph.facebook.com/v19.0/${conversation.channels.external_id}/messages`,
            {
              recipient: { id: conversation.metadata?.instagram_user_id || conversation.contacts?.instagram_user_id },
              message: { text: messageData.content },
              tag: 'HUMAN_AGENT'
            },
            {
              params: { access_token: conversation.channels.credentials.page_access_token }
            }
          );
        } catch (err) {
          console.error('Failed to send Instagram message:', err.response?.data || err.message);
          // Optional: Mark message as failed in DB
        }
      }
      
      if (conversation.channel_type === 'whatsapp_cloud' && conversation.channels?.credentials) {
        try {
          const recipientPhone = conversation.contacts?.channel_user_id || conversation.contacts?.phone;
          if (recipientPhone) {
            const waResult = await whatsappCloudService.sendMessage(
              conversation.channels.credentials, 
              recipientPhone, 
              messageData.content
            );
            
            if (!waResult.success) {
              console.error('Failed to send WhatsApp message:', waResult.error);
            }
          }
        } catch (err) {
          console.error('Exception sending WhatsApp message:', err.message);
        }
      }
      // Add other channels here...
    }

    // Update conversation last message
    await supabase.from('conversations').update({
      last_message: messageData.content,
      last_message_at: new Date(),
      updated_at: new Date()
    }).eq('id', conversationId);

    return data;
  },

  // Contacts
  async getContactDetails(contactId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Tags
  async getConversationTags(conversationId) {
    const { data, error } = await supabase
      .from('conversation_tags')
      .select('tag_id, tags(name)')
      .eq('conversation_id', conversationId);
    
    if (error) throw error;
    return data;
  },

  async addTagToConversation(conversationId, tagId) {
    const { error } = await supabase
      .from('conversation_tags')
      .insert([{ conversation_id: conversationId, tag_id: tagId }]);
    
    if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
    return true;
  },

  async removeTagFromConversation(conversationId, tagId) {
    const { error } = await supabase
      .from('conversation_tags')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('tag_id', tag_id);
    
    if (error) throw error;
    return true;
  }
};
