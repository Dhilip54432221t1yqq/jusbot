import axios from 'axios';
import { supabase } from '../utils/supabase.js';

export const whatsappTemplateService = {
    async createLocalTemplate(data) {
        const { data: result, error } = await supabase.from('whatsapp_templates').insert([data]).select().single();
        if (error) throw error;
        return result;
    },

    async updateLocalTemplate(id, data) {
        const { data: result, error } = await supabase.from('whatsapp_templates').update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    },

    async duplicateTemplate(id, newName) {
        const { data: tmpl, error } = await supabase.from('whatsapp_templates').select('*').eq('id', id).single();
        if (error) throw error;
        const { id: _, created_at, updated_at, ...rest } = tmpl;
        rest.name = newName;
        rest.status = 'Draft';
        return this.createLocalTemplate(rest);
    },

    async deleteLocalTemplate(id) {
        const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    validateTemplatePayload(templateData) {
        if (!templateData.name || !templateData.category || !templateData.language) {
            throw new Error("Missing required fields: name, category, language");
        }
        if (!templateData.components || templateData.components.length === 0) {
            throw new Error("Template must have at least one component (BODY)");
        }
        return true;
    },

    buildMetaTemplatePayload(templateData) {
        return {
            name: templateData.name,
            category: templateData.category,
            language: templateData.language,
            components: templateData.components.map(comp => {
                const base = { type: comp.type };
                if (comp.format) base.format = comp.format;
                if (comp.text) base.text = comp.text;
                if (comp.buttons) base.buttons = comp.buttons;
                if (comp.example) base.example = comp.example;
                return base;
            })
        };
    },

    async submitTemplateToMeta(wabaId, payload) {
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        const token = process.env.META_ACCESS_TOKEN;
        
        if (!token) throw new Error("META_ACCESS_TOKEN is missing");
        if (!wabaId) throw new Error("WABA_ID is missing");

        const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates`;

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            throw new Error(`Meta API Error: ${errMsg}`);
        }
    },

    async syncTemplateStatus(wabaId, templateId) {
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        const token = process.env.META_ACCESS_TOKEN;

        const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates?id=${templateId}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.data[0]; // Returns array of templates, should be one
        } catch (error) {
            throw new Error(`Meta API Error: ${error.message}`);
        }
    },

    async deleteTemplateFromMeta(wabaId, templateName) {
        const version = process.env.META_GRAPH_API_VERSION || 'v20.0';
        const token = process.env.META_ACCESS_TOKEN;

        const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates?name=${templateName}`;

        try {
            await axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return true;
        } catch (error) {
            throw new Error(`Meta API Error: ${error.message}`);
        }
    }
};
