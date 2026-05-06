import { supabase } from '../utils/supabase.js';
import * as sequenceService from './sequenceService.js';

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
                await this.processActions(workspaceId, contactId, node.data.actions || []);
                break;
            // Add other node types as needed
            default:
                console.log(`[FlowEngine] No handler for node type: ${node.type}`);
        }
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
                    
                    default:
                        console.log(`[FlowEngine] Unknown action type: ${action.type}`);
                }
            } catch (err) {
                console.error(`[FlowEngine] Action execution failed:`, err.message);
            }
        }
    }
};
