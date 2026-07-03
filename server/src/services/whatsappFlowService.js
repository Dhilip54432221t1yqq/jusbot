import axios from 'axios';
import { supabase } from '../utils/supabase.js';

export const whatsappFlowService = {
    async publishFlowToMeta(flowId, wabaId) {
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        const token = process.env.META_ACCESS_TOKEN;
        
        if (!token) throw new Error("META_ACCESS_TOKEN is missing");
        
        // 1. Get flow from DB
        const { data: flow, error } = await supabase.from('whatsapp_flows').select('*').eq('id', flowId).single();
        if (error || !flow) throw new Error("Flow not found in database");

        try {
            // 2. Create flow on Meta
            const createUrl = `https://graph.facebook.com/${version}/${wabaId}/flows`;
            const createPayload = {
                name: flow.name,
                categories: [flow.category]
            };
            
            let metaFlowId = flow.meta_flow_id;
            
            if (!metaFlowId) {
                const createRes = await axios.post(createUrl, createPayload, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                metaFlowId = createRes.data.id;
                await supabase.from('whatsapp_flows').update({ meta_flow_id: metaFlowId }).eq('id', flowId);
            }

            // 3. Upload Flow JSON as Asset
            // This requires multipart/form-data with file upload. Since it's JSON, we convert it.
            const FormData = (await import('form-data')).default;
            const formData = new FormData();
            formData.append('name', 'flow.json');
            formData.append('asset_type', 'FLOW_JSON');
            
            const jsonBuffer = Buffer.from(JSON.stringify(flow.flow_json));
            formData.append('file', jsonBuffer, { filename: 'flow.json', contentType: 'application/json' });

            const assetUrl = `https://graph.facebook.com/${version}/${metaFlowId}/assets`;
            await axios.post(assetUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });

            // 4. Publish the flow
            const publishUrl = `https://graph.facebook.com/${version}/${metaFlowId}/publish`;
            await axios.post(publishUrl, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local status
            await supabase.from('whatsapp_flows').update({ 
                status: 'PUBLISHED',
                published_at: new Date().toISOString()
            }).eq('id', flowId);

            return { success: true, metaFlowId };

        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            throw new Error(`Meta API Error: ${errMsg}`);
        }
    },

    async handleEndpointRequest(reqBody, encryptedPayload) {
        // Implement Meta's WhatsApp Flow decryption logic here based on private key
        // We will log the interaction.
        const { flow_token, action, data, screen } = reqBody; // Decrypted hypothetical
        
        let responsePayload = {};
        let nextScreen = "SUCCESS";

        if (action === "ping") {
            responsePayload = { data: { status: "active" } };
        } else if (action === "INIT") {
            // dynamic initial data
            responsePayload = {
                screen: "WELCOME",
                data: {
                    default_name: "Customer"
                }
            };
        } else if (action === "data_exchange") {
            // Process form logic
            responsePayload = {
                screen: "SUCCESS",
                data: {
                    success_msg: "Form received!"
                }
            };
        }
        
        return {
            ...responsePayload,
            // Should be encrypted back using AES/RSA as per Meta specs
        };
    }
};
