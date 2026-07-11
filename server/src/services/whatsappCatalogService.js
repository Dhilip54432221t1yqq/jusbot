import axios from 'axios';
import { supabase } from '../utils/db.js';

export const whatsappCatalogService = {
    async getSettings(workspaceId) {
        let { data, error } = await supabase.from('whatsapp_catalog_settings').select('*').eq('workspace_id', workspaceId).single();
        if (!data) {
            const defaults = { workspace_id: workspaceId, enabled: false };
            const res = await supabase.from('whatsapp_catalog_settings').insert([defaults]).select().single();
            data = res.data;
        }
        return data;
    },

    async updateSettings(workspaceId, payload) {
        const { data, error } = await supabase.from('whatsapp_catalog_settings').update(payload).eq('workspace_id', workspaceId).select().single();
        if (error) throw new Error(error.message);
        return data;
    },

    async syncProductToWhatsAppCatalog(workspaceId, internalProductId, catalogId, productData) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        
        if (!token) throw new Error("META_ACCESS_TOKEN missing");

        try {
            // Note: productData would come from the ecommerce system. 
            // In a real integration we fetch internal product and format for Meta Commerce API.
            const metaPayload = {
                retailer_id: productData.sku || internalProductId,
                name: productData.name,
                description: productData.description || ' ',
                availability: productData.stock > 0 ? 'in stock' : 'out of stock',
                condition: 'new',
                price: Math.round(productData.price * 100),
                currency: productData.currency || 'USD',
                url: productData.url || 'http://example.com/product',
                image_url: productData.image_url || 'http://example.com/image.jpg'
            };

            // Call Meta API (Mocked endpoint structure)
            const url = `https://graph.facebook.com/${version}/${catalogId}/products`;
            const res = await axios.post(url, metaPayload, { headers: { 'Authorization': `Bearer ${token}` } });
            
            const metaItemId = res.data.id;

            // Upsert mapping
            const { data } = await supabase.from('whatsapp_catalog_product_mappings').upsert({
                workspace_id: workspaceId,
                internal_product_id: internalProductId,
                catalog_id: catalogId,
                meta_catalog_item_id: metaItemId,
                product_retailer_id: metaPayload.retailer_id,
                sync_status: 'synced',
                availability: metaPayload.availability,
                last_sync_payload: metaPayload,
                last_sync_response: res.data,
                last_synced_at: new Date().toISOString()
            }, { onConflict: 'workspace_id, internal_product_id' }).select().single();

            // Log
            await this.logCatalogSyncResult(workspaceId, internalProductId, 'SYNC', 'SUCCESS', metaPayload, res.data);

            return data;
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            await supabase.from('whatsapp_catalog_product_mappings').upsert({
                workspace_id: workspaceId,
                internal_product_id: internalProductId,
                sync_status: 'sync_failed',
                rejection_reason: errMsg
            }, { onConflict: 'workspace_id, internal_product_id' });
            
            await this.logCatalogSyncResult(workspaceId, internalProductId, 'SYNC', 'FAILED', null, null, 'API_ERROR', errMsg);
            throw new Error(`Catalog Sync Error: ${errMsg}`);
        }
    },

    async logCatalogSyncResult(workspaceId, productId, action, status, req, res, code, msg) {
        await supabase.from('whatsapp_catalog_sync_logs').insert([{
            workspace_id: workspaceId,
            internal_product_id: productId,
            action, status, request_payload: req, response_payload: res, error_code: code, error_message: msg
        }]);
    },

    async sendCatalogMessage(workspaceId, to, catalogId) {
        // Send a message containing a catalog entry point
        const token = process.env.META_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "catalog_message",
                body: { text: "Check out our catalog!" },
                action: { name: "catalog_message", parameters: { thumbnail_product_retailer_id: "" } } // Needs a featured product or omit
            }
        };
        // Needs proper parameterizing based on Meta docs
        const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
        const res = await axios.post(url, payload, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.data;
    },

    async sendSingleProductMessage(workspaceId, to, catalogId, productRetailerId) {
        const token = process.env.META_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "product",
                body: { text: "Here is the product you requested." },
                action: { catalog_id: catalogId, product_retailer_id: productRetailerId }
            }
        };
        
        const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
        const res = await axios.post(url, payload, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.data;
    },

    async sendMultiProductMessage(workspaceId, to, catalogId, sections) {
        const token = process.env.META_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "product_list",
                header: { type: "text", text: "Our Products" },
                body: { text: "Browse our latest collection." },
                action: { catalog_id: catalogId, sections: sections }
            }
        };
        
        const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
        const res = await axios.post(url, payload, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.data;
    }
};
