import axios from 'axios';
import { supabase } from '../utils/supabase.js';



export const whatsappCloudService = {
  /**
   * Log an event to the WhatsApp Cloud logs table
   */
  async logEvent(workspaceId, channelId, eventType, status, message, details = {}) {
    try {
      if (!workspaceId) return;

      await supabase.from('whatsapp_cloud_logs').insert([{
        workspace_id: workspaceId,
        channel_id: channelId,
        event_type: eventType,
        status,
        message,
        details
      }]);
    } catch (error) {
      console.error('Failed to log WhatsApp Cloud event:', error);
    }
  },

  /**
   * Send a test message to verify the connection
   */
  async testConnection(credentials, testPhoneNumber) {
    try {
      const { phone_number_id, access_token, api_version = 'v23.0' } = credentials;
      
      const response = await axios.post(
        `https://graph.facebook.com/${api_version}/${phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: testPhoneNumber,
          type: 'text',
          text: {
            body: 'Test message from Live Chat (WhatsApp Cloud connection successful)'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
       return { 
         success: false, 
         error: error.response?.data?.error?.message || error.message 
       };
    }
  },

  /**
   * Send a standard text message
   */
  async sendMessage(credentials, to, messageText) {
      try {
        const { phone_number_id, access_token, api_version = 'v23.0' } = credentials;
        
        const response = await axios.post(
          `https://graph.facebook.com/${api_version}/${phone_number_id}/messages`,
          {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
              body: messageText
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return { success: true, data: response.data };
      } catch (error) {
         return { 
           success: false, 
           error: error.response?.data?.error?.message || error.message 
         };
      }
  }
};
