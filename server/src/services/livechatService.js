import axios from 'axios';
import { supabase } from '../utils/supabase.js';

export const livechatService = {
  // Inbox / Conversations
  async getConversations(workspaceId, filters = {}) {
    let query = supabase
      .from('conversations')
      .select('*, contacts(*), agents(display_name, avatar_url)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.assigned_agent_id) {
      query = query.eq('assigned_agent_id', filters.assigned_agent_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getConversationById(conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, contacts(*), agents(display_name, avatar_url)')
      .eq('id', conversationId)
      .single();
    
    if (error) throw error;
    return data;
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
      // Add other channels like WhatsApp here...
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
