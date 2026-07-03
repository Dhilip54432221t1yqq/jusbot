import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import config from '../config';
import { CheckCircle, Save, Smartphone, Settings, IndianRupee, Shield, ShieldAlert, ArrowRight, Zap, Search } from 'lucide-react';

export default function WhatsAppPayments() {
    const { workspaceId } = useParams();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // UI state
    const [activeMode, setActiveMode] = useState('gateway'); // 'gateway' | 'upi'
    
    // Data state
    const [settings, setSettings] = useState({
        payment_mode: 'gateway', // gateway, upi
        pg_provider: 'razorpay',
        pg_merchant_id: '',
        pg_api_key: '',
        pg_secret: '',
        upi_vpa: '',
        upi_mcc: '',
        upi_pc: '',
        enabled: false
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${config.API_BASE}/whatsapp-payments/settings?workspaceId=${workspaceId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                    setActiveMode(data.payment_mode || 'gateway');
                }
            } catch (err) { console.error(err); }
        };
        fetchSettings();
    }, [workspaceId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-payments/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId, ...settings })
            });
            if (res.ok) {
                alert('Payments API configuration saved!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (err) { alert(err.message); } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center gap-4 shrink-0 shadow-sm z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                    <IndianRupee fill="white" stroke="white" size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-extrabold text-slate-800 leading-tight">WhatsApp Payments (India)</h1>
                    <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5">Accept UPI, cards, NetBanking natively inside WhatsApp conversations.</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-bold text-slate-600">Enable Payments</span>
                        <div 
                            className={`w-9 h-5 rounded-full transition-colors relative ${settings.enabled ? 'bg-green-500' : 'bg-slate-300'}`} 
                            onClick={() => setSettings({...settings, enabled: !settings.enabled})}
                        >
                            <div className={`absolute top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${settings.enabled ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                        </div>
                    </label>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        {saving ? <span className="animate-spin">⏳</span> : <Save size={14} />} 
                        {saving ? 'Saving...' : 'Save Config'}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* Mode Selector */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex gap-2">
                        <button 
                            onClick={() => { setActiveMode('gateway'); setSettings({...settings, payment_mode: 'gateway'}); }}
                            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${activeMode === 'gateway' ? 'border-green-500 bg-green-50/50' : 'border-transparent hover:bg-slate-50'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeMode === 'gateway' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                <Shield size={20} />
                            </div>
                            <span className="text-sm font-bold text-slate-800">Deep Integration Mode</span>
                            <span className="text-[10px] text-slate-500 font-medium text-center mt-1">Razorpay, PayU, Billdesk, Zaakpay.<br/>Supports UPI, Cards, NetBanking.</span>
                        </button>
                        
                        <button 
                            onClick={() => { setActiveMode('upi'); setSettings({...settings, payment_mode: 'upi'}); }}
                            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${activeMode === 'upi' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent hover:bg-slate-50'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeMode === 'upi' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                <Zap size={20} />
                            </div>
                            <span className="text-sm font-bold text-slate-800">UPI Intent Mode</span>
                            <span className="text-[10px] text-slate-500 font-medium text-center mt-1">Native UPI app switching.<br/>Limited to UPI payments only.</span>
                        </button>
                    </div>

                    {/* Content Based on Mode */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration Form */}
                        <div className="col-span-2 space-y-6">
                            
                            {activeMode === 'gateway' && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                            <Settings size={16} className="text-slate-400"/> Payment Gateway Deep Integration
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Integrate directly with Meta supported gateways. You must ensure the gateway account owner is linked to your Meta Business Suite.
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Supported Gateway</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {['razorpay', 'payu', 'billdesk', 'zaakpay'].map(pg => (
                                                <button 
                                                    key={pg}
                                                    onClick={() => setSettings({...settings, pg_provider: pg})}
                                                    className={`py-3 text-xs font-bold uppercase tracking-wider rounded-xl border-2 transition-all ${settings.pg_provider === pg ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                                                >
                                                    {pg}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Merchant ID</label>
                                            <input 
                                                type="text" 
                                                value={settings.pg_merchant_id} 
                                                onChange={e => setSettings({...settings, pg_merchant_id: e.target.value})}
                                                placeholder={`Enter your ${settings.pg_provider.toUpperCase()} Merchant ID`}
                                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all font-semibold text-slate-700"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">API Key</label>
                                                <input 
                                                    type="password" 
                                                    value={settings.pg_api_key} 
                                                    onChange={e => setSettings({...settings, pg_api_key: e.target.value})}
                                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all text-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">API Secret</label>
                                                <input 
                                                    type="password" 
                                                    value={settings.pg_secret} 
                                                    onChange={e => setSettings({...settings, pg_secret: e.target.value})}
                                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                        <ShieldAlert size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-blue-900">Webhooks & Refunds Automation</h4>
                                            <p className="text-[10px] text-blue-700 mt-1 leading-relaxed">
                                                Deep Integration mode automatically handles Order Details templates, Payment Status Webhooks, Order Status messages, and Refund APIs seamlessly inside WhatsApp.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeMode === 'upi' && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                            <Zap size={16} className="text-slate-400"/> UPI Intent Setup
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Generate native UPI payment intent screens in WhatsApp. You must retrieve these IDs from your merchant payment gateway.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">VPA ID (Virtual Payment Address)</label>
                                            <input 
                                                type="text" 
                                                value={settings.upi_vpa} 
                                                onChange={e => setSettings({...settings, upi_vpa: e.target.value})}
                                                placeholder="e.g. merchant@upi"
                                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all font-semibold text-slate-700"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Merchant Category Code (MCC)</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.upi_mcc} 
                                                    onChange={e => setSettings({...settings, upi_mcc: e.target.value})}
                                                    placeholder="e.g. 5411"
                                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all text-slate-700 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Purpose Code (PC)</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.upi_pc} 
                                                    onChange={e => setSettings({...settings, upi_pc: e.target.value})}
                                                    placeholder="e.g. 01 (Default)"
                                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all text-slate-700 font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                                        <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-amber-900">Important limitations</h4>
                                            <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                                                UPI Intent mode does <strong>not</strong> support native Refunds or Native Payment Status Webhooks from WhatsApp. You will need to rely on your gateway's S2S S2S callbacks.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Feature Comparison Sidebar / Phone Mockup */}
                        <div className="space-y-6">
                            {/* Simulator */}
                            <div className="bg-slate-100/60 rounded-3xl p-6 border border-slate-200 shadow-inner flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <Smartphone size={12} /> Live Preview
                                </span>
                                
                                <div className="w-full max-w-[260px] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl relative border-[3px] border-slate-800">
                                    <div className="bg-[#e5ddd5] rounded-[28px] overflow-hidden h-[420px] flex flex-col relative">
                                        {/* Header */}
                                        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-2 z-10 shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">JB</div>
                                            <div>
                                                <div className="text-xs font-bold leading-tight">JusBot Store</div>
                                                <div className="text-[9px] text-white/80">Business Account</div>
                                            </div>
                                        </div>

                                        {/* Chat Area */}
                                        <div className="flex-1 p-3 flex flex-col justify-end space-y-3 pb-6 relative z-10">
                                            {/* Order Details Message */}
                                            <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm max-w-[90%] text-sm">
                                                <div className="font-bold text-slate-800 text-[11px] mb-1">Order Details</div>
                                                <div className="text-[10px] text-slate-500 leading-tight mb-2">
                                                    1x Premium Subscription<br/>
                                                    Order #JB-9042
                                                </div>
                                                <div className="font-extrabold text-slate-900 text-sm mb-3">₹ 1,499.00</div>
                                                
                                                <div className="border-t border-slate-100 pt-2 text-center text-[11px] font-bold text-blue-500 flex justify-center items-center gap-1">
                                                    Review and Pay
                                                </div>
                                            </div>

                                            {/* Sent Message if Gateway is active */}
                                            {activeMode === 'gateway' && (
                                                <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-2 shadow-sm max-w-[80%] self-end">
                                                    <div className="text-[11px] text-slate-800 leading-relaxed font-medium">
                                                        Paid via <span className="font-bold">UPI</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* BG Pattern */}
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
