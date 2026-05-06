import { useState, useEffect } from "react";
import config from "../config";
import {
    Plug, Search, CheckCircle, ExternalLink, FileSpreadsheet
} from "lucide-react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useWorkspace } from "../contexts/WorkspaceContext";

// ... (Integration logos kept same as before, abbreviated here for brevity if allowed, but full content provided below)
const integrations = [
    {
        id: "whatsapp",
        name: "WhatsApp",
        desc: "Connect your WhatsApp Business Account. Send messages, templates, and automate customer support.",
        category: "Communication",
        color: "#25D366",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        logo: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.43 5.661 1.43h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        ),
    },
    {
        id: "instagram",
        name: "Instagram",
        desc: "Automate your Instagram DMs. Connect with your community and turn followers into customers.",
        category: "Communication",
        color: "#E1306C",
        bg: "#fff1f2",
        border: "#fecdd3",
        logo: (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
        ),
    },
    {
        id: "gmail",
        name: "Gmail",
        desc: "Send and receive emails directly from your flows. Automate email notifications and follow-ups.",
        category: "Communication",
        color: "#EA4335",
        bg: "#fef2f2",
        border: "#fecaca",
        logo: (
            <svg viewBox="0 0 48 48" width="28" height="28">
                <path fill="#EA4335" d="M6 40h6V22.5L4 17v20q0 1.25.875 2.125T6 40Z" />
                <path fill="#34A853" d="M36 40h6q1.25 0 2.125-.875T45 37V17l-9 5.5Z" />
                <path fill="#FBBC05" d="M36 11l9 5.5v1L24 26 3 17.5v-1L12 11Z" />
                <path fill="#4285F4" d="M6 11h36l-18 14ZM3 17.5 12 11v11.5Z" />
                <path fill="#C5221F" d="M45 17.5 36 11v11.5Z" />
            </svg>
        ),
    },
    {
        id: "google_sheets", // Changed ID to match provider name in DB
        name: "Google Sheets",
        desc: "Read and write data to spreadsheets. Log conversations, store leads, and sync contact info.",
        category: "Productivity",
        color: "#34A853",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        logo: (
            <svg viewBox="0 0 48 48" width="28" height="28">
                <path fill="#34A853" d="M29 3H10a3 3 0 0 0-3 3v36a3 3 0 0 0 3 3h28a3 3 0 0 0 3-3V15Z" />
                <path fill="#fff" fillOpacity=".3" d="M29 3v12h12Z" />
                <path fill="#fff" d="M14 22h20v2H14Zm0 5h20v2H14Zm0 5h13v2H14Z" />
                <path fill="#0f9d58" d="M29 3v12h12Z" />
            </svg>
        ),
    },
    // ... other integrations (razorpay, etc) kept same
    {
        id: "razorpay",
        name: "Razorpay",
        desc: "Accept payments inside WhatsApp conversations. Send payment links and confirm transactions instantly.",
        category: "Payments",
        color: "#2D8CFF",
        bg: "#eff6ff",
        border: "#bfdbfe",
        logo: (
            <svg viewBox="0 0 48 48" width="28" height="28">
                <rect width="48" height="48" rx="10" fill="#2D8CFF" />
                <path fill="#fff" d="M14 34 22 14h7l-3 8h5l-12 12Zm7-12 2-5h4l-2 5Z" />
            </svg>
        ),
    },
    {
        id: "calendly",
        name: "Calendly",
        desc: "Let users book meetings directly in chat. Sync availability and send automated reminders.",
        category: "Scheduling",
        color: "#006BFF",
        bg: "#eff6ff",
        border: "#bfdbfe",
        logo: (
            <svg viewBox="0 0 48 48" width="28" height="28">
                <rect width="48" height="48" rx="24" fill="#006BFF" />
                <path fill="#fff" d="M24 12a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm-1 4v8l6 3.5-1 1.7-7-4V19Z" />
            </svg>
        ),
    },
    {
        id: "shopify",
        name: "Shopify",
        desc: "Sync your store products, orders, and customers. Send order updates and abandoned cart reminders.",
        category: "Ecommerce",
        color: "#96BF48",
        bg: "#f7fee7",
        border: "#d9f99d",
        logo: (
            <svg viewBox="0 0 48 48" width="28" height="28">
                <path fill="#96BF48" d="M33.5 10.5s-.2-.1-.5-.1c-.3 0-3.8-.3-3.8-.3s-2.5-2.5-2.8-2.8c-.3-.3-.8-.2-.8-.2L24 8.5C23 8.2 21 7.5 19 8c-1.2.3-2.3 1.2-2.9 2.4-.6 1.2-.8 2.8-.8 4.4l-3.8 1.2S8 17.3 8 17.5L6 42l24 4 13-3.2L33.5 10.5Zm-7.3-2c-1 .3-2.1.9-3 1.9.8 0 1.7.3 2.4.8l.6-2.7Zm-1.5 4.2c-.9-.6-2-.9-3-.8.1-1.1.4-2 .9-2.7 1.1.2 2 1.2 2.1 3.5Zm2.3-4c1.4.5 2.3 1.9 2.6 4.2l-5.2 1.6c.4-3.5 1.5-5.4 2.6-5.8Z" />
                <path fill="#5E8E3E" d="M33 10.4c-.3 0-.5.1-.5.1L27 42l12.5-3L33 10.4Z" />
                <path fill="#fff" d="M24.5 19.5l-1.5 4.5s-1.4-.7-3-.7c-2.4 0-2.5 1.5-2.5 1.9 0 2 5.3 2.8 5.3 7.5 0 3.7-2.4 6.1-5.6 6.1-3.8 0-5.7-2.4-5.7-2.4l1-3.3s2 1.7 3.7 1.7c1.1 0 1.6-.9 1.6-1.5 0-2.6-4.3-2.7-4.3-7 0-3.6 2.6-7 7.7-7 2 0 3.3.6 3.3.6Z" />
            </svg>
        ),
    },
    {
        id: "woocommerce",
        name: "WooCommerce",
        desc: "Connect your WordPress store. Automate order notifications, stock alerts, and customer support.",
        category: "Ecommerce",
        color: "#7F54B3",
        bg: "#faf5ff",
        border: "#e9d5ff",
        logo: (
            <svg viewBox="0 0 48 48" width="28" height="28">
                <rect width="48" height="48" rx="10" fill="#7F54B3" />
                <path fill="#fff" d="M6 15a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H27l-3 6-3-6H9a3 3 0 0 1-3-3V15Z" />
                <path fill="#7F54B3" d="M11 18c0-.6.4-1 1-1s1 .4 1 1l1 7 3-5.5c.2-.4.5-.6.9-.6s.7.2.9.6l1.5 3 .8-1.8c.3-.6 1.2-.4 1.3.3l1 5h-14l1.6-9Zm16.5 5c0-2.5 2-4.5 4.5-4.5S36.5 20.5 36.5 23s-2 4.5-4.5 4.5-4.5-2-4.5-4.5Zm2 0c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5-2.5 1.1-2.5 2.5Z" />
            </svg>
        ),
    },
];

