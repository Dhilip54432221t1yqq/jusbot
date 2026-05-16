import { useState, useEffect } from "react";
import { MessageCircle, RefreshCw, Activity, CheckCircle, AlertCircle, Zap, ExternalLink, ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabase";
import config from "../config";

export default function WhatsAppConnected() {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const navigate = useNavigate();

    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [flows, setFlows] = useState([]);
    const [linkedFlowId, setLinkedFlowId] = useState(null);

    useEffect(() => {
        fetchStatus();
        fetchFlows();
    }, [workspaceId]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchStatus = async () => {
        setIsRefreshing(true);
        try {
            const res = await authFetch(`${config.API_BASE}/whatsapp-cloud/status/${workspaceId}`);
            const data = await res.json();
            if (data.connected && data.credentials) {
                setPhoneNumberId(data.credentials.phone_number_id || '');
                setWabaId(data.credentials.waba_id || '');
            } else {
                // Not connected — redirect to setup
                navigate(`/${workspaceId}/whatsapp-cloud`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchFlows = async () => {
        try {
            const { data } = await supabase
                .from('flows')
                .select('id, name, updated_at')
                .eq('workspace_id', workspaceId)
                .order('updated_at', { ascending: false });
            if (data) setFlows(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Disconnect WhatsApp Cloud?")) return;
        try {
            await supabase.from('channels').delete()
                .eq('workspace_id', workspaceId)
                .eq('channel_type', 'whatsapp_cloud');
            navigate(`/${workspaceId}/whatsapp-cloud`);
        } catch (e) {
            showToast("Failed to disconnect", "error");
        }
    };

    const handleOpenFlow = (flowId) => {
        if (flowId) {
            navigate(`/${workspaceId}/flow-builder/${flowId}`);
        } else {
            navigate(`/${workspaceId}/flows`);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center">
                            <MessageCircle fill="white" stroke="white" size={15} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-800">WhatsApp Cloud</h1>
                            <p className="text-xs text-slate-400">Meta Cloud API</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/${workspaceId}/whatsapp-cloud`)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Settings
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            Disconnect
                        </button>
                    </div>
                </header>

                <div className="p-6 max-w-5xl mx-auto space-y-4">
                    {/* Main Connected Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-[#25D366] text-white rounded-full p-1.5 shadow-sm">
                                    <MessageCircle fill="white" stroke="white" size={14} />
                                </div>
                                <span className="font-bold text-slate-700 text-sm">WhatsApp Cloud</span>
                                <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Connected
                                </span>
                            </div>
                        </div>

                        {/* Business Info */}
                        <div className="px-6 py-5 bg-[#f8fafc] border-b border-slate-100">
                            <div className="flex items-start gap-16">
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Business Name</p>
                                    <p className="text-[13px] font-semibold text-slate-800">{activeWorkspace?.name || 'JusBot'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Business Id</p>
                                    <p className="text-[13px] font-semibold text-slate-800 font-mono">{wabaId || '—'}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchStatus}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                >
                                    <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                                    Sync Numbers
                                </button>
                            </div>
                        </div>

                        {/* Phone Numbers Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#f1f5f9] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide w-28">Status</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">WABA Name</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">MM Lite Status</th>
                                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">WhatsApp Bot</th>
                                        <th className="px-6 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {phoneNumberId ? (
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold bg-[#22c55e] text-white">Active</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 text-[13px]">{phoneNumberId}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">Primary Number</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 text-[13px]">{activeWorkspace?.name || 'JusBot'} Primary</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">{wabaId || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-[11px] font-semibold hover:bg-slate-50 bg-white shadow-sm transition-colors">
                                                    Check Status
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* Flow link input + Open button */}
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={linkedFlowId || ''}
                                                        onChange={e => setLinkedFlowId(e.target.value)}
                                                        className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 outline-none focus:border-blue-400 max-w-[140px]"
                                                    >
                                                        <option value="">Select Flow...</option>
                                                        {flows.map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleOpenFlow(linkedFlowId)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#25D366]/40 text-[#25D366] rounded-lg text-[11px] font-bold hover:bg-[#25D366]/5 bg-white shadow-sm transition-colors"
                                                    >
                                                        <MessageCircle size={11} fill="currentColor" />
                                                        Open Flow
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1.5">WhatsApp Flow</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                                                <RefreshCw className="mx-auto mb-2 opacity-30 animate-spin" size={20} />
                                                Loading number info...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Flowbuilder Tip */}
                    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
                        <div className="w-9 h-9 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Zap size={15} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700">Flowbuilder Integration</p>
                            <p className="text-xs text-slate-400 mt-0.5">Incoming messages trigger <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">whatsapp_cloud_incoming</code> in Flow Builder</p>
                        </div>
                        <button
                            onClick={() => navigate(`/${workspaceId}/flows`)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 shrink-0"
                        >
                            View Flows <ChevronRight size={14} />
                        </button>
                    </div>
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
