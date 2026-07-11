import axios from 'axios';
import { supabase } from '../utils/db.js';

export const whatsappMarketingMessagesService = {
    async getMarketingApiSettings(workspaceId) {
        let { data, error } = await supabase.from('whatsapp_marketing_settings').select('*').eq('workspace_id', workspaceId).single();
        if (!data) {
            const defaultSettings = {
                workspace_id: workspaceId,
                enabled: false,
                default_product_policy: 'CLOUD_API_FALLBACK',
                default_message_activity_sharing: 'default',
                disable_marketing_messages_on_cloud_api: false
            };
            const res = await supabase.from('whatsapp_marketing_settings').insert([defaultSettings]).select().single();
            data = res.data;
        }
        return data;
    },

    async updateMarketingApiSettings(workspaceId, payload) {
        const { data, error } = await supabase.from('whatsapp_marketing_settings').update(payload).eq('workspace_id', workspaceId).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async checkMarketingPrerequisites(workspaceId) {
        // Pseudo check of Meta requirements
        const settings = await this.getMarketingApiSettings(workspaceId);
        
        // Example logic
        const hasWaba = !!settings.waba_id || !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        const hasPhoneId = !!settings.phone_number_id || !!process.env.WHATSAPP_PHONE_NUMBER_ID;
        const hasToken = !!process.env.META_ACCESS_TOKEN;
        
        const { count: templateCount } = await supabase.from('whatsapp_templates')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('category', 'marketing')
            .eq('status', 'Approved');

        return {
            waba_exists: hasWaba ? 'Complete' : 'Missing',
            phone_registered: hasPhoneId ? 'Complete' : 'Missing',
            token_valid: hasToken ? 'Complete' : 'Missing',
            marketing_templates_exist: templateCount > 0 ? 'Complete' : 'Warning',
            onboarding_completed: settings.onboarding_status === 'completed' ? 'Complete' : 'Warning'
        };
    },

    async setCloudApiMarketingDisabled(wabaId, disable) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        
        if (!token) throw new Error("META_ACCESS_TOKEN missing");
        
        const url = `https://graph.facebook.com/${version}/${wabaId}`;
        const res = await axios.post(url, {
            disable_marketing_messages_on_cloud_api: disable
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.data;
    },

    async getCloudApiMarketingDisabledStatus(wabaId) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        
        const url = `https://graph.facebook.com/${version}/${wabaId}?fields=disable_marketing_messages_on_cloud_api`;
        const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.data;
    },

    async sendMarketingTemplateMessage(payload) {
        const { to, recipient, templateName, languageCode, components, productPolicy, messageActivitySharing } = payload;
        
        const token = process.env.META_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        
        if (!token || !phoneId) throw new Error("Missing Meta credentials");

        // Prefer phone number over BSUID
        const reqPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode || 'en_US' },
                components: components || []
            }
        };

        if (to) {
            reqPayload.to = to;
        } else if (recipient) {
            reqPayload.recipient = recipient; // BSUID
        } else {
            throw new Error("Must provide 'to' (phone) or 'recipient' (BSUID)");
        }

        if (productPolicy) reqPayload.product_policy = productPolicy;
        if (messageActivitySharing !== undefined && messageActivitySharing !== 'default') {
            reqPayload.message_activity_sharing = messageActivitySharing === 'true' || messageActivitySharing === true;
        }

        const url = `https://graph.facebook.com/${version}/${phoneId}/marketing_messages`;
        
        try {
            const res = await axios.post(url, reqPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data;
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            throw new Error(`Meta API Error: ${errMsg}`);
        }
    },
    
    async logMarketingMessageSend(workspaceId, logData) {
        await supabase.from('whatsapp_marketing_message_logs').insert([
            { ...logData, workspace_id: workspaceId }
        ]);
    },

    async updateMarketingMessageStatusFromWebhook(messageId, status, pricing, origin) {
        let sentVia = 'UNKNOWN';
        if (pricing?.category === 'marketing_lite' && origin?.type === 'marketing_lite') {
            sentVia = 'MM_API';
        } else if (pricing?.category === 'marketing') {
            sentVia = 'CLOUD_API';
        }

        const updateData = { status, pricing_category: pricing?.category, conversation_origin_type: origin?.type };
        if (sentVia !== 'UNKNOWN') updateData.sent_via = sentVia;
        
        if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
        if (status === 'read') updateData.read_at = new Date().toISOString();
        if (status === 'failed') updateData.failed_at = new Date().toISOString();
        if (status === 'sent') updateData.sent_at = new Date().toISOString();
        
        await supabase.from('whatsapp_marketing_message_logs').update(updateData).eq('meta_message_id', messageId);
    },

    async getWabaCreativeOptimizationSettings(wabaId) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        
        // This is a theoretical endpoint structure for retrieving waba-level features
        const url = `https://graph.facebook.com/${version}/${wabaId}?fields=creative_features_spec`;
        
        try {
            const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            return res.data;
        } catch(e) { return null; }
    }
};
