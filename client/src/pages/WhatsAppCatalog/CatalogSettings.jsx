import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import config from '../../config';

export default function CatalogSettings() {
    const { workspaceId } = useParams();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [workspaceId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-catalog/settings?workspaceId=${workspaceId}`);
            if (res.ok) setSettings(await res.json());
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-catalog/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Settings saved");
        } catch(e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-8">
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">Commerce Settings</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm font-semibold text-slate-700">Enable Catalog</span>
                            <div className={`w-10 h-6 rounded-full transition-colors relative ${settings?.enabled ? 'bg-green-500' : 'bg-slate-300'}`} onClick={() => setSettings({...settings, enabled: !settings?.enabled})}>
                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings?.enabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                            </div>
                        </label>
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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Business Phone Number ID</label>
                                <input 
                                    type="text" 
                                    value={settings?.phone_number_id || ''}
                                    onChange={e => setSettings({...settings, phone_number_id: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Meta Commerce Catalog ID</label>
                            <input 
                                type="text" 
                                value={settings?.catalog_id || ''}
                                onChange={e => setSettings({...settings, catalog_id: e.target.value})}
                                placeholder="Enter Meta Catalog ID"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>

                        <div className="border-t border-slate-200 pt-6 space-y-4">
                            <h4 className="font-bold text-slate-800">Shopping Cart & Order Behavior</h4>
                            
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={settings?.cart_enabled ?? true} onChange={e => setSettings({...settings, cart_enabled: e.target.checked})} className="w-4 h-4" />
                                <span className="text-sm font-medium text-slate-700">Enable Shopping Cart in WhatsApp</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={settings?.product_questions_enabled ?? true} onChange={e => setSettings({...settings, product_questions_enabled: e.target.checked})} className="w-4 h-4" />
                                <span className="text-sm font-medium text-slate-700">Allow customers to ask product questions</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={settings?.auto_create_orders ?? true} onChange={e => setSettings({...settings, auto_create_orders: e.target.checked})} className="w-4 h-4" />
                                <span className="text-sm font-medium text-slate-700">Auto-create ecommerce orders from WhatsApp cart webhooks</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={settings?.auto_reserve_stock ?? true} onChange={e => setSettings({...settings, auto_reserve_stock: e.target.checked})} className="w-4 h-4" />
                                <span className="text-sm font-medium text-slate-700">Auto-reserve inventory stock when a WhatsApp order is placed</span>
                            </label>

                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Default Ecommerce Order Status</label>
                                <select 
                                    value={settings?.default_order_status || 'pending'}
                                    onChange={e => setSettings({...settings, default_order_status: e.target.value})}
                                    className="w-1/2 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="awaiting_payment">Awaiting Payment</option>
                                    <option value="confirmed">Confirmed</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Save size={16} /> Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
