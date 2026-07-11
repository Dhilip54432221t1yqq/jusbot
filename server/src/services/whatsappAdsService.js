import axios from 'axios';
import { supabase } from '../utils/db.js';

export const whatsappAdsService = {
    async getWelcomeSequences(workspaceId, wabaId) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

        if (!token || !wabaId) throw new Error("Missing credentials or WABA ID");

        // Sync with Meta
        try {
            const url = `https://graph.facebook.com/${version}/${wabaId}/welcome_message_sequences`;
            const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
            
            const metaSequences = response.data.data || response.data; // Depending on actual Meta response structure, usually it's in data array
            
            // Sync with local DB
            if (Array.isArray(metaSequences)) {
                for (const seq of metaSequences) {
                    await supabase.from('whatsapp_welcome_sequences').upsert({
                        workspace_id: workspaceId,
                        waba_id: wabaId,
                        sequence_id: seq.sequence_id,
                        name: seq.name,
                        welcome_message_sequence_json: seq.welcome_message_sequence ? JSON.parse(seq.welcome_message_sequence) : {},
                        is_used_in_ad: seq.is_used_in_ad
                    }, { onConflict: 'sequence_id' });
                }
            }
        } catch (e) {
            console.error("Failed to sync with Meta Ads API:", e.response?.data || e.message);
            // Fallback to local
        }

        const { data, error } = await supabase.from('whatsapp_welcome_sequences')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('waba_id', wabaId);
            
        if (error) throw error;
        return data;
    },

    async createOrUpdateSequence(workspaceId, wabaId, sequenceData) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

        if (!token || !wabaId) throw new Error("Missing credentials or WABA ID");

        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        
        if (sequenceData.sequence_id) {
            formData.append('sequence_id', sequenceData.sequence_id);
        }
        
        formData.append('name', sequenceData.name);
        formData.append('welcome_message_sequence', JSON.stringify(sequenceData.welcome_message_sequence));

        const url = `https://graph.facebook.com/${version}/${wabaId}/welcome_message_sequences`;
        
        try {
            const res = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });

            // Expected response: {"sequence_id":"186473890"} or {"success": true}
            const returnedSequenceId = res.data.sequence_id || sequenceData.sequence_id;

            // Save to DB
            const { data } = await supabase.from('whatsapp_welcome_sequences').upsert({
                workspace_id: workspaceId,
                waba_id: wabaId,
                sequence_id: returnedSequenceId,
                name: sequenceData.name,
                welcome_message_sequence_json: sequenceData.welcome_message_sequence
            }, { onConflict: 'sequence_id' }).select().single();

            return { success: true, sequence: data };
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            throw new Error(`Meta API Error: ${errMsg}`);
        }
    },

    async deleteSequence(workspaceId, wabaId, sequenceId) {
        const token = process.env.META_ACCESS_TOKEN;
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';

        if (!token || !wabaId) throw new Error("Missing credentials or WABA ID");

        const url = `https://graph.facebook.com/${version}/${wabaId}/welcome_message_sequences?sequence_id=${sequenceId}`;
        
        try {
            await axios.delete(url, { headers: { 'Authorization': `Bearer ${token}` } });

            // Delete locally
            await supabase.from('whatsapp_welcome_sequences').delete().eq('sequence_id', sequenceId);

            return { success: true };
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            throw new Error(`Meta API Error: ${errMsg}`);
        }
    }
};
