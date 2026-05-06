import { supabase } from '../utils/supabase.js';
import { igService } from './igService.js';

export const webhookService = {
  /**
   * Handle incoming Instagram webhook events
   */
  async handleInstagramEvent(payload) {
    if (payload.object !== 'instagram') return;

    for (const entry of payload.entry) {
      const igUserId = entry.id;
      
      for (const change of entry.changes) {
        const field = change.field;
        const value = change.value;

        // Log the event
        await this.logWebhookEvent(igUserId, field, value);

        if (field === 'comments') {
          await this.handleComment(igUserId, value);
        } else if (field === 'mentions') {
          await this.handleMention(igUserId, value);
        } else if (field === 'messages') {
          // Instagram Direct Messages handled via 'messages' field
          await this.handleMessage(igUserId, value);
        }
      }
    }
  },

  /**
   * Log webhook events for debugging and audit
   */
  async logWebhookEvent(igUserId, eventType, payload) {
    try {
      // Find workspace_id from igUserId
      const { data: account } = await supabase
        .from('instagram_accounts')
        .select('workspace_id')
        .eq('ig_user_id', igUserId)
        .single();

      if (account) {
        await supabase.from('instagram_logs').insert({
          workspace_id: account.workspace_id,
          event_type: eventType,
          payload: payload
        });
      }
    } catch (error) {
      console.error('Error logging webhook event:', error);
    }
  },

  /**
   * Handle new comments
   */
  async handleComment(igUserId, comment) {
    const { id: commentId, text, media_id: mediaId, from } = comment;
    
    // 1. Store comment in DB
    await supabase.from('instagram_comments').upsert({
      ig_user_id: igUserId,
      media_id: mediaId,
      comment_id: commentId,
      text: text,
      username: from.username,
      timestamp: new Date()
    }, { onConflict: 'comment_id' });

    // 2. Trigger Automations
    await this.triggerAutomations(igUserId, 'comment_keyword', {
      commentId,
      text,
      mediaId,
      username: from.username
    });
  },

  /**
   * Handle mentions
   */
  async handleMention(igUserId, mention) {
    // Mentions logic
    await this.triggerAutomations(igUserId, 'mention', mention);
  },

  /**
   * Handle direct messages
   */
  async handleMessage(igUserId, message) {
    // Direct messages logic
    await this.triggerAutomations(igUserId, 'direct_message', message);
  },

  /**
   * Automation Engine Logic
   */
  async triggerAutomations(igUserId, triggerType, data) {
    try {
      // 1. Fetch active rules for this account and trigger type
      const { data: rules } = await supabase
        .from('instagram_automations')
        .select('*')
        .eq('ig_user_id', igUserId)
        .eq('trigger_type', triggerType)
        .eq('is_active', true);

      if (!rules || rules.length === 0) return;

      // 2. Fetch Access Token
      const { data: tokenData } = await supabase
        .from('instagram_tokens')
        .select('access_token')
        .eq('ig_user_id', igUserId)
        .single();

      if (!tokenData) return;

      const accessToken = tokenData.access_token;

      // 3. Process rules
      for (const rule of rules) {
        let shouldTrigger = false;

        if (triggerType === 'comment_keyword') {
          // Check if keyword matches (case insensitive)
          if (!rule.keyword || data.text.toLowerCase().includes(rule.keyword.toLowerCase())) {
            shouldTrigger = true;
          }
        } else {
          // For mentions and DMs, trigger based on general rule
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Execute Actions
          if (triggerType === 'comment_keyword') {
            // Public Reply
            await igService.replyToComment(data.commentId, rule.response_text, accessToken);
            
            // Private Reply (if configured per user request "When user comments -> send DM automatically")
            // We can add a flag to the rule for this, but for now we'll assume response_text can also be sent via DM
            await igService.sendPrivateReply(data.commentId, `Hi @${data.username}! ${rule.response_text}`, accessToken);
            
            // Mark as replied
            await supabase.from('instagram_comments')
              .update({ replied: true })
              .eq('comment_id', data.commentId);
          }
        }
      }
    } catch (error) {
      console.error('Automation trigger error:', error);
    }
  }
};

export default webhookService;
