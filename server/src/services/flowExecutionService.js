import { supabase } from '../utils/db.js';
import * as sequenceService from './sequenceService.js';
import { livechatService } from './livechatService.js';
import { contactsService } from './contactsService.js';
import { whatsappCloudService } from './whatsappCloudService.js';
import { processAutomation } from './automationService.js';

export const flowExecutionService = {
    /**
     * Starts a flow for a given contact
     */
    async startFlow(workspaceId, contactId, flowId) {
        console.log(`[FlowEngine] Starting flow ${flowId} for contact ${contactId}`);
        
        // 1. Get the published flow nodes
        const { data: nodes } = await supabase
            .from('flow_nodes')
            .select('*')
            .eq('flow_id', flowId)
            .eq('version', 0); // version 0 is published

        if (!nodes || nodes.length === 0) {
            console.error(`[FlowEngine] No published nodes found for flow ${flowId}`);
            return;
        }

        // 2. Find start node
        const startNode = nodes.find(n => n.node_type === 'start' || n.type === 'start');
        if (!startNode) {
            console.error(`[FlowEngine] Start node not found for flow ${flowId}`);
            return;
        }

        const startNodeId = startNode.node_id || startNode.id;

        // 3. Create flow session
        await supabase.from('flow_sessions').upsert({
            id: contactId,
            workspace_id: workspaceId,
            flow_id: flowId,
            current_node_id: startNodeId,
            status: 'active',
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        // 4. Find next node connected to 'right' (default output port of Start node)
        const nextNode = await this.getNextNode(flowId, startNodeId, 'right', 0);
        if (nextNode) {
            await this.executeNode(workspaceId, contactId, nextNode, flowId);
        } else {
            console.log(`[FlowEngine] Start node has no connection`);
            await this.completeSession(contactId);
        }
    },

    /**
     * Executes a specific node in a flow
     */
    async executeNode(workspaceId, contactId, node, flowId) {
        if (!node) return;

        const nodeId = node.node_id || node.id;
        const nodeType = node.node_type || node.type;

        console.log(`[FlowEngine] Executing node: ${nodeId} (${nodeType})`);

        // Update session's current node
        await supabase.from('flow_sessions').upsert({
            id: contactId,
            workspace_id: workspaceId,
            flow_id: flowId,
            current_node_id: nodeId,
            status: 'active',
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        switch (nodeType) {
            case 'message':
            case 'send_message':
                await this.processSendMessage(workspaceId, contactId, node, flowId);
                break;
            case 'question':
                await this.processQuestion(workspaceId, contactId, node, flowId);
                break;
            case 'action':
                const actions = node.config_json?.actions || node.data?.actions || [];
                await this.processActions(workspaceId, contactId, actions);
                
                // Action node completes immediately, proceed to 'continue'
                const nextNodeAfterAction = await this.getNextNode(flowId, nodeId, 'continue', 0);
                if (nextNodeAfterAction) {
                    await this.executeNode(workspaceId, contactId, nextNodeAfterAction, flowId);
                } else {
                    await this.completeSession(contactId);
                }
                break;
            case 'condition':
                await this.processCondition(workspaceId, contactId, node, flowId);
                break;
            case 'split':
                await this.processSplit(workspaceId, contactId, node, flowId);
                break;
            case 'go_to':
                await this.processGoTo(workspaceId, contactId, node, flowId);
                break;
            case 'comment':
            case 'canvas':
                // Organizational/No-op nodes, skip and follow 'continue'
                const nextNodeSkip = await this.getNextNode(flowId, nodeId, 'continue', 0);
                if (nextNodeSkip) {
                    await this.executeNode(workspaceId, contactId, nextNodeSkip, flowId);
                } else {
                    await this.completeSession(contactId);
                }
                break;
            default:
                console.log(`[FlowEngine] No handler for node type: ${nodeType}`);
                const nextNodeFallback = await this.getNextNode(flowId, nodeId, 'continue', 0);
                if (nextNodeFallback) {
                    await this.executeNode(workspaceId, contactId, nextNodeFallback, flowId);
                } else {
                    await this.completeSession(contactId);
                }
        }
    },

    /**
     * Helper to retrieve the next node connected via a source handle
     */
    async getNextNode(flowId, sourceNodeId, sourceHandle = 'continue', version = 0) {
        let query = supabase
            .from('node_connections')
            .select('*')
            .eq('flow_id', flowId)
            .eq('source_node_id', sourceNodeId)
            .eq('version', version);

        if (sourceHandle) {
            query = query.eq('source_handle', sourceHandle);
        }

        const { data: connections } = await query;
        if (!connections || connections.length === 0) return null;

        const connection = connections[0];
        
        const { data: nodes } = await supabase
            .from('flow_nodes')
            .select('*')
            .eq('flow_id', flowId)
            .eq('node_id', connection.target_node_id)
            .eq('version', version);

        return nodes && nodes.length > 0 ? nodes[0] : null;
    },

    /**
     * Process message node
     */
    async processSendMessage(workspaceId, contactId, node, flowId) {
        const nodeId = node.node_id || node.id;
        console.log(`[FlowEngine] Processing send_message node: ${nodeId}`);

        // Get WhatsApp Connection credentials
        const { data: channel } = await supabase
            .from('channels')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('channel_type', 'whatsapp_cloud')
            .single();

        if (!channel || !channel.credentials) {
            console.warn(`[FlowEngine] WhatsApp channel credentials not found for workspace ${workspaceId}`);
            // Still proceed to next node
            const nextNode = await this.getNextNode(flowId, nodeId, 'continue', 0);
            if (nextNode) await this.executeNode(workspaceId, contactId, nextNode, flowId);
            return;
        }

        const credentials = channel.credentials;
        
        // Get contact details
        const { data: contact } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single();

        const to = contact?.phone;
        if (!to) {
            console.warn(`[FlowEngine] Contact phone not found for contact ${contactId}`);
            const nextNode = await this.getNextNode(flowId, nodeId, 'continue', 0);
            if (nextNode) await this.executeNode(workspaceId, contactId, nextNode, flowId);
            return;
        }

        const components = node.config_json?.components || node.data?.components || [];
        
        // Migrate legacy configurations on the fly
        if (components.length === 0 && (node.config_json?.text || node.data?.text)) {
            components.push({
                type: 'text',
                text: node.config_json?.text || node.data?.text || '',
                buttons: node.config_json?.buttons || node.data?.buttons || []
            });
        }

        for (const comp of components) {
            try {
                if (comp.type === 'text') {
                    const text = comp.text || '';
                    const buttons = comp.buttons || [];
                    
                    if (buttons.length > 0) {
                        // Max 3 buttons allowed by WhatsApp Cloud API
                        const payload = {
                            type: 'interactive',
                            interactive: {
                                type: 'button',
                                body: { text },
                                action: {
                                    buttons: buttons.slice(0, 3).map(btn => ({
                                        type: 'reply',
                                        reply: {
                                            id: btn.id,
                                            title: btn.label.substring(0, 20)
                                        }
                                    }))
                                }
                            }
                        };
                        await whatsappCloudService.sendRawPayload(credentials, to, payload);
                    } else {
                        await whatsappCloudService.sendMessage(credentials, to, text);
                    }
                } else if (comp.type === 'media') {
                    if (comp.mediaType === 'location' && comp.location) {
                        const payload = {
                            type: 'location',
                            location: {
                                latitude: parseFloat(comp.location.latitude) || 0,
                                longitude: parseFloat(comp.location.longitude) || 0,
                                name: comp.location.name || '',
                                address: comp.location.address || ''
                            }
                        };
                        await whatsappCloudService.sendRawPayload(credentials, to, payload);
                    } else if (comp.mediaUrl) {
                        const payload = {
                            type: comp.mediaType || 'image',
                            [comp.mediaType || 'image']: {
                                link: comp.mediaUrl,
                                filename: comp.mediaName || undefined
                            }
                        };
                        await whatsappCloudService.sendRawPayload(credentials, to, payload);
                    }
                } else if (comp.type === 'others' && comp.otherType === 'template') {
                    const payload = {
                        type: 'template',
                        template: {
                            name: comp.templateName,
                            language: { code: comp.templateLanguage || 'en_US' }
                        }
                    };
                    await whatsappCloudService.sendRawPayload(credentials, to, payload);
                }
            } catch (err) {
                console.error(`[FlowEngine] Failed to send message component:`, err.message);
            }
        }

        // Proceed to the next step
        const nextNode = await this.getNextNode(flowId, nodeId, 'continue', 0);
        if (nextNode) {
            await this.executeNode(workspaceId, contactId, nextNode, flowId);
        } else {
            await this.completeSession(contactId);
        }
    },

    /**
     * Process question node (pauses execution)
     */
    async processQuestion(workspaceId, contactId, node, flowId) {
        const nodeId = node.node_id || node.id;
        console.log(`[FlowEngine] Processing question node: ${nodeId}`);

        // Get WhatsApp Connection credentials
        const { data: channel } = await supabase
            .from('channels')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('channel_type', 'whatsapp_cloud')
            .single();

        if (!channel || !channel.credentials) return;

        const credentials = channel.credentials;
        
        // Get contact details
        const { data: contact } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single();

        const to = contact?.phone;
        if (!to) return;

        const questionText = node.config_json?.question_text || node.data?.question_text || 'Please reply:';
        const answers = node.config_json?.answers || node.data?.answers || [];

        try {
            if (answers.length > 0) {
                // Send interactive button options (Max 3 buttons allowed by WhatsApp)
                const payload = {
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: { text: questionText },
                        action: {
                            buttons: answers.slice(0, 3).map(ans => ({
                                type: 'reply',
                                reply: {
                                    id: `ans-${ans.id}`,
                                    title: ans.text.substring(0, 20)
                                }
                            }))
                        }
                    }
                };
                await whatsappCloudService.sendRawPayload(credentials, to, payload);
            } else {
                await whatsappCloudService.sendMessage(credentials, to, questionText);
            }
        } catch (err) {
            console.error(`[FlowEngine] Failed to send question:`, err.message);
        }
    },

    /**
     * Process condition node
     */
    async processCondition(workspaceId, contactId, node, flowId) {
        const nodeId = node.node_id || node.id;
        console.log(`[FlowEngine] Processing condition node: ${nodeId}`);

        const contactProfile = await contactsService.getContactProfile(contactId);
        const userFields = contactProfile?.user_field_values || [];

        const groups = node.config_json?.groups || node.data?.groups || [];
        let matchedIndex = groups.length - 1; // Fallback to 'Otherwise'

        for (let i = 0; i < groups.length - 1; i++) {
            const group = groups[i];
            if (group.conditions && Array.isArray(group.conditions)) {
                let groupMatched = true;
                for (const cond of group.conditions) {
                    const fieldValue = userFields.find(uf => uf.fields?.field_name === cond.field)?.value || '';
                    const match = this.evaluateCondition(fieldValue, cond.operator, cond.value);
                    if (!match) {
                        groupMatched = false;
                        break;
                    }
                }
                if (groupMatched) {
                    matchedIndex = i;
                    break;
                }
            }
        }

        const nextNode = await this.getNextNode(flowId, nodeId, `group-${matchedIndex}`, 0);
        if (nextNode) {
            await this.executeNode(workspaceId, contactId, nextNode, flowId);
        } else {
            await this.completeSession(contactId);
        }
    },

    evaluateCondition(fieldValue, operator, value) {
        const strField = String(fieldValue || '').toLowerCase().trim();
        const strVal = String(value || '').toLowerCase().trim();
        switch (operator) {
            case 'equals':
            case 'eq':
                return strField === strVal;
            case 'contains':
                return strField.includes(strVal);
            case 'starts_with':
                return strField.startsWith(strVal);
            case 'ends_with':
                return strField.endsWith(strVal);
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
            default:
                return false;
        }
    },

    /**
     * Process split node (A/B testing)
     */
    async processSplit(workspaceId, contactId, node, flowId) {
        const nodeId = node.node_id || node.id;
        console.log(`[FlowEngine] Processing split node: ${nodeId}`);

        const branches = node.config_json?.branches || node.data?.branches || [];
        if (branches.length === 0) {
            await this.completeSession(contactId);
            return;
        }

        const rand = Math.random() * 100;
        let cumulative = 0;
        let selectedIndex = 0;

        for (let i = 0; i < branches.length; i++) {
            cumulative += branches[i].percent || 0;
            if (rand <= cumulative) {
                selectedIndex = i;
                break;
            }
        }

        let nextNode = await this.getNextNode(flowId, nodeId, `split-${selectedIndex}`, 0);
        if (!nextNode) {
            nextNode = await this.getNextNode(flowId, nodeId, `branch-${selectedIndex}`, 0);
        }

        if (nextNode) {
            await this.executeNode(workspaceId, contactId, nextNode, flowId);
        } else {
            await this.completeSession(contactId);
        }
    },

    /**
     * Process go_to node
     */
    async processGoTo(workspaceId, contactId, node, flowId) {
        const nodeId = node.node_id || node.id;
        console.log(`[FlowEngine] Processing go_to node: ${nodeId}`);

        const targetNodeId = node.config_json?.targetNodeId || node.data?.targetNodeId;
        
        if (targetNodeId) {
            const { data: targetNodes } = await supabase
                .from('flow_nodes')
                .select('*')
                .eq('flow_id', flowId)
                .eq('node_id', targetNodeId)
                .eq('version', 0);

            if (targetNodes && targetNodes.length > 0) {
                await this.executeNode(workspaceId, contactId, targetNodes[0], flowId);
                return;
            }
        }

        // Fallback connection
        const nextNode = await this.getNextNode(flowId, nodeId, 'continue', 0);
        if (nextNode) {
            await this.executeNode(workspaceId, contactId, nextNode, flowId);
        } else {
            await this.completeSession(contactId);
        }
    },

    /**
     * Process list of actions
     */
    async processActions(workspaceId, contactId, actions) {
        for (const action of actions) {
            try {
                console.log(`[FlowEngine] Processing action: ${action.type}`);
                
                switch (action.type) {
                    case 'subscribe_sequence':
                        if (action.sequenceId) {
                            await sequenceService.subscribeUser(workspaceId, action.sequenceId, contactId);
                        }
                        break;
                    
                    case 'unsubscribe_sequence':
                        if (action.sequenceId) {
                            await supabase
                                .from('sequence_subscriptions')
                                .update({ status: 'unsubscribed', updated_at: new Date() })
                                .eq('workspace_id', workspaceId)
                                .eq('contact_id', contactId)
                                .eq('sequence_id', action.sequenceId);
                        }
                        break;

                    case 'set_variable':
                        if (action.variable && action.value !== undefined) {
                            await contactsService.saveFieldValue(workspaceId, contactId, action.variable, action.value);
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
     * Terminate the session
     */
    async completeSession(contactId) {
        console.log(`[FlowEngine] Completing session for contact ${contactId}`);
        await supabase
            .from('flow_sessions')
            .delete()
            .eq('id', contactId);
    },

    /**
     * Unified handler to process incoming customer messages against flows
     */
    async handleIncomingMessage(workspaceId, contactId, messageText, messagePayload = {}) {
        try {
            console.log(`[FlowEngine] handleIncomingMessage for contact: ${contactId}, text: "${messageText}", buttonId: "${messagePayload.buttonId || ''}"`);

            // 1. Check if there is an active session
            const { data: session } = await supabase
                .from('flow_sessions')
                .select('*')
                .eq('id', contactId)
                .eq('status', 'active')
                .maybeSingle();

            if (session) {
                console.log(`[FlowEngine] Active session found. Current node: ${session.current_node_id}`);
                const flowId = session.flow_id;

                // Load current node
                const { data: nodes } = await supabase
                    .from('flow_nodes')
                    .select('*')
                    .eq('flow_id', flowId)
                    .eq('node_id', session.current_node_id)
                    .eq('version', 0);

                if (nodes && nodes.length > 0) {
                    const currentNode = nodes[0];
                    const currentNodeId = currentNode.node_id || currentNode.id;
                    const nodeType = currentNode.node_type || currentNode.type;

                    if (nodeType === 'question') {
                        const answers = currentNode.config_json?.answers || currentNode.data?.answers || [];
                        const saveResponseTo = currentNode.config_json?.save_response_to || currentNode.data?.save_response_to;

                        // Save response to custom field if configured
                        if (saveResponseTo) {
                            await contactsService.saveFieldValue(workspaceId, contactId, saveResponseTo, messageText);
                        }

                        // Determine target transition handle
                        let targetHandle = null;

                        // Case A: Interactive button click matching
                        if (messagePayload.buttonId) {
                            // Check if buttonId corresponds to any predefined option
                            const match = answers.find(ans => `ans-${ans.id}` === messagePayload.buttonId || ans.id === messagePayload.buttonId);
                            if (match) {
                                targetHandle = `ans-${match.id}`;
                            }
                        }

                        // Case B: Text matching against options
                        if (!targetHandle && answers.length > 0) {
                            const normalizedText = messageText.toLowerCase().trim();
                            const match = answers.find(ans => ans.text?.toLowerCase().trim() === normalizedText);
                            if (match) {
                                targetHandle = `ans-${match.id}`;
                            }
                        }

                        // Case C: Fallback to 'no_match' handle if option selected was not found, or use 'continue'
                        if (!targetHandle) {
                            const noMatchNext = await this.getNextNode(flowId, currentNodeId, 'no_match', 0);
                            if (noMatchNext) {
                                targetHandle = 'no_match';
                            } else {
                                targetHandle = 'continue';
                            }
                        }

                        // Execute next node
                        const nextNode = await this.getNextNode(flowId, currentNodeId, targetHandle, 0);
                        if (nextNode) {
                            await this.executeNode(workspaceId, contactId, nextNode, flowId);
                        } else {
                            await this.completeSession(contactId);
                        }
                        return true;
                    }
                }
            }

            // 2. If no active session, evaluate automation triggers (keywords & default replies)
            const automationMatch = await processAutomation(workspaceId, messageText, contactId);
            if (automationMatch && automationMatch.flow_id) {
                console.log(`[FlowEngine] Triggering flow ${automationMatch.flow_id} for contact ${contactId}`);
                await this.startFlow(workspaceId, contactId, automationMatch.flow_id);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[FlowEngine] Error handling incoming message:', error.message);
            return false;
        }
    }
};
