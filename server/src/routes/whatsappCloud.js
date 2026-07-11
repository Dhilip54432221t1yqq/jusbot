import express from 'express';
import axios from 'axios';
import { supabase } from '../utils/db.js';
import { whatsappCloudService } from '../services/whatsappCloudService.js';
import { contactsService } from '../services/contactsService.js';
import { livechatService } from '../services/livechatService.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { enqueueWebhook } from '../utils/queue.js';
import { getIO } from '../services/socketService.js';
import { flowExecutionService } from '../services/flowExecutionService.js';

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
    const { code, workspaceId, wabaId: bodyWabaId, phoneId: bodyPhoneId } = req.body;
    if (!code || !workspaceId) {
       return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const fbAppId = process.env.FB_APP_ID;
    const fbAppSecret = process.env.FB_APP_SECRET;

    if (!fbAppId || !fbAppSecret) {
        throw new Error("Facebook App ID or Secret is not configured in environment variables.");
    }

    // 1. Exchange auth code for long-lived access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v25.0/oauth/access_token`, {
        params: {
            client_id: fbAppId,
            client_secret: fbAppSecret,
            code: code
        }
    });

    const accessToken = tokenResponse.data.access_token;
    
    // 2. Fetch WABA ID and Phone ID (or use passed ones)
    let wabaId = bodyWabaId || "fetch_waba_id_here";
    let phoneId = bodyPhoneId || "fetch_phone_id_here";
    
    if (wabaId === "fetch_waba_id_here" || phoneId === "fetch_phone_id_here") {
        try {
            const waAccountsResponse = await axios.get(`https://graph.facebook.com/v25.0/me/client_whatsapp_business_accounts`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const fetchedWaba = waAccountsResponse.data?.data?.[0]?.id;
            if (fetchedWaba) {
                if (wabaId === "fetch_waba_id_here") wabaId = fetchedWaba;
                
                const phonesResponse = await axios.get(`https://graph.facebook.com/v25.0/${wabaId}/phone_numbers`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const fetchedPhone = phonesResponse.data?.data?.[0]?.id;
                if (fetchedPhone && phoneId === "fetch_phone_id_here") {
                    phoneId = fetchedPhone;
                }
            }
        } catch (e) {
            console.warn("Could not fetch specific WABA automatically. You may need extra permissions.", e.response?.data || e.message);
        }
    }

    // 3. Store the acquired details
    const credentials = {
      phone_number_id: phoneId,
      waba_id: wabaId,
      access_token: accessToken,
      verify_token: 'reflx_webhook_secret_2026', // Use existing default webhook token
      api_version: 'v25.0'
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

        const fbAppId = process.env.FB_APP_ID || '1336518974614294';
        const fbConfigId = process.env.FB_CONFIG_ID || '';

        if (error || !channel) {
            return res.json({ connected: false, fbAppId, fbConfigId });
        }
        
        // SECURITY: Never send raw credentials to the frontend
        res.json({ 
            connected: true, 
            channelId: channel.id,
            phoneNumberId: channel.credentials?.phone_number_id,
            wabaId: channel.credentials?.waba_id,
            apiVersion: channel.credentials?.api_version,
            lastSyncTime: channel.updated_at,
            isBotLinked: channel.credentials?.is_bot_linked || false,
            isOpenBot: channel.credentials?.is_open_bot || false,
            isAccountActive: channel.is_active,
            fbAppId,
            fbConfigId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 3.5 Settings Endpoint (Toggle features)
router.put('/settings', async (req, res) => {
    try {
        const { workspaceId, isAccountActive, isBotLinked, isOpenBot } = req.body;
        
        if (!workspaceId) {
            return res.status(400).json({ success: false, error: 'Missing workspaceId' });
        }

        const { data: channel, error: fetchError } = await supabase
            .from('channels')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('channel_type', 'whatsapp_cloud')
            .single();

        if (fetchError || !channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        const newCredentials = { ...channel.credentials };
        if (isBotLinked !== undefined) newCredentials.is_bot_linked = isBotLinked;
        if (isOpenBot !== undefined) newCredentials.is_open_bot = isOpenBot;

        const updateData = { credentials: newCredentials, updated_at: new Date() };
        if (isAccountActive !== undefined) updateData.is_active = isAccountActive;

        const { error: updateError } = await supabase
            .from('channels')
            .update(updateData)
            .eq('id', channel.id);

        if (updateError) throw updateError;

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3.6 Disconnect Endpoint
router.delete('/disconnect/:workspaceId', async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { error } = await supabase
            .from('channels')
            .delete()
            .eq('workspace_id', workspaceId)
            .eq('channel_type', 'whatsapp_cloud');

        if (error) throw error;
        res.json({ success: true });
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
        
        // 1. Global App-Level Verification (Meta Dashboard)
        if (!workspaceId && (token === process.env.WEBHOOK_VERIFY_TOKEN || token === 'reflx_webhook_secret_2026' || token === 'reflx_instagram_secret_2026')) {
            isValid = true;
        } 
        // 2. Workspace-Level Verification
        else if (workspaceId) {
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


export const processWhatsAppWebhook = async (body, workspaceId) => {
  if (body.object === 'whatsapp_business_account' && workspaceId) {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          const message = change.value.messages[0];
          const contact = change.value.contacts[0];
          const phone = message.from;
          
          let text = '';
          let buttonId = null;

          if (message.type === 'text') {
            text = message.text?.body || '';
          } else if (message.type === 'interactive') {
            if (message.interactive?.type === 'button_reply') {
              text = message.interactive.button_reply?.title || '';
              buttonId = message.interactive.button_reply?.id || null;
            } else if (message.interactive?.type === 'list_reply') {
              text = message.interactive.list_reply?.title || '';
              buttonId = message.interactive.list_reply?.id || null;
            }
          } else if (message.type === 'button') {
            text = message.button?.text || '';
            buttonId = message.button?.payload || null;
          }

          const { data: channel } = await supabase
              .from('channels')
              .select('id')
              .eq('workspace_id', workspaceId)
              .eq('channel_type', 'whatsapp_cloud')
              .single();
          
          if (!channel) continue;

          const result = await handleIncomingMessage('whatsapp_cloud', {
            externalSenderId: phone,
            content: text || '[Interactive Response]',
            workspaceId: workspaceId,
            channelId: channel.id,
            name: contact.profile?.name || `WhatsApp User ${phone}`
          });

          const io = getIO();
          io?.to(`conversation:${result.conversation.id}`).emit('new_message', result.message);
          io?.emit('inbox_update', { workspaceId: workspaceId });
          
          console.log("Triggering flowbuilder event 'whatsapp_cloud_incoming' for", phone);
          await whatsappCloudService.logEvent(workspaceId, channel.id, 'webhook', 'success', 'Received incoming message', { phone, text });

          // Run the message through the flow execution engine
          await flowExecutionService.handleIncomingMessage(workspaceId, result.conversation.contact_id, text, { buttonId });
        } else if (change.field === 'message_template_status_update') {
          const { event, message_template_id, reason } = change.value;
          let newStatus = 'Unknown';
          if (event === 'APPROVED') newStatus = 'Approved';
          else if (event === 'REJECTED') newStatus = 'Rejected';
          else if (event === 'PENDING') newStatus = 'In Review';
          else if (event === 'PAUSED' || event === 'DISABLED' || event === 'FLAGGED') newStatus = 'Paused';

          if (message_template_id) {
            await supabase.from('whatsapp_templates')
              .update({ status: newStatus, rejection_reason: reason || null })
              .eq('meta_template_id', message_template_id);
            
            console.log(`Updated template ${message_template_id} status to ${newStatus}`);
          }
        }
      }
    }
  }
};

// 6. Webhook Payload (POST)
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    const workspaceId = req.query.workspaceId;
    
    // Add to queue and return 200 immediately to WhatsApp
    await enqueueWebhook('whatsapp_cloud', { body, workspaceId });
    
    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp Cloud Webhook Enqueue Error:', error);
    res.sendStatus(500);
  }
});

export default router;
