import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Instagram, Info, CheckCircle, AlertCircle, RefreshCw, 
    Link2, Link2Off, Play, Pause, ArrowLeft
} from 'lucide-react';
import config from '../../config';

export default function InstagramConnect() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    // Mock states via localStorage
    const [isConnected, setIsConnected] = useState(false);
    const [isBotLinked, setIsBotLinked] = useState(false);
    const [isAccountActive, setIsAccountActive] = useState(true);

    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Mock Account Data
    const mockAccount = {
        name: "JusBot Official",
        id: "109847362514930",
        username: "reflx_app"
    };

    useEffect(() => {
        // Load initial state from local storage to mock backend
        const connected = localStorage.getItem(`reflx_instagram_connected_${workspaceId}`) === 'true';
        const linked = localStorage.getItem(`reflx_instagram_bot_linked_${workspaceId}`) === 'true';
        const active = localStorage.getItem(`reflx_instagram_active_${workspaceId}`);
        
        setIsConnected(connected);
        setIsBotLinked(linked);
        setIsAccountActive(active !== 'false'); // Default to true
    }, [workspaceId]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleConnect = () => {
        // Mock connection
        localStorage.setItem(`reflx_instagram_connected_${workspaceId}`, 'true');
        localStorage.setItem(`reflx_instagram_active_${workspaceId}`, 'true');
        setIsConnected(true);
        setIsAccountActive(true);
        showToast('Instagram connected successfully', 'success');
    };

    const handleDisconnect = () => {
        // Mock disconnection
        localStorage.removeItem(`reflx_instagram_connected_${workspaceId}`);
        localStorage.removeItem(`reflx_instagram_bot_linked_${workspaceId}`);
        localStorage.removeItem(`reflx_instagram_active_${workspaceId}`);
        setIsConnected(false);
        setIsBotLinked(false);
        setIsAccountActive(true);
        setIsDisconnectModalOpen(false);
        showToast('Disconnected successfully', 'success');
    };

    const handleToggleBotLink = () => {
        const newValue = !isBotLinked;
        setIsBotLinked(newValue);
        localStorage.setItem(`reflx_instagram_bot_linked_${workspaceId}`, String(newValue));
        showToast(newValue ? 'Bot linked successfully' : 'Bot unlinked successfully');
    };

    const handleToggleActive = () => {
        const newValue = !isAccountActive;
        setIsAccountActive(newValue);
        localStorage.setItem(`reflx_instagram_active_${workspaceId}`, String(newValue));
        showToast(newValue ? 'Account is now active' : 'Account paused');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header matches WhatsApp exactly */}
            <header className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10 relative">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/${workspaceId}/integrations`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-pink-500 to-yellow-500 shadow-sm shadow-pink-100">
                        <Instagram className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 leading-tight">Instagram</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isConnected && (
                        <button onClick={() => setIsDisconnectModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                            Disconnect
                        </button>
                    )}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${isConnected ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-pink-500' : 'bg-slate-400'}`}></span>
                        {isConnected ? 'Connected' : 'Not Connected'}
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-8 bg-slate-50/50">
                {!isConnected ? (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
                        {/* Card Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2 bg-white">
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Instagram className="text-pink-500 w-full h-full" />
                            </div>
                            <h2 className="text-sm font-semibold text-slate-800">Instagram Setup</h2>
                            <Info size={14} className="text-slate-400" />
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-6">
                                You can automate Instagram DMs and comments on a connected Instagram Business Account.
                            </p>
                            <button
                                onClick={handleConnect}
                                className="px-5 py-2.5 bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all shadow-md shadow-pink-200"
                            >
                                Connect Instagram
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Link</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-100 to-rose-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                                                {mockAccount.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{mockAccount.name}</p>
                                                <p className="text-xs text-slate-400">@{mockAccount.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                {mockAccount.id}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={handleToggleBotLink}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                    isBotLinked 
                                                        ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' 
                                                        : 'bg-white border-pink-200 text-pink-600 hover:bg-pink-50'
                                                }`}
                                            >
                                                {isBotLinked ? (
                                                    <><Link2Off size={14} /> Unlink</>
                                                ) : (
                                                    <><Link2 size={14} /> Link</>
                                                )}
                                            </button>
                                            {isBotLinked && (
                                                <button
                                                    onClick={() => navigate(`/${workspaceId}/instagram-dashboard`)}
                                                    className="px-3 py-1.5 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                                                >
                                                    Open
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={handleToggleActive}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                isAccountActive 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                                    : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                            }`}
                                        >
                                            {isAccountActive ? (
                                                <><Play size={14} fill="currentColor" /> Active</>
                                            ) : (
                                                <><Pause size={14} fill="currentColor" /> Paused</>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Disconnect Modal matches exactly */}
            {isDisconnectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Disconnect Instagram?</h3>
                            <p className="text-sm text-slate-500 text-center mb-6">
                                This will remove your connection. Your automations will stop working until you reconnect.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsDisconnectModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDisconnect}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast System */}
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-[14px] font-medium ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-slate-100 text-slate-700'}`}>
                    {toast.type === 'error' ? (
                        <AlertCircle size={18} />
                    ) : (
                        <CheckCircle size={18} fill="#4ade80" color="white" strokeWidth={2.5} />
                    )}
                    {toast.message}
                </div>
            </div>
        </div>
    );
}
