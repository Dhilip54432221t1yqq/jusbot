import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Info, MoreHorizontal, Link2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import config from "../config";

export default function WhatsAppCloudSetup() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [fbAppId, setFbAppId] = useState('1336518974614294');
    const [fbConfigId, setFbConfigId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [phoneId, setPhoneId] = useState('');
    

    const [isConnected, setIsConnected] = useState(() => localStorage.getItem(`reflx_whatsapp_connected_${workspaceId}`) === 'true');
    const [isBotLinked, setIsBotLinked] = useState(() => localStorage.getItem(`reflx_whatsapp_bot_linked_${workspaceId}`) === 'true');
    const [isAccountActive, setIsAccountActive] = useState(() => localStorage.getItem(`reflx_whatsapp_account_active_${workspaceId}`) !== 'false');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isFbReady, setIsFbReady] = useState(false);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // 1. Fetch current status and App ID configuration from backend
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await authFetch(`${config.API_BASE}/whatsapp-cloud/status/${workspaceId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.fbAppId) setFbAppId(data.fbAppId);
                    if (data.fbConfigId) setFbConfigId(data.fbConfigId);
                    
                    if (data.connected) {
                        setIsConnected(true);
                        setWabaId(data.wabaId || '');
                        setPhoneId(data.phoneNumberId || '');
                        setIsAccountActive(data.isAccountActive);
                        setIsBotLinked(data.isBotLinked);
                        localStorage.setItem(`reflx_whatsapp_connected_${workspaceId}`, 'true');
                        if (data.isAccountActive !== undefined) localStorage.setItem(`reflx_whatsapp_account_active_${workspaceId}`, String(data.isAccountActive));
                        if (data.isBotLinked !== undefined) localStorage.setItem(`reflx_whatsapp_bot_linked_${workspaceId}`, String(data.isBotLinked));
                        if (data.isOpenBot !== undefined) localStorage.setItem(`reflx_whatsapp_bot_opened_${workspaceId}`, String(data.isOpenBot));
                    }
                }
            } catch (e) {
                console.error("Error fetching status:", e);
            }
        };
        fetchStatus();
    }, [workspaceId, authFetch]);

    // 2. Load Facebook JS SDK asynchronously
    useEffect(() => {
        if (!fbAppId) return;

        const initFB = () => {
            window.FB.init({
                appId            : fbAppId,
                autoLogAppEvents : true,
                xfbml            : true,
                version          : 'v25.0'
            });
            setIsFbReady(true);
        };

        // If FB is already loaded (e.g. hot reload), just re-init
        if (window.FB) {
            initFB();
            return;
        }

        window.fbAsyncInit = initFB;

        const scriptId = 'facebook-jssdk';
        if (!document.getElementById(scriptId)) {
            const js = document.createElement('script');
            js.id = scriptId;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            js.async = true;
            js.defer = true;
            js.crossOrigin = "anonymous";
            document.getElementsByTagName('head')[0].appendChild(js);
        }
    }, [fbAppId]);

    // 3. Listen for Embedded Signup postMessage event containing WABA/Phone IDs
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== "https://www.facebook.com") return;
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.event === 'FINISH') {
                        const wabaVal = data.waba_id;
                        const phoneVal = data.phone_number_id;
                        if (wabaVal) setWabaId(wabaVal);
                        if (phoneVal) setPhoneId(phoneVal);
                        console.log("Captured Embedded Signup Event data:", data);
                    }
                }
            } catch (err) {}
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // 4. Launch Embedded Signup Flow or Manual setup
    const handleConnect = async () => {
        // Embedded Signup path — requires FB SDK to be ready
        if (!window.FB || !isFbReady) {
            showToast("Facebook SDK is still loading. Please try again in a moment.", "error");
            return;
        }

        // config_id is REQUIRED for Facebook Login for Business (per Meta docs)
        // Without it, the FB.login popup will not open
        if (!fbConfigId) {
            showToast("WhatsApp Embedded Signup Configuration ID is not set. Contact your admin.", "error");
            return;
        }

        setIsConnecting(true);

        try {
            // Per Meta docs (Facebook Login for Business — Business Integration System User token flow):
            // config_id replaces scope, response_type must be 'code', override_default_response_type must be true
            // extras.featureType is required for WhatsApp Embedded Signup
            window.FB.login(function(response) {
                if (response.authResponse) {
                    const code = response.authResponse.code;

                    // Server-to-server token exchange (never expose app secret client-side)
                    // GET https://graph.facebook.com/v25.0/oauth/access_token?client_id=&client_secret=&code=
                    authFetch(`${config.API_BASE}/whatsapp-cloud/exchange-code`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            workspaceId,
                            code,
                            wabaId: wabaId || undefined,
                            phoneId: phoneId || undefined
                        })
                    }).then(async (res) => {
                        if (res.ok) {
                            const data = await res.json();
                            setIsConnected(true);
                            setWabaId(data.wabaId || wabaId);
                            setPhoneId(data.phoneId || phoneId);
                            localStorage.setItem(`reflx_whatsapp_connected_${workspaceId}`, 'true');
                            showToast("WhatsApp connected via Facebook Embedded Signup!");
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            return res.json().then(errData => {
                                showToast(errData.error || "Failed to exchange token", "error");
                            });
                        }
                    }).catch(() => {
                        showToast("An error occurred during token exchange", "error");
                    }).finally(() => {
                        setIsConnecting(false);
                    });
                } else {
                    // User closed the popup or cancelled
                    setIsConnecting(false);
                    showToast("Login cancelled. Please try again.", "error");
                }
            }, {
                // Exact parameters per Meta docs for Business Integration System User access tokens
                config_id: fbConfigId,                    // Required: Configuration ID from Meta App Dashboard
                response_type: 'code',                    // Required: SISU tokens require authorization code grant
                override_default_response_type: true,     // Required: must be true when using response_type
                // extras.featureType is required for WhatsApp Embedded Signup
                extras: {
                    featureType: 'whatsapp_embedded_signup',
                    sessionInfoVersion: 2
                }
            });
        } catch (err) {
            console.error('FB.login error:', err);
            setIsConnecting(false);
            showToast("Could not open Facebook login. Ensure popups are allowed.", "error");
        }
    };

    const handleOpenBot = async () => {
        localStorage.setItem(`reflx_whatsapp_bot_opened_${workspaceId}`, 'true');
        try {
            await authFetch(`${config.API_BASE}/whatsapp-cloud/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId, isOpenBot: true })
            });
        } catch(e) {
            console.error("Failed to sync bot opened state");
        }
        showToast("WhatsApp Bot Activated!");
        navigate(`/${workspaceId}/whatsapp/templates`);
        window.location.reload(); 
    };

    const handleDisconnect = async () => {
        setIsDisconnectModalOpen(false);
        try {
            await authFetch(`${config.API_BASE}/whatsapp-cloud/disconnect/${workspaceId}`, {
                method: 'DELETE'
            });
        } catch(e) {
            console.warn("Backend disconnect failed:", e);
        }

        localStorage.removeItem(`reflx_whatsapp_connected_${workspaceId}`);
        localStorage.removeItem(`reflx_whatsapp_bot_opened_${workspaceId}`);
        localStorage.removeItem(`reflx_whatsapp_bot_linked_${workspaceId}`);
        localStorage.removeItem(`reflx_whatsapp_account_active_${workspaceId}`);
        
        setIsConnected(false);
        setIsBotLinked(false);
        setIsAccountActive(true);
        setWabaId('');
        setPhoneId('');
        showToast("Disconnected successfully");
        
        navigate(`/${workspaceId}/whatsapp-cloud`);
        window.location.reload();
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/${workspaceId}/integrations`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <img src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/WhatsApp%20Icon.png" alt="WhatsApp" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 leading-tight">WhatsApp Cloud</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isConnected && (
                        <button onClick={() => setIsDisconnectModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                            Disconnect
                        </button>
                    )}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}></span>
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
                                <img src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/WhatsApp%20Icon.png" alt="WhatsApp" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-sm font-semibold text-slate-800">WhatsApp Setup</h2>
                            <Info size={14} className="text-slate-400" />
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                            <div className="space-y-4">
                                {/* Config ID missing warning (keeps it for debugging if needed) */}
                                {!fbConfigId && (
                                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-w-2xl">
                                        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                        <div className="text-xs text-amber-700">
                                            <span className="font-bold">Configuration ID missing.</span> Add <code className="bg-amber-100 px-1 rounded">FB_CONFIG_ID</code> to your server <code className="bg-amber-100 px-1 rounded">.env</code>. Get it from <span className="font-semibold">Meta App Dashboard → Facebook Login for Business → Configurations</span>.
                                        </div>
                                    </div>
                                )}
                                <p className="text-[13px] text-slate-600">
                                    You can automate WhatsApp messages on a connected WhatsApp Business Account.
                                </p>
                                
                                <div className="pt-2">
                                    <button 
                                        onClick={handleConnect} 
                                        disabled={isConnecting || !isFbReady}
                                        style={{ backgroundColor: isConnecting || !isFbReady ? '#8fdba7' : '#25D366' }}
                                        className="px-6 py-2.5 text-white font-bold text-sm rounded-lg hover:opacity-90 active:opacity-95 transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        {isConnecting ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : !isFbReady ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : null}
                                        {isConnecting ? "Connecting..." : !isFbReady ? "Loading SDK..." : "Connect WhatsApp"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                            <div className="w-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                {/* Business Details */}
                                <div className="px-6 py-5">
                                    <div className="text-xs text-slate-500 font-medium">Business Name</div>
                                    <div className="text-sm font-semibold text-slate-800 mb-4 mt-0.5">Jusbot</div>
                                    
                                    <div className="text-xs text-slate-500 font-medium">Business Id</div>
                                    <div className="text-sm font-semibold text-slate-800 font-mono mb-5 mt-0.5">{wabaId || '655465465465453453'}</div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">
                                            + Add Number
                                        </button>
                                        <button className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                                            <RefreshCw size={13} /> Sync Numbers
                                        </button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="w-full overflow-x-auto border-t border-slate-200">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-100/70 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-bold text-slate-600">Status</th>
                                                <th className="px-6 py-3 text-xs font-bold text-slate-600">Phone Number</th>
                                                <th className="px-6 py-3 text-xs font-bold text-slate-600">WABA Name</th>
                                                <th className="px-6 py-3 text-xs font-bold text-slate-600">MM Lite Status</th>
                                                <th className="px-6 py-3 text-xs font-bold text-slate-600">WhatsApp Bot</th>
                                                <th className="px-6 py-3 text-xs font-bold text-slate-600"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr className="bg-white">
                                                <td className="px-6 py-4">
                                                    <button 
                                                        onClick={async () => {
                                                            const newState = !isAccountActive;
                                                            localStorage.setItem(`reflx_whatsapp_account_active_${workspaceId}`, String(newState));
                                                            setIsAccountActive(newState);
                                                            try {
                                                                await authFetch(`${config.API_BASE}/whatsapp-cloud/settings`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ workspaceId, isAccountActive: newState })
                                                                });
                                                            } catch(e) { console.error(e); }
                                                        }}
                                                        className={`${isAccountActive ? 'bg-[#25D366] text-white' : 'bg-slate-200 text-slate-600'} text-[11px] font-bold px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity`}
                                                    >
                                                        {isAccountActive ? 'Active' : 'Paused'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-800">{phoneId || '919787866776'}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Jusbot</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-800">Jusbot</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{wabaId || '655465465465453453'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button className="bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-bold px-4 py-1.5 rounded-md hover:bg-slate-200 transition-colors">
                                                        Check Status
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {isBotLinked ? (
                                                            <>
                                                                <button 
                                                                    onClick={handleOpenBot}
                                                                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
                                                                >
                                                                    <div className="w-3.5 h-3.5">
                                                                        <img src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/WhatsApp%20Icon.png" alt="WA" className="w-full h-full object-contain" />
                                                                    </div>
                                                                    Open
                                                                </button>
                                                                <button 
                                                                    onClick={async () => {
                                                                        localStorage.setItem(`reflx_whatsapp_bot_linked_${workspaceId}`, 'false');
                                                                        setIsBotLinked(false);
                                                                        try {
                                                                            await authFetch(`${config.API_BASE}/whatsapp-cloud/settings`, {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ workspaceId, isBotLinked: false })
                                                                            });
                                                                        } catch(e) { console.error(e); }
                                                                    }}
                                                                    className="p-1.5 border border-slate-200 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                                                                    title="Unlink"
                                                                >
                                                                    <Link2 size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                onClick={async () => {
                                                                    localStorage.setItem(`reflx_whatsapp_bot_linked_${workspaceId}`, 'true');
                                                                    setIsBotLinked(true);
                                                                    try {
                                                                        await authFetch(`${config.API_BASE}/whatsapp-cloud/settings`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ workspaceId, isBotLinked: true })
                                                                        });
                                                                    } catch(e) { console.error(e); }
                                                                }}
                                                                className="flex items-center gap-1.5 bg-white text-blue-600 border border-blue-200 px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm"
                                                            >
                                                                <Link2 size={13} />
                                                                Link
                                                            </button>
                                                        )}
                                                    </div>
                                                    {isBotLinked && <div className="text-[11px] text-slate-500 mt-1">WhatsApp Flow</div>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition-colors">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
            </div>

            {/* Disconnect Modal */}
            {isDisconnectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Disconnect WhatsApp?</h3>
                            <p className="text-sm text-slate-500 text-center mb-6">
                                This will remove your connection. Your flows will stop working until you reconnect.
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