const categories = ["All", "Communication", "Productivity", "Payments", "Scheduling", "Ecommerce"];

export default function IntegrationsPage() {
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    /** @type {any} */
    const { activeWorkspace } = useWorkspace();
    const [searchParams] = useSearchParams();

    const [search, setSearch] = useState("");
    const [activeCategory, setCategory] = useState("All");
    /** @type {any} */
    const [connected, setConnected] = useState({});
    /** @type {string|null} */
    const [connecting, setConnecting] = useState(null);
    /** @type {any} */
    const [user, setUser] = useState(null);
    const [showSheetSelector, setShowSheetSelector] = useState(false);
    /** @type {any[]} */
    const [sheets, setSheets] = useState([]);
    const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState(null);
    const [showInstagramModal, setShowInstagramModal] = useState(false);
    /** @type {any[]} */
    const [instagramPages, setInstagramPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    /** @type {any} */
    const [selectedIGAccount, setSelectedIGAccount] = useState(null);


    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                checkConnections();
            }
        };
        getUser();

        // Check if returned from Google Auth
        const status = searchParams.get('status');
        if (status === 'success') {
            // refresh connections
            checkConnections();
        } else if (status === 'error') {
            alert("Failed to connect Google Sheets. Please check your credentials and try again.");
            // Strip the error status from URL to avoid repeated alerts
            navigate(`/${workspaceId}/integrations`, { replace: true });
        }
    }, [searchParams, user, workspaceId, navigate]);

    const checkConnections = async () => {
        const { data } = await supabase
            .from('integrations')
            .select('provider')
            .eq('workspace_id', workspaceId);

        if (data) {
            const newConnected = {};
            data.forEach((/** @type {any} */ conn) => {
                newConnected[conn.provider] = true;
            });
            setConnected(newConnected);
        }
    };

    const handleConnect = async (/** @type {string} */ id) => {
        if (id === 'google_sheets') {
            if ((/** @type {any} */ (connected))[id]) {
                // If already connected, show files/options or disconnect
                fetchSheets();
                setShowSheetSelector(true);
                return;
            }

            // Redirect to backend auth
            if (user) {
                setConnecting(id);
                // Note: using direct window.location for external redirect
                // Assumed backend is running on port 3000
                window.location.href = `${config.API_BASE}/auth/google?user_id=${user.id}&workspace_id=${workspaceId}`;
            } else {
                alert("Please log in first");
            }
            return;
        }

        if (id === 'whatsapp') {
            navigate(`/${workspaceId}/whatsapp-cloud`);
            return;
        }

        if (id === 'instagram') {
            setShowInstagramModal(true);
            return;
        }

        // Mock for others
        setConnecting(id);
        setTimeout(() => {
            setConnected((/** @type {any} */ p) => ({ ...p, [id]: !p[id] }));
            setConnecting(null);
        }, 1200);
    };

    const fetchSheets = async () => {
        if (!workspaceId) return;
        try {
            // Fetch list of sheets from backend with JWT auth
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${config.API_BASE}/sheets/list`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'x-workspace-id': workspaceId
                }
            });
            const data = await response.json();
            if (data.files) {
                setSheets(data.files);
            }
        } catch (error) {
            console.error("Failed to fetch sheets", error);
        }
    };

    const filtered = integrations.filter(i => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.desc.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === "All" || i.category === activeCategory;
        return matchSearch && matchCat;
    });

    return (
        <>
            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora',sans-serif", letterSpacing: "-0.03em" }}>
                        Integrations
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">Connect your favourite tools to supercharge your {activeWorkspace?.name || 'JusBot'} flows</p>
                </div>

                {/* Search + Category filter */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                        <Search size={16} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search integrations..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="text-sm text-slate-700 outline-none w-52 bg-transparent placeholder-slate-400"
                        />
                    </div>
                    {/* Categories */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                style={{
                                    background: activeCategory === cat ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#fff",
                                    color: activeCategory === cat ? "#fff" : "#64748b",
                                    border: activeCategory === cat ? "none" : "1px solid #e2e8f0",
                                    boxShadow: activeCategory === cat ? "0 4px 14px rgba(34,197,94,0.25)" : "none",
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-3 gap-5">
                    {filtered.map((item) => {
                        const isConnected = connected[item.id];
                        const isConnecting = connecting === item.id;

                        return (
                            <div key={item.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                                style={{ borderTop: `3px solid ${item.color}` }}
                            >
                                <div className="p-5">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                                            {item.logo}
                                        </div>
                                        {isConnected && (
                                            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                                                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                                                <CheckCircle size={11} /> Connected
                                            </span>
                                        )}
                                    </div>

                                    {/* Name + category */}
                                    <div className="mb-1 flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Sora',sans-serif", letterSpacing: "-0.02em" }}>
                                            {item.name}
                                        </h3>
                                    </div>
                                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md mb-3"
                                        style={{ background: item.bg, color: item.color }}>
                                        {item.category}
                                    </span>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-5" style={{ letterSpacing: "-0.01em" }}>
                                        {item.desc}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleConnect(item.id)}
                                            disabled={isConnecting}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                            style={{
                                                background: isConnected
                                                    ? "#f8fafc"
                                                    : isConnecting
                                                        ? "#f0fdf4"
                                                        : `linear-gradient(135deg,${item.color}ee,${item.color})`,
                                                color: isConnected ? "#64748b" : isConnecting ? "#16a34a" : "#fff",
                                                border: isConnected ? "1px solid #e2e8f0" : "none",
                                                boxShadow: (!isConnected && !isConnecting) ? `0 4px 14px ${item.color}44` : "none",
                                                opacity: isConnecting ? 0.8 : 1,
                                            }}
                                        >
                                            {isConnecting ? (
                                                <>
                                                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                                                    </svg>
                                                    Connecting…
                                                </>
                                            ) : isConnected ? (
                                                "Configure" // Changed from Disconnect to Configure for sheets
                                            ) : (
                                                "Connect"
                                            )}
                                        </button>

                                        {/* Reconnect button for Google Sheets if connected */}
                                        {isConnected && item.id === 'google_sheets' && (
                                            <button
                                                onClick={() => {
                                                    if (user) window.location.href = `${config.API_BASE}/auth/google?user_id=${user.id}`;
                                                }}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors flex-shrink-0"
                                                title="Reconnect"
                                            >
                                                <Plug size={15} />
                                            </button>
                                        )}

                                        <button
                                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors flex-shrink-0"
                                        >
                                            <ExternalLink size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sheet Selector Modal */}
            {showSheetSelector && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Select Spreadsheet</h3>
                                <p className="text-xs text-slate-500">Choose a file to connect with your chatbot</p>
                            </div>
                            <button onClick={() => setShowSheetSelector(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {sheets.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-green-500 rounded-full mx-auto mb-2"></div>
                                    <p className="text-sm text-slate-500">Loading sheets...</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {(/** @type {any[]} */ (sheets)).map(sheet => (
                                        <button
                                            key={sheet.id}
                                            onClick={() => setSelectedSpreadsheetId(sheet.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${selectedSpreadsheetId === sheet.id
                                                ? 'bg-green-50 border border-green-200'
                                                : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                                                <FileSpreadsheet size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${selectedSpreadsheetId === sheet.id ? 'text-green-700' : 'text-slate-700'}`}>
                                                    {sheet.name}
                                                </p>
                                                <p className="text-xs text-slate-400">ID: {sheet.id}</p>
                                            </div>
                                            {selectedSpreadsheetId === sheet.id && (
                                                <CheckCircle size={18} className="text-green-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setShowSheetSelector(false)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedSpreadsheetId}
                                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-200 disabled:opacity-50 disabled:shadow-none transition-all"
                                onClick={() => {
                                    alert(`Selected Sheet ID: ${selectedSpreadsheetId}`);
                                    setShowSheetSelector(false);
                                }}
                            >
                                Connect Sheet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instagram Connection Modal */}
            {showInstagramModal && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Connect Instagram Business Account</h3>
                                <p className="text-xs text-slate-500">Enable automated messaging for your Instagram</p>
                            </div>
                            <button onClick={() => {
                                setShowInstagramModal(false);
                                setInstagramPages([]);
                                setSelectedIGAccount(null);
                            }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
                            {instagramPages.length === 0 ? (
                                <div className="text-center py-6 w-full">
                                    <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-pink-500 border border-pink-100">
                                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-2">Login with Facebook</h4>
                                    <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                                        We need permission to access your Facebook Pages and linked Instagram Business accounts.
                                    </p>
                                    
                                    <button 
                                        onClick={() => {
                                            // In a real app, this would trigger FB SDK login
                                            // Mocking the page fetch for demonstration
                                            setLoadingPages(true);
                                            setTimeout(() => {
                                                setInstagramPages([
                                                    {
                                                        id: 'page123',
                                                        name: 'JusBot Official',
                                                        access_token: 'mock_token_1',
                                                        instagram_business_account: {
                                                            id: 'ig456',
                                                            username: 'reflx_app',
                                                            name: 'JusBot App'
                                                        }
                                                    },
                                                    {
                                                        id: 'page789',
                                                        name: 'Hxtreme Tech',
                                                        access_token: 'mock_token_2',
                                                        instagram_business_account: {
                                                            id: 'ig321',
                                                            username: 'hxtreme_official',
                                                            name: 'Hxtreme Tech'
                                                        }
                                                    }
                                                ]);
                                                setLoadingPages(false);
                                            }, 1500);
                                        }}
                                        className="w-full py-3.5 bg-[#1877F2] text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-all"
                                    >
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        Login with Facebook
                                    </button>
                                    
                                    {loadingPages && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
                                            <div className="animate-spin w-4 h-4 border-2 border-slate-200 border-t-pink-500 rounded-full"></div>
                                            <span className="text-xs">Fetching accounts...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full">
                                    <p className="text-sm font-semibold text-slate-500 mb-4">Select Instagram Account</p>
                                    <div className="space-y-2">
                                        {(/** @type {any[]} */ (instagramPages)).map(page => (
                                            <button
                                                key={page.id}
                                                onClick={() => setSelectedIGAccount(page)}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left ${
                                                    selectedIGAccount?.id === page.id 
                                                        ? 'bg-pink-50 border-pink-200 ring-2 ring-pink-100' 
                                                        : 'bg-white border-slate-100 hover:border-pink-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                                        <span className="font-bold text-pink-500">
                                                            {page.instagram_business_account.username[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">@{page.instagram_business_account.username}</p>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                                        Linked to: <span className="font-medium text-slate-600 truncate">{page.name}</span>
                                                    </p>
                                                </div>
                                                {selectedIGAccount?.id === page.id && (
                                                    <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white">
                                                        <CheckCircle size={14} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => {
                                    setShowInstagramModal(false);
                                    setInstagramPages([]);
                                    setSelectedIGAccount(null);
                                }}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedIGAccount}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:shadow-lg hover:shadow-pink-200 disabled:opacity-50 disabled:shadow-none transition-all"
                                onClick={async () => {
                                    try {
                                        const response = await fetch(`${config.API_BASE}/instagram/connect`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                workspace_id: workspaceId,
                                                user_id: user.id,
                                                facebook_page_id: selectedIGAccount.id,
                                                page_access_token: selectedIGAccount.access_token,
                                                instagram_account_id: selectedIGAccount.instagram_business_account.id,
                                                instagram_username: selectedIGAccount.instagram_business_account.username
                                            })
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                            setConnected((/** @type {any} */ p) => ({ ...p, instagram: true }));
                                            setShowInstagramModal(false);
                                            alert(`Successfully connected @${selectedIGAccount.instagram_business_account.username}`);
                                        }
                                    } catch (err) {
                                        console.error('Connection failed', err);
                                    }
                                }}
                            >
                                Connect Channel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
