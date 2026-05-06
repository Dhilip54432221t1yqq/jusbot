import { supabase } from '../utils/supabase.js';

/**
 * Calculates the next available time for a message based on delay, 
 * time-range constraints, and day filters.
 */
export const calculateNextSchedule = (message, fromTime = new Date()) => {
    let scheduled = new Date(fromTime);
    
    // 1. Add Delay
    if (message.delay_unit === 'minutes') scheduled.setMinutes(scheduled.getMinutes() + (message.delay_value || 0));
    else if (message.delay_unit === 'hours') scheduled.setHours(scheduled.getHours() + (message.delay_value || 0));
    else if (message.delay_unit === 'days') scheduled.setDate(scheduled.getDate() + (message.delay_value || 0));

    // 2. Day Filter Check
    const allowedDays = message.days || [0,1,2,3,4,5,6];
    let attempts = 0;
    while (!allowedDays.includes(scheduled.getDay()) && attempts < 8) {
        scheduled.setDate(scheduled.getDate() + 1);
        scheduled.setHours(message.send_anytime ? 0 : parseInt(message.time_start?.split(':')[0] || 0));
        scheduled.setMinutes(message.send_anytime ? 0 : parseInt(message.time_start?.split(':')[1] || 0));
        attempts++;
    }

    // 3. Time Range Check
    if (!message.send_anytime && message.time_start && message.time_end) {
        const currentTimeStr = scheduled.getHours().toString().padStart(2, '0') + ':' + scheduled.getMinutes().toString().padStart(2, '0');
        
        if (currentTimeStr < message.time_start) {
            // Push to start time today
            const [h, m] = message.time_start.split(':');
            scheduled.setHours(parseInt(h), parseInt(m), 0, 0);
        } else if (currentTimeStr > message.time_end) {
            // Push to start time tomorrow
            scheduled.setDate(scheduled.getDate() + 1);
            const [h, m] = message.time_start.split(':');
            scheduled.setHours(parseInt(h), parseInt(m), 0, 0);
            
            // Re-check day filter if we moved to tomorrow
            while (!allowedDays.includes(scheduled.getDay())) {
                scheduled.setDate(scheduled.getDate() + 1);
            }
        }
    }

    return scheduled;
};

/**
 * Subscribes a user to a sequence
 */
export const subscribeUser = async (workspaceId, contactId, sequenceId) => {
    try {
        // 1. Get sequence and first message
        const { data: messages } = await supabase
            .from('sequence_messages')
            .select('*')
            .eq('sequence_id', sequenceId)
            .order('order_index', { ascending: true })
            .limit(1);

        if (!messages || messages.length === 0) return { error: 'Sequence has no messages' };

        const firstMsg = messages[0];
        const scheduledTime = calculateNextSchedule(firstMsg);

        // 2. Upsert subscription
        const { data, error } = await supabase
            .from('sequence_subscriptions')
            .upsert({
                workspace_id: workspaceId,
                contact_id: contactId,
                sequence_id: sequenceId,
                status: 'active',
                next_message_index: 0,
                scheduled_at: scheduledTime.toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'contact_id,sequence_id' })
            .select()
            .single();

        if (error) throw error;
        return { success: true, subscription: data };
    } catch (e) {
        console.error('[SequenceService] Subscribe error:', e.message);
        return { error: e.message };
    }
};

/**
 * Background worker to check and fire due messages
 */
export const checkAndFireSequences = async () => {
    try {
        const now = new Date().toISOString();
        
        // 1. Find due active subscriptions
        const { data: dueSubs } = await supabase
            .from('sequence_subscriptions')
            .select(`
                *,
                contact:contact_id(*),
                sequence:sequence_id(*)
            `)
            .eq('status', 'active')
            .lte('scheduled_at', now)
            .limit(10); // Batch process

        if (!dueSubs || dueSubs.length === 0) return;

        for (const sub of dueSubs) {
            // 2. Get the current message to send
            const { data: messages } = await supabase
                .from('sequence_messages')
                .select('*')
                .eq('sequence_id', sub.sequence_id)
                .order('order_index', { ascending: true });

            const currentMsg = messages[sub.next_message_index];
            if (!currentMsg) {
                // Should not happen if data is correct, but mark as completed
                await supabase.from('sequence_subscriptions').update({ status: 'completed' }).eq('id', sub.id);
                continue;
            }

            // 3. Trigger Flow (Simulated call)
            console.log(`[SequenceWorker] Firing message ${sub.next_message_index} for contact ${sub.contact_id}: flow ${currentMsg.flow_id}`);
            // TODO: Call Flow Engine
            
            // 4. Schedule next message or complete
            const nextIndex = sub.next_message_index + 1;
            if (nextIndex < messages.length) {
                const nextMsg = messages[nextIndex];
                const nextSchedule = calculateNextSchedule(nextMsg, new Date()); // Delay starts after previous is sent
                
                await supabase.from('sequence_subscriptions').update({
                    next_message_index: nextIndex,
                    scheduled_at: nextSchedule.toISOString(),
                    updated_at: new Date().toISOString()
                }).eq('id', sub.id);
            } else {
                await supabase.from('sequence_subscriptions').update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                }).eq('id', sub.id);
            }
        }
    } catch (e) {
        console.error('[SequenceWorker] Error:', e.message);
    }
};
