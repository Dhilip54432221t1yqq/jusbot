import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Send, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import config from '../../config';

export default function SendMarketingMessage() {
    const { workspaceId } = useParams();
    const [templates, setTemplates] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Form state
    const [recipientType, setRecipientType] = useState('PHONE');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bsuid, setBsuid] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [productPolicy, setProductPolicy] = useState('CLOUD_API_FALLBACK');
    const [activitySharing, setActivitySharing] = useState('default');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [workspaceId]);

    const fetchData = async () => {
        try {
            // Get templates
            const { data: tmplData } = await supabase.from('whatsapp_templates')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('category', 'marketing')
                .eq('status', 'Approved');
            
            if (tmplData) setTemplates(tmplData);

            // Get settings
            const res = await fetch(`${config.API_BASE}/whatsapp-marketing/settings?workspaceId=${workspaceId}`);
            if (res.ok) {
                const sett = await res.json();
                setSettings(sett);
                setProductPolicy(sett.default_product_policy);
                setActivitySharing(sett.default_message_activity_sharing);
            }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSend = async () => {
        setError('');
        setSuccess('');
        
        if (!selectedTemplateId) return setError("Please select a marketing template.");
        if (recipientType === 'PHONE' && !phoneNumber) return setError("Phone number is required.");
        if (recipientType === 'BSUID' && !bsuid) return setError("BSUID is required.");
        
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return setError("Invalid template.");

        setSending(true);
        try {
            const payload = {
                workspaceId,
                templateName: template.name,
                languageCode: template.language,
                productPolicy,
                messageActivitySharing: activitySharing,
                components: [] // Simplified: assume no dynamic vars for this MVP
            };

            if (recipientType === 'PHONE' || (phoneNumber && bsuid)) {
                payload.to = phoneNumber; // Phone takes precedence
            } else {
                payload.recipient = bsuid;
            }

            const res = await fetch(`${config.API_BASE}/whatsapp-marketing/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Send failed");
            
            setSuccess(`Message sent successfully! Meta ID: ${result.metaResponse?.messages?.[0]?.id}`);
            
            // Clear inputs
            setPhoneNumber('');
            setBsuid('');
        } catch(e) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">Send Marketing Message</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Marketing Messages API supports marketing templates only. Utility, Authentication, Service, and freeform messages must be sent through Cloud API.
                    </p>
                </div>
                
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 flex items-start gap-2 rounded-lg border border-red-200">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm font-medium">
                            {success}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Template</label>
                            <select 
                                value={selectedTemplateId} 
                                onChange={e => setSelectedTemplateId(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="">-- Choose an approved marketing template --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" checked={recipientType === 'PHONE'} onChange={() => setRecipientType('PHONE')} className="text-blue-600" />
                                    <span className="text-sm">Phone Number</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" checked={recipientType === 'BSUID'} onChange={() => setRecipientType('BSUID')} className="text-blue-600" />
                                    <span className="text-sm">BSUID</span>
                                </label>
                            </div>
                        </div>

                        {recipientType === 'PHONE' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={phoneNumber} 
                                    onChange={e => setPhoneNumber(e.target.value)}
                                    placeholder="+1234567890"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        )}

                        {recipientType === 'BSUID' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">BSUID</label>
                                <input 
                                    type="text" 
                                    value={bsuid} 
                                    onChange={e => setBsuid(e.target.value)}
                                    placeholder="Enter BSUID"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">If bid_spec is used in this template, BSUID is not allowed by Meta.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Policy</label>
                                <select 
                                    value={productPolicy} 
                                    onChange={e => setProductPolicy(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="CLOUD_API_FALLBACK">Fallback to Cloud API</option>
                                    <option value="STRICT">Strict (No Fallback)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Activity Sharing</label>
                                <select 
                                    value={activitySharing} 
                                    onChange={e => setActivitySharing(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="default">WABA Default</option>
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                onClick={handleSend}
                                disabled={sending || !selectedTemplateId}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Send size={18} /> {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
