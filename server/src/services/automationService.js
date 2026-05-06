import { supabase } from '../utils/supabase.js';

/**
 * Normalizes text for comparison (lowercase, trimmed)
 */
const normalize = (text) => text?.toLowerCase().trim() || '';

/**
 * Checks if any keyword matches the incoming message
 */
export const processAutomation = async (workspaceId, messageText, contactId) => {
    try {
        const normalizedMsg = normalize(messageText);
        if (!normalizedMsg) return false;

        // 1. Fetch active keywords for this workspace
        const { data: keywordRules } = await supabase
            .from('keywords')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'active');

        if (keywordRules && keywordRules.length > 0) {
            for (const rule of keywordRules) {
                const keywordList = rule.keywords.split(',').map(k => normalize(k)).filter(k => k);
                let matched = false;

                for (const kw of keywordList) {
                    if (rule.match_type === 'is' && normalizedMsg === kw) {
                        matched = true;
                    } else if (rule.match_type === 'contains' && normalizedMsg.includes(kw)) {
                        matched = true;
                    } else if (rule.match_type === 'starts_with' && normalizedMsg.startsWith(kw)) {
                        matched = true;
                    }
                    if (matched) break;
                }

                if (matched) {
                    console.log(`[Automation] Keyword Match found: "${rule.keywords}" -> Triggering flow ${rule.flow_id}`);
                    // Trigger the flow. In a real system, this would call the Flow Execution Engine.
                    // For now, we log it and return the flow_id so the webhook can handle it if needed.
                    // Or we could have a common "startFlow" helper.
                    
                    // We'll return the matched rule so the caller knows a match happened.
                    return { type: 'keyword', flow_id: rule.flow_id, match: rule };
                }
            }
        }

        // 2. If no keywords match, check Default Reply
        const { data: settings } = await supabase
            .from('automation_settings')
            .select('*')
            .eq('workspace_id', workspaceId)
            .single();

        if (settings && settings.default_reply_enabled && settings.default_reply_flow_id) {
            console.log(`[Automation] No keyword match. Triggering Default Reply flow: ${settings.default_reply_flow_id}`);
            return { type: 'default_reply', flow_id: settings.default_reply_flow_id };
        }

        return null; // No automation triggered
    } catch (e) {
        console.error('[Automation] Error processing automation:', e.message);
        return null;
    }
};
