import express from 'express';
import axios from 'axios';
import { supabase } from '../utils/supabase.js';
import { whatsappCloudService } from '../services/whatsappCloudService.js';
import { contactsService } from '../services/contactsService.js';
import { livechatService } from '../services/livechatService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth to all non-webhook routes
router.use((req, res, next) => {
  // Webhook endpoints are public (called by WhatsApp servers)
  if (req.path === '/webhook') return next();
  return authenticate(req, res, next);
});




// Helper for sending messages via Live Chat context
const handleIncomingMessage = async (channelType, payload, io) => {
  const { externalSenderId, content, workspaceId, channelId, name } = payload;

  const contact = await contactsService.createOrUpdateContact(workspaceId, {
    channel_user_id: externalSenderId,
    channel: channelType,
    name: name,
    language: 'en',
    timezone: 'UTC'
  });

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

  const message = await livechatService.sendMessage(conversation.id, {
    sender_type: 'user',
    sender_id: contact.id,
    content: content,
    message_type: 'text'
  });

  return { conversation, message };
};


// 1. Config Endpoint (Save settings)
router.post('/config', async (req, res) => {
  try {
    const { workspaceId, phoneNumberId, wabaId, accessToken, verifyToken, apiVersion } = req.body;
    
    if (!workspaceId || !phoneNumberId || !accessToken || !verifyToken) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const credentials = {
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      access_token: accessToken,
      verify_token: verifyToken,
      api_version: apiVersion || 'v23.0'
    };

    // Upsert the channel
    const { data: channel, error } = await supabase
      .from('channels')
      .upsert({
        workspace_id: workspaceId,
        channel_type: 'whatsapp_cloud',
        channel_name: 'WhatsApp Cloud',
        external_id: phoneNumberId, // using phone number id as external id
        credentials: credentials,
        is_active: true,
        updated_at: new Date()
      }, { onConflict: 'workspace_id, channel_type, external_id' })
      .select()
      .single();

    if (error) throw error;

    await whatsappCloudService.logEvent(workspaceId, channel.id, 'api', 'success', 'Configuration updated successfully');
    
    res.json({ success: true, channel });
  } catch (error) {
    console.error('Save config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// 1.5. Exchange Token and Onboard Endpoint
router.post('/exchange-code', async (req, res) => {
  try {
    const { code, workspaceId } = req.body;
    if (!code || !workspaceId) {
       return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const fbAppId = process.env.FB_APP_ID;
    const fbAppSecret = process.env.FB_APP_SECRET;

    if (!fbAppId || !fbAppSecret) {
        throw new Error("Facebook App ID or Secret is not configured in environment variables.");
    }

    // 1. Exchange auth code for long-lived access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v23.0/oauth/access_token`, {
        params: {
            client_id: fbAppId,
            client_secret: fbAppSecret,
            code: code
        }
    });

    const accessToken = tokenResponse.data.access_token;
    
    // 2. Fetch WABA ID and Phone ID
    // In a real scenario you may need specific granular scopes or pass a token to debug_token.
    // For Embedded Signup, we query the accounts associated with the token.
    let wabaId = "fetch_waba_id_here";
    let phoneId = "fetch_phone_id_here";
    
    try {
        const waAccountsResponse = await axios.get(`https://graph.facebook.com/v23.0/me/client_whatsapp_business_accounts`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        wabaId = waAccountsResponse.data?.data?.[0]?.id || wabaId;
        
        if (wabaId !== "fetch_waba_id_here") {
            const phonesResponse = await axios.get(`https://graph.facebook.com/v23.0/${wabaId}/phone_numbers`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            phoneId = phonesResponse.data?.data?.[0]?.id || phoneId;
        }
    } catch (e) {
        console.warn("Could not fetch specific WABA automatically. You may need extra permissions.", e.response?.data);
    }

    // 3. Store the acquired details
    const credentials = {
      phone_number_id: phoneId,
      waba_id: wabaId,
      access_token: accessToken,
      verify_token: 'reflx_webhook_secret_2026', // Use existing default webhook token
      api_version: 'v23.0'
    };

    const { data: channel, error } = await supabase
      .from('channels')
      .upsert({
        workspace_id: workspaceId,
        channel_type: 'whatsapp_cloud',
        channel_name: 'WhatsApp Cloud (Embedded)',
        external_id: phoneId,
        credentials: credentials,
        is_active: true,
        updated_at: new Date()
      }, { onConflict: 'workspace_id, channel_type, external_id' })
      .select()
      .single();

    if (error) throw error;

    await whatsappCloudService.logEvent(workspaceId, channel.id, 'api', 'success', 'Embedded Signup completed successfully');

    res.json({ success: true, wabaId, phoneId, channel });
  } catch (error) {
    console.error('Exchange code error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to exchange token: ' + (error.response?.data?.error?.message || error.message) });
  }
});

// 1.6 Onboard Flowbuilder Trigger
router.post('/onboard', async (req, res) => {
    try {
        const { waba_id, phone_number_id, business_id, workspaceId } = req.body;
        // Logic to trigger Flowbuilder event 'whatsapp_cloud_onboarded'
        console.log("Triggering flowbuilder event 'whatsapp_cloud_onboarded'", { waba_id, phone_number_id, business_id });
        
        await whatsappCloudService.logEvent(workspaceId, null, 'api', 'success', 'User onboarded', { waba_id, phone_number_id, business_id });

        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// 2. Test Connection Endpoint
router.post('/test', async (req, res) => {
    try {
        const { credentials, testPhoneNumber, workspaceId } = req.body;
        
        if (!credentials || !testPhoneNumber) {
            return res.status(400).json({ success: false, error: "Missing credentials or test phone number" });
        }
        
        const result = await whatsappCloudService.testConnection(credentials, testPhoneNumber);
        
        if (workspaceId) {
           const statusMessage = result.success ? 'Connection test successful' : `Connection test failed: ${result.error}`;
           const status = result.success ? 'success' : 'failed';
           await whatsappCloudService.logEvent(workspaceId, null, 'api', status, statusMessage, result);
        }
        
        res.json(result);
    } catch(error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// 3. Status Endpoint
router.get('/status/:workspaceId', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { data: channel, error } = await supabase
            .from('channels')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('channel_type', 'whatsapp_cloud')
            .single();

        if (error || !channel) {
            return res.json({ connected: false });
        }
        
        // SECURITY: Never send raw credentials to the frontend
        res.json({ 
            connected: true, 
            channelId: channel.id,
            phoneNumberId: channel.credentials?.phone_number_id,
            wabaId: channel.credentials?.waba_id,
            apiVersion: channel.credentials?.api_version,
            lastSyncTime: channel.updated_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 4. Logs Endpoint
router.get('/logs/:workspaceId', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { data: logs, error } = await supabase
            .from('whatsapp_cloud_logs')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        
        res.json(logs || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Webhook Verification (GET)
router.get('/webhook', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const workspaceId = req.query.workspaceId;

  if (mode && token) {
    if (mode === 'subscribe') {
        let isValid = false;
        
        if (workspaceId) {
             // Look up connection
             const { data: channel } = await supabase
                .from('channels')
                .select('credentials')
                .eq('workspace_id', workspaceId)
                .eq('channel_type', 'whatsapp_cloud')
                .single();
                
             if (channel && channel.credentials && channel.credentials.verify_token === token) {
                 isValid = true;
                 await whatsappCloudService.logEvent(workspaceId, null, 'webhook', 'success', 'Webhook verified successfully');
             }
        }
        
        if (isValid) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    } else {
      res.sendStatus(403);
    }
  } else {
      res.sendStatus(400);
  }
});


// 6. Webhook Payload (POST)
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    const workspaceId = req.query.workspaceId;
    
    if (body.object === 'whatsapp_business_account' && workspaceId) {
        
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            const message = change.value.messages[0];
            const contact = change.value.contacts[0];
            const phone = message.from;
            const text = message.text ? message.text.body : '';
            
            // Get channel ID for mapping
            const { data: channel } = await supabase
                .from('channels')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('channel_type', 'whatsapp_cloud')
                .single();
            
            if (!channel) continue;

            const result = await handleIncomingMessage('whatsapp_cloud', {
              externalSenderId: phone,
              content: text,
              workspaceId: workspaceId,
              channelId: channel.id,
              name: contact.profile.name
            }, req.app.get('io'));

            // Broadcast
            req.app.get('io')?.to(`conversation:${result.conversation.id}`).emit('new_message', result.message);
            req.app.get('io')?.emit('inbox_update', { workspaceId: workspaceId });
            
            // Trigger flowbuilder event
            // Note: In real setup, you'd enqueue this or hit a flow engine
            console.log("Triggering flowbuilder event 'whatsapp_cloud_incoming' for", phone);
            
            await whatsappCloudService.logEvent(workspaceId, channel.id, 'webhook', 'success', 'Received incoming message', { phone, text });
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp Cloud Webhook Error:', error);
    if (req.query.workspaceId) {
        await whatsappCloudService.logEvent(req.query.workspaceId, null, 'webhook', 'failed', 'Webhook processing error', { error: error.message });
    }
    res.sendStatus(500);
  }
});

export default router;
