import { supabase } from '../utils/supabase.js';
import * as sequenceService from './sequenceService.js';
import { livechatService } from './livechatService.js';

export const flowExecutionService = {
    /**
     * Executes a specific node in a flow
     * @param {string} workspaceId 
     * @param {string} contactId 
     * @param {object} node 
     */
    async executeNode(workspaceId, contactId, node) {
        if (!node) return;

        console.log(`[FlowEngine] Executing node: ${node.id} (${node.type})`);

        switch (node.type) {
            case 'action':
                await this.processActions(workspaceId, contactId, node.data?.actions || node.actions || []);
                break;
            case 'send_message':
                await this.processSendMessage(workspaceId, contactId, node);
                break;
            case 'question':
                await this.processQuestion(workspaceId, contactId, node);
                break;
            case 'condition':
                await this.processCondition(workspaceId, contactId, node);
                break;
            case 'split':
                await this.processSplit(workspaceId, contactId, node);
                break;
            case 'send_email':
                await this.processSendEmail(workspaceId, contactId, node);
                break;
            case 'go_to':
                await this.processGoTo(workspaceId, contactId, node);
                break;
            case 'comment':
            case 'canvas':
                // Organizational/No-op nodes
                console.log(`[FlowEngine] Ignoring non-execution node: ${node.type}`);
                break;
            default:
                console.log(`[FlowEngine] No handler for node type: ${node.type}`);
        }
    },

    async processSendMessage(workspaceId, contactId, node) {
        console.log(`[FlowEngine] Processing send_message node: ${node.id}`);
        // Implementation for sending a message
    },

    async processQuestion(workspaceId, contactId, node) {
        console.log(`[FlowEngine] Processing question node: ${node.id}`);
        // Implementation for asking a question and pausing the flow
    },

    async processCondition(workspaceId, contactId, node) {
        console.log(`[FlowEngine] Processing condition node: ${node.id}`);
        // Implementation for routing flow based on conditions
    },

    async processSplit(workspaceId, contactId, node) {
        console.log(`[FlowEngine] Processing split node: ${node.id}`);
        // Implementation for A/B testing / random split
    },

    async processSendEmail(workspaceId, contactId, node) {
        console.log(`[FlowEngine] Processing send_email node: ${node.id}`);
        // Implementation for sending formatted email
    },

    async processGoTo(workspaceId, contactId, node) {
        console.log(`[FlowEngine] Processing go_to node: ${node.id}`);
        // Implementation for jumping to another step
    },

    /**
     * Processes a list of actions (Set variable, sequences, triggers, etc.)
     */
    async processActions(workspaceId, contactId, actions) {
        for (const action of actions) {
            try {
                console.log(`[FlowEngine] Processing action: ${action.type}`);
                
                switch (action.type) {
                    case 'subscribe_sequence':
                        if (action.sequenceId) {
                            await sequenceService.subscribeUser(workspaceId, action.sequenceId, contactId);
                            console.log(`[FlowEngine] Subscribed contact ${contactId} to sequence ${action.sequenceId}`);
                        }
                        break;
                    
                    case 'unsubscribe_sequence':
                        if (action.sequenceId) {
                            // Unsubscribe logic (usually just updating status in sequence_subscriptions)
                            await supabase
                                .from('sequence_subscriptions')
                                .update({ status: 'unsubscribed', updated_at: new Date() })
                                .eq('workspace_id', workspaceId)
                                .eq('contact_id', contactId)
                                .eq('sequence_id', action.sequenceId);
                            console.log(`[FlowEngine] Unsubscribed contact ${contactId} from sequence ${action.sequenceId}`);
                        }
                        break;

                    case 'set_variable':
                        // This logic might be in contactsService too
                        if (action.variable && action.value !== undefined) {
                            // Logic to save field value
                        }
                        break;

                    case 'business_hours_reply':
                        if (action.awayMessage) {
                            const isWithin = await this.isWithinBusinessHours(workspaceId);
                            if (!isWithin) {
                                console.log(`[FlowEngine] Outside business hours. Sending away message to contact ${contactId}`);
                                // Find open conversation
                                const { data: conversation } = await supabase
                                    .from('conversations')
                                    .select('id')
                                    .eq('workspace_id', workspaceId)
                                    .eq('contact_id', contactId)
                                    .neq('status', 'resolved')
                                    .order('created_at', { ascending: false })
                                    .limit(1)
                                    .single();
                                
                                if (conversation) {
                                    await livechatService.sendMessage(conversation.id, {
                                        sender_type: 'bot',
                                        sender_id: null,
                                        content: action.awayMessage,
                                        message_type: 'text'
                                    });
                                }
                            }
                        }
                        break;
                    
                    default:
                        console.log(`[FlowEngine] Unknown action type: ${action.type}`);
                }
            } catch (err) {
                console.error(`[FlowEngine] Action execution failed:`, err.message);
            }
        }
    },

    /**
     * Checks if the workspace's current local time is within its configured business hours.
     * @param {string} workspaceId
     * @returns {Promise<boolean>}
     */
    async isWithinBusinessHours(workspaceId) {
        try {
            const { data: workspace, error } = await supabase
                .from('workspaces')
                .select('timezone, business_hours')
                .eq('id', workspaceId)
                .single();

            if (error || !workspace) {
                console.warn(`[BusinessHours] Workspace not found or error loading settings:`, error?.message);
                return true; // Default to open if not found
            }

            const timezone = workspace.timezone || 'UTC';
            const businessHours = workspace.business_hours;

            if (!businessHours) {
                console.log(`[BusinessHours] No business hours configured for workspace ${workspaceId}. Defaulting to open all day.`);
                return true; // Default to open if not configured
            }

            // Get current day and time in workspace's local timezone
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            const parts = formatter.formatToParts(now);
            const weekdayPart = parts.find(p => p.type === 'weekday');
            const hourPart = parts.find(p => p.type === 'hour');
            const minutePart = parts.find(p => p.type === 'minute');

            if (!weekdayPart || !hourPart || !minutePart) {
                console.warn(`[BusinessHours] Failed to format current date for timezone ${timezone}`);
                return true;
            }

            const dayName = weekdayPart.value.toLowerCase(); // 'monday', 'tuesday', etc.
            const currentTime = `${hourPart.value}:${minutePart.value}`; // 'HH:MM'
            const dayConfig = businessHours[dayName];

            console.log(`[BusinessHours] Checking day: ${dayName}, local time: ${currentTime}, config:`, dayConfig);

            if (!dayConfig) return true; // Default to open if day config missing

            if (dayConfig.type === 'open_all_day') {
                return true;
            }

            if (dayConfig.type === 'closed') {
                return false;
            }

            if (dayConfig.type === 'open_hours' && dayConfig.hours && dayConfig.hours[0]) {
                const { start, end } = dayConfig.hours[0];
                if (start && end) {
                    return currentTime >= start && currentTime <= end;
                }
            }

            if (dayConfig.type === 'two_open_hours' && dayConfig.hours) {
                const slot1 = dayConfig.hours[0];
                const slot2 = dayConfig.hours[1];
                
                let inSlot1 = false;
                let inSlot2 = false;

                if (slot1 && slot1.start && slot1.end) {
                    inSlot1 = currentTime >= slot1.start && currentTime <= slot1.end;
                }
                if (slot2 && slot2.start && slot2.end) {
                    inSlot2 = currentTime >= slot2.start && currentTime <= slot2.end;
                }

                return inSlot1 || inSlot2;
            }

            return true; // Fallback
        } catch (err) {
            console.error(`[BusinessHours] Error checking business hours:`, err.message);
            return true; // Default to open on error
        }
    }
};
