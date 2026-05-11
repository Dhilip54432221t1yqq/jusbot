import { useState, useEffect } from "react";
import { MessageCircle, CheckCircle, Key, Lock, Bell, Wifi, Activity, AlertCircle, RefreshCw, Copy, Save, Phone, Eye, EyeOff, Zap, ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import config from "../config";

export default function WhatsAppCloudSetup() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [verifyToken, setVerifyToken] = useState('reflx_webhook_secret_2026');
    const [apiVersion, setApiVersion] = useState('v23.0');
    const [showToken, setShowToken] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isConnected, setIsConnected] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('All');
    const [logSearch, setLogSearch] = useState('');
    const [activeTab, setActiveTab] = useState('setup'); // 'setup' | 'logs'

    const fbAppId = import.meta.env.VITE_FB_APP_ID || '';
    const fbConfigId = import.meta.env.VITE_FB_CONFIG_ID || '';

    const webhookUrl = `${config.API_BASE}/whatsapp-cloud/webhook?workspaceId=${workspaceId}`;

    useEffect(() => {
        if (workspaceId) {
            fetchStatus();
            fetchLogs();
            const interval = setInterval(() => { fetchStatus(); }, 60000);
            return () => clearInterval(interval);
        }
    }, [workspaceId]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchStatus = async () => {
        try {
            setIsRefreshing(true);
            const response = await fetch(`${config.API_BASE}/whatsapp-cloud/status/${workspaceId}`);
            const data = await response.json();
            if (data.connected && data.credentials) {
                // Already connected — go to the connected dashboard
                navigate(`/${workspaceId}/whatsapp-connected`, { replace: true });
                return;
            } else {
                setIsConnected(false);
            }
        } catch (e) { console.error(e); }
        finally { setIsRefreshing(false); }
    };

    const fetchLogs = async () => {
        try {
            const response = await fetch(`${config.API_BASE}/whatsapp-cloud/logs/${workspaceId}`);
            const data = await response.json();
            if (Array.isArray(data)) setLogs(data);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!phoneNumberId || !wabaId || !accessToken || !verifyToken) {
            showToast("Please fill all required fields", "error");
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch(`${config.API_BASE}/whatsapp-cloud/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId, phoneNumberId, wabaId, accessToken, verifyToken, apiVersion })
            });
            const data = await response.json();
            if (data.success) { showToast("Configuration saved!"); fetchStatus(); fetchLogs(); }
            else showToast(data.error || "Failed to save", "error");
        } catch (e) { showToast("Network error", "error"); }
        finally { setIsSaving(false); }
    };

    const handleTestConnection = async () => {
        const testPhone = prompt("Enter a phone number to send a test message to (with country code):");
        if (!testPhone) return;
        setIsTesting(true);
        try {
            const response = await fetch(`${config.API_BASE}/whatsapp-cloud/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    testPhoneNumber: testPhone,
                    credentials: { phone_number_id: phoneNumberId, waba_id: wabaId, access_token: accessToken, api_version: apiVersion }
                })
            });
            const data = await response.json();
            if (data.success) { showToast("Test message sent!"); fetchLogs(); }
            else showToast(`Failed: ${data.error}`, "error");
        } catch (e) { showToast("Network error", "error"); }
        finally { setIsTesting(false); }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Disconnect WhatsApp Cloud?")) return;
        try {
            await supabase.from('channels').delete().eq('workspace_id', workspaceId).eq('channel_type', 'whatsapp_cloud');
            showToast("Disconnected successfully");
            setIsConnected(false);
            setPhoneNumberId(''); setWabaId(''); setAccessToken('');
        } catch (e) { showToast("Failed to disconnect", "error"); }
    };

    const launchEmbeddedSignup = () => {
        if (!window.FB) { showToast("Facebook SDK not loaded", "error"); return; }
        if (!fbAppId || !fbConfigId) { showToast("Missing FB App ID or Config ID", "error"); return; }

        window.FB.init({ appId: fbAppId, autoLogAppEvents: true, xfbml: true, version: 'v23.0' });
        window.FB.login(async (response) => {
            if (response.authResponse?.code) {
                try {
                    const res = await fetch(`${config.API_BASE}/whatsapp-cloud/exchange-code`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: response.authResponse.code, workspaceId })
                    });
                    const data = await res.json();
                    if (data.success) { showToast("WhatsApp connected!"); fetchStatus(); }
                    else showToast(data.error || "Failed", "error");
                } catch (e) { showToast("Failed to complete setup", "error"); }
            }
        }, {
            config_id: fbConfigId,
            response_type: 'code',
            override_default_response_type: true,
        });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("Copied!");
    };

    const filteredLogs = logs.filter(log => {
        const matchFilter = logFilter === 'All' || log.event_type === logFilter.toLowerCase() || (logFilter === 'Errors' && log.status === 'failed');
        const matchSearch = log.message?.toLowerCase().includes(logSearch.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 font-sans">
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/${workspaceId}/integrations`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-sm">
                            <MessageCircle fill="white" stroke="white" size={16} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 leading-tight">WhatsApp Cloud</h1>
                            <p className="text-xs text-slate-400 leading-tight">Meta Cloud API</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isConnected && (
                            <button onClick={handleDisconnect} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                Disconnect
                            </button>
                        )}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                            {isConnected ? 'Connected' : 'Not Connected'}
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="bg-white border-b border-slate-200 px-8 shrink-0">
                    <div className="flex gap-6">
                        {[['setup', 'Configuration'], ['logs', 'Activity Logs']].map(([key, label]) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'setup' && (
                        <div className="max-w-4xl mx-auto space-y-4">

                            {/* Connected Banner */}
                            {isConnected && (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                <CheckCircle size={16} color="white" fill="white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-green-800">WhatsApp Cloud Connected</p>
                                                <p className="text-xs text-green-600">Last synced {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</p>
                                            </div>
                                        </div>
                                        <button onClick={fetchStatus} className="flex items-center gap-1.5 text-xs text-green-700 font-medium hover:text-green-900">
                                            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} /> Sync
                                        </button>
                                    </div>
                                    <div className="px-6 py-4 grid grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium mb-1">Phone Number ID</p>
                                            <p className="text-sm font-semibold text-slate-800 font-mono">{phoneNumberId || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium mb-1">WABA ID</p>
                                            <p className="text-sm font-semibold text-slate-800 font-mono">{wabaId || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium mb-1">API Version</p>
                                            <p className="text-sm font-semibold text-slate-800">{apiVersion}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Connect via Embedded Signup */}
                            {!isConnected && (
                                <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Zap size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Quick Connect</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Use Meta's Embedded Signup for automatic configuration</p>
                                        </div>
                                    </div>
                                    <button onClick={launchEmbeddedSignup}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-bold rounded-lg transition-colors shadow-sm shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                        Connect WhatsApp Business
                                    </button>
                                </div>
                            )}

                            {/* OR Divider + Manual Setup */}
                            {!isConnected && (
                                <div className="flex items-center gap-4 px-1">
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                    <span className="text-xs font-medium text-slate-400">OR SET UP MANUALLY</span>
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                </div>
                            )}

                            {/* Manual Config Card */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Key size={15} className="text-slate-400" />
                                        <h2 className="text-sm font-bold text-slate-700">API Credentials</h2>
                                    </div>
                                    {isConnected && (
                                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Edit Mode</span>
                                    )}
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number ID <span className="text-red-500">*</span></label>
                                            <input type="text" value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)}
                                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                                placeholder="e.g. 10234567890123" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">WhatsApp Business Account ID <span className="text-red-500">*</span></label>
                                            <input type="text" value={wabaId} onChange={e => setWabaId(e.target.value)}
                                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                                placeholder="e.g. 11223344556677" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Permanent Access Token <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input type={showToken ? "text" : "password"} value={accessToken} onChange={e => setAccessToken(e.target.value)}
                                                className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-mono"
                                                placeholder="EAAB..." />
                                            <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">Use a System User token for permanent access.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Version</label>
                                            <select value={apiVersion} onChange={e => setApiVersion(e.target.value)}
                                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all">
                                                <option value="v23.0">v23.0 (Latest)</option>
                                                <option value="v22.0">v22.0</option>
                                                <option value="v18.0">v18.0</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Webhook Verify Token <span className="text-red-500">*</span></label>
                                            <input type="text" value={verifyToken} onChange={e => setVerifyToken(e.target.value)}
                                                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" />
                                        </div>
                                    </div>

                                    {/* Webhook URL */}
                                    <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4">
                                        <label className="block text-xs font-bold text-blue-900 mb-2">Webhook Callback URL</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-white border border-blue-200 text-slate-700 px-3 py-2 rounded-lg text-xs truncate">{webhookUrl}</code>
                                            <button onClick={() => copyToClipboard(webhookUrl)} className="shrink-0 p-2 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                        <button onClick={handleTestConnection} disabled={!phoneNumberId || !wabaId || !accessToken || isTesting}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-200">
                                            {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                                            {isTesting ? "Testing..." : "Test Connection"}
                                        </button>
                                        <button onClick={handleSave} disabled={isSaving}
                                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-600/20">
                                            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                            {isSaving ? "Saving..." : "Save Configuration"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Flowbuilder Info */}
                            <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center gap-4">
                                <div className="w-9 h-9 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Zap size={15} className="text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">Flowbuilder Trigger</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Incoming messages fire the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">whatsapp_cloud_incoming</code> event</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 shrink-0" />
                            </div>

                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-sm font-bold text-slate-700">Activity Logs</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                                            {['All', 'Webhooks', 'API', 'Errors'].map(f => (
                                                <button key={f} onClick={() => setLogFilter(f)}
                                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${logFilter === f ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{f}</button>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <input type="text" placeholder="Search..." value={logSearch} onChange={e => setLogSearch(e.target.value)}
                                                className="w-44 pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500" />
                                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                {['Time', 'Event', 'Status', 'Message', 'Details'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredLogs.length === 0 ? (
                                                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                                                    <Activity className="mx-auto mb-2 opacity-30" size={22} />
                                                    No logs yet
                                                </td></tr>
                                            ) : (
                                                filteredLogs.map((log, i) => (
                                                    <tr key={log.id || i} className={`hover:bg-slate-50 transition-colors ${log.status === 'failed' ? 'bg-red-50/20' : ''}`}>
                                                        <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600">{log.event_type}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                                                        </td>
                                                        <td className="px-5 py-3 text-sm text-slate-700 truncate max-w-[200px]">{log.message}</td>
                                                        <td className="px-5 py-3">
                                                            <button onClick={() => alert(JSON.stringify(log.details, null, 2))} className="text-xs font-semibold text-blue-600 hover:underline">View</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-900 border-slate-700 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} className="text-green-400" />}
                    {toast.message}
                </div>
            </div>
        </div>
    );
}
