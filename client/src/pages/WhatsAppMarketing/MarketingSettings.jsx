import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Save, ShieldAlert } from 'lucide-react';
import { useParams } from 'react-router-dom';
import config from '../../config';

export default function MarketingSettings() {
    const { workspaceId } = useParams();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cloudApiDisabled, setCloudApiDisabled] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [workspaceId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-marketing/settings?workspaceId=${workspaceId}`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                setCloudApiDisabled(data.disable_marketing_messages_on_cloud_api);
            }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-marketing/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    waba_id: settings.waba_id,
                    phone_number_id: settings.phone_number_id,
                    default_product_policy: settings.default_product_policy,
                    default_message_activity_sharing: settings.default_message_activity_sharing
                })
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Settings saved");
        } catch(e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleCloudApi = async (checked) => {
        if (checked) {
            const confirm = window.confirm(
                "WARNING: If you disable marketing templates on Cloud API, any marketing messages sent via /messages will be rejected by Meta. " +
                "Also, if your Marketing API onboarding is incomplete, fallbacks from /marketing_messages will fail with error 131063. Proceed?"
            );
            if (!confirm) return;
        }

        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-marketing/cloud-api-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wabaId: settings.waba_id, disable: checked })
            });
            if (res.ok) {
                setCloudApiDisabled(checked);
                setSettings({ ...settings, disable_marketing_messages_on_cloud_api: checked });
                // Also update local db
                await fetch(`${config.API_BASE}/whatsapp-marketing/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workspaceId, disable_marketing_messages_on_cloud_api: checked })
                });
            } else {
                throw new Error("Failed to sync with Meta");
            }
        } catch(e) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-8">
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg">Marketing API Configuration</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Business Account ID</label>
                                <input 
                                    type="text" 
                                    value={settings?.waba_id || ''}
                                    onChange={e => setSettings({...settings, waba_id: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number ID</label>
                                <input 
                                    type="text" 
                                    value={settings?.phone_number_id || ''}
                                    onChange={e => setSettings({...settings, phone_number_id: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Default Product Policy</label>
                            <select 
                                value={settings?.default_product_policy}
                                onChange={e => setSettings({...settings, default_product_policy: e.target.value})}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="CLOUD_API_FALLBACK">CLOUD_API_FALLBACK (Allows fallback if MM API is unavailable)</option>
                                <option value="STRICT">STRICT (Fails if MM API is unavailable)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Default Message Activity Sharing</label>
                            <select 
                                value={settings?.default_message_activity_sharing}
                                onChange={e => setSettings({...settings, default_message_activity_sharing: e.target.value})}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="default">Use WABA Default (Omit field)</option>
                                <option value="true">Enabled (true)</option>
                                <option value="false">Disabled (false)</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">This controls whether message activity such as reads may be shared with Meta for marketing optimization.</p>
                        </div>

                        <div className="pt-4">
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Save size={16} /> Save Settings
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-red-200 bg-red-50 flex gap-3 items-center text-red-800">
                        <ShieldAlert size={20} />
                        <h3 className="font-bold text-lg">Strict Marketing Enforcement</h3>
                    </div>
                    <div className="p-6">
                        <label className="flex items-start gap-4">
                            <input 
                                type="checkbox" 
                                checked={cloudApiDisabled}
                                onChange={(e) => handleToggleCloudApi(e.target.checked)}
                                className="mt-1 w-5 h-5 text-red-600"
                            />
                            <div>
                                <span className="block font-semibold text-slate-800">Disable Marketing Messages on Cloud API</span>
                                <span className="block text-sm text-slate-600 mt-1">
                                    When enabled, Meta will reject any marketing templates sent through the standard <code className="bg-slate-100 px-1">/messages</code> endpoint.
                                    This forces all marketing traffic through <code className="bg-slate-100 px-1">/marketing_messages</code>.
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}
