import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MessageSquare, BarChart2, Users, Zap, Settings, ChevronDown,
    Megaphone, Smartphone, Image, Sparkles, CheckCircle, Plus,
    Facebook, Link, ChevronRight, ArrowLeft, Trash2, Edit3
} from "lucide-react";
import config from "../config";

// ─── Inner Sidebar Nav Items ────────────────────────────────────────────────
const NAV_ITEMS = [
    { key: "ads_manager", label: "Ads Manager",    icon: BarChart2 },
    { key: "events",      label: "Events",         icon: Zap },
    { key: "leads",       label: "Leads",          icon: Users },
    { key: "audiences",   label: "Audiences",      icon: Users },
    { key: "welcome_seq", label: "Welcome Sequences", icon: MessageSquare },
    { key: "setup",       label: "Setup",          icon: Settings },
];

// ─── Setup View ─────────────────────────────────────────────────────────────
function SetupView({ onCreateAd }) {
    const [fbConnected, setFbConnected] = useState(false);
    const [fbPage, setFbPage] = useState("");
    const [waNumber, setWaNumber] = useState("");
    const [verified, setVerified] = useState(false);

    return (
        <div className="flex-1 p-8 overflow-y-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="max-w-3xl mx-auto space-y-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Row 1 — Connect Facebook */}
                <div className="flex items-center justify-between px-8 py-7 border-b border-slate-100">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-800">Connect your Facebook account</h3>
                        <p className="text-sm text-slate-500">Allow JusBot to receive advertisement analytics and events from Facebook</p>
                        <p className="text-xs text-slate-400 mt-0.5">*Please select <span className="font-bold text-slate-600">OPT into all</span> option for Business and Pages*</p>
                    </div>
                    {fbConnected ? (
                        <button
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm font-semibold cursor-default"
                        >
                            <CheckCircle size={16} /> Connected
                        </button>
                    ) : (
                        <button
                            onClick={() => setFbConnected(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-semibold transition-all shadow-sm"
                        >
                            <Facebook size={16} />
                            Continue With Facebook
                        </button>
                    )}
                </div>

                {/* Row 2 — Choose Facebook Page */}
                <div className="flex items-center justify-between px-8 py-7 border-b border-slate-100">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-800">
                            Choose your <span className="text-[#1877F2]">Facebook</span> page
                        </h3>
                        <p className="text-sm text-slate-500">Select Facebook page which will be used to ad</p>
                    </div>
                    <div className="relative">
                        <select
                            value={fbPage}
                            onChange={e => setFbPage(e.target.value)}
                            className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-600 focus:border-blue-400 outline-none transition-all min-w-[180px]"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            <option value="">Choose your page</option>
                            <option value="page1">JusBot Brand Store</option>
                            <option value="page2">My Business Page</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Row 3 — Link WhatsApp Number */}
                <div className="flex items-center justify-between px-8 py-7 border-b border-slate-100">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-800">
                            Link <span className="text-[#25D366]">Whatsapp</span> Number
                        </h3>
                        <p className="text-sm text-slate-500">
                            Link your WhatsApp business number with selected Facebook page to receive<br />
                            messages directly over WhatsApp
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="+91 00000 00000"
                            value={waNumber}
                            onChange={e => setWaNumber(e.target.value)}
                            className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:border-green-400 outline-none transition-all w-40"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                        <button
                            onClick={() => waNumber && setVerified(true)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                                verified
                                    ? "bg-green-50 border-green-300 text-green-700"
                                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                        >
                            {verified ? "Verified ✓" : "Verify"}
                        </button>
                    </div>
                </div>

                {/* Row 4 — Create Advertisement */}
                <div className="flex items-center justify-between px-8 py-7">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-800">Create Advertisement</h3>
                        <p className="text-sm text-slate-500">
                            Click Create Ad to start receiving leads directly on your WhatsApp.
                        </p>
                    </div>
                    <button
                        onClick={onCreateAd}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-sm font-semibold transition-all"
                    >
                        <Plus size={15} />
                        Create Ad
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Campaign (Create Ad) View ───────────────────────────────────────────────
function CampaignView({ onBack }) {
    const [campaignName, setCampaignName] = useState("Summer Collection Lead Funnel");
    const [adText, setAdText] = useState(
        "Claim your 15% discount code! 🛍️ Click the button below to start chatting with our WhatsApp bot and browse our premium catalog instantly."
    );
    const [mediaUrl, setMediaUrl] = useState(
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80"
    );
    const [ctaText, setCtaText] = useState("Send WhatsApp Message");
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "" });

    const showToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: "" }), 3500);
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast("Meta Ad Campaign configurations saved!");
        }, 1200);
    };

    const triggerImageUpload = () => {
        const url = prompt("Enter an image URL for the Ad creative:", mediaUrl);
        if (url) setMediaUrl(url);
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Left — Campaign Settings */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-3xl">

                {/* Back breadcrumb */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-2"
                >
                    <ArrowLeft size={14} /> Back to Setup
                </button>

                {/* Campaign Settings card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <Sparkles size={16} className="text-emerald-500" /> Campaign Settings
                    </h2>

                    <div className="space-y-5">
                        {/* Campaign Name */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Campaign Name
                            </label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={e => setCampaignName(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all font-semibold text-slate-700"
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                            />
                        </div>

                        {/* Primary Text */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Primary Text (Ad Creative Copy)
                            </label>
                            <textarea
                                rows={4}
                                value={adText}
                                onChange={e => setAdText(e.target.value)}
                                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all text-slate-600 leading-relaxed resize-none"
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                            />
                        </div>

                        {/* Media + CTA */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Ad Creative Media
                                </label>
                                <button
                                    onClick={triggerImageUpload}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50/30 rounded-xl text-xs font-bold text-slate-500 transition-all"
                                >
                                    <Image size={13} className="text-slate-400" /> Change Image URL
                                </button>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Call to Action Button
                                </label>
                                <select
                                    value={ctaText}
                                    onChange={e => setCtaText(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none transition-all font-medium text-slate-700"
                                    style={{ fontFamily: "'Poppins', sans-serif" }}
                                >
                                    <option value="Send WhatsApp Message">Send WhatsApp Message (Recommended)</option>
                                    <option value="Contact Us">Contact Us via WhatsApp</option>
                                    <option value="Learn More">Learn More</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flow Builder Destination */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Flow Builder Destination</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        When users tap your Facebook Ad, their WhatsApp app opens automatically with a pre-filled trigger keyword. Ensure your target flow handles this keyword.
                    </p>
                    <div className="flex items-center gap-3 p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <MessageSquare size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700">Trigger Event Matching</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Matched Flow: Winback Flow "21 days" Flow</p>
                        </div>
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full shrink-0">Connected</span>
                    </div>
                </div>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-7 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-md disabled:opacity-60"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        {isSaving ? "Saving…" : "Save Campaign"}
                    </button>
                </div>
            </div>

            {/* Right — Phone Mockup */}
            <div className="flex-1 bg-slate-100/60 border-l border-slate-200 p-8 flex items-center justify-center overflow-y-auto">
                <div className="w-full max-w-[280px]">
                    <div className="text-center mb-5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Smartphone size={12} /> Real-time Feed Simulation
                        </span>
                    </div>
                    {/* Phone shell */}
                    <div className="bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative">
                        {/* Camera bar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-full z-20 flex items-center justify-between px-4">
                            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                            <span className="w-4 h-1 bg-slate-800 rounded-full" />
                        </div>
                        {/* Screen */}
                        <div className="bg-white rounded-[38px] overflow-hidden border border-slate-900/20 select-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {/* Status bar */}
                            <div className="px-6 pt-5 pb-2 bg-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>9:41</span>
                                <div className="flex gap-1.5 items-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/>
                                    </svg>
                                    <span>5G</span>
                                </div>
                            </div>
                            {/* FB Feed Post */}
                            <div className="p-3.5 space-y-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-black shrink-0">JB</div>
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                                            JusBot Brand Store
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-blue-500 font-medium text-[9px]">Follow</span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">Sponsored · Paid Ad</div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                                    {adText || "Enter primary text above…"}
                                </p>
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                                    <img
                                        src={mediaUrl}
                                        alt="Ad Creative"
                                        className="w-full h-full object-cover"
                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=600&auto=format&fit=crop&q=80"; }}
                                    />
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">WHATSAPP.COM</p>
                                        <p className="text-[11px] font-extrabold text-slate-900 truncate mt-0.5">{campaignName}</p>
                                        <p className="text-[9px] text-slate-500 truncate mt-0.5">Start a conversation on Wh…</p>
                                    </div>
                                    <button className="flex items-center gap-1 px-3 py-2 bg-[#25D366] text-white rounded-lg text-[10px] font-extrabold shrink-0">
                                        <MessageSquare size={9} fill="currentColor" /> {ctaText}
                                    </button>
                                </div>
                            </div>
                            {/* Home indicator */}
                            <div className="h-9 bg-white flex items-center justify-center">
                                <div className="w-20 h-1 bg-slate-200 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"}`}>
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl bg-slate-900 text-white text-sm font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <CheckCircle size={15} className="text-green-400" />
                    {toast.message}
                </div>
            </div>
        </div>
    );
}

// ─── Welcome Sequences View ──────────────────────────────────────────────────
function WelcomeSequencesView() {
    const { workspaceId } = useParams();
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wabaId, setWabaId] = useState("");
    
    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", text: "", autofill_message: "", ice_breakers: [] });
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Dummy load for wabaId from settings or env
        // In real app, fetch from workspace settings
        const fetchSequences = async () => {
            const wId = "103630605943482"; // Hardcoded for demo/sandbox or fetched
            setWabaId(wId);
            try {
                const res = await fetch(`${config.API_BASE}/whatsapp-ads/welcome-sequences?workspaceId=${workspaceId}&wabaId=${wId}`);
                if (res.ok) {
                    setSequences(await res.json());
                }
            } catch(e) { console.error(e); } finally { setLoading(false); }
        };
        fetchSequences();
    }, [workspaceId]);

    const handleAddIcebreaker = () => {
        if (formData.ice_breakers.length < 5) {
            setFormData({ ...formData, ice_breakers: [...formData.ice_breakers, ""] });
        }
    };

    const handleIcebreakerChange = (index, val) => {
        const newIb = [...formData.ice_breakers];
        newIb[index] = val;
        setFormData({ ...formData, ice_breakers: newIb });
    };

    const handleRemoveIcebreaker = (index) => {
        const newIb = formData.ice_breakers.filter((_, i) => i !== index);
        setFormData({ ...formData, ice_breakers: newIb });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.text) return alert("Name and welcome text are required.");
        setSaving(true);
        try {
            const sequenceData = {
                sequence_id: editId,
                name: formData.name,
                welcome_message_sequence: {
                    text: formData.text,
                    autofill_message: formData.autofill_message ? { content: formData.autofill_message } : undefined,
                    ice_breakers: formData.ice_breakers.filter(b => b.trim() !== "").map(b => ({ title: b }))
                }
            };
            
            const res = await fetch(`${config.API_BASE}/whatsapp-ads/welcome-sequences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId, wabaId, ...sequenceData })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save sequence");
            }
            
            setIsFormOpen(false);
            setEditId(null);
            setFormData({ name: "", text: "", autofill_message: "", ice_breakers: [] });
            
            // Refetch
            const refetch = await fetch(`${config.API_BASE}/whatsapp-ads/welcome-sequences?workspaceId=${workspaceId}&wabaId=${wabaId}`);
            if (refetch.ok) setSequences(await refetch.json());
            
        } catch(e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (seq) => {
        setEditId(seq.sequence_id);
        const json = seq.welcome_message_sequence_json || {};
        setFormData({
            name: seq.name,
            text: json.text || "",
            autofill_message: json.autofill_message?.content || "",
            ice_breakers: (json.ice_breakers || []).map(ib => ib.title)
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (seqId) => {
        if (!window.confirm("Delete this sequence? It cannot be linked to any active ad.")) return;
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-ads/welcome-sequences/${seqId}?workspaceId=${workspaceId}&wabaId=${wabaId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSequences(sequences.filter(s => s.sequence_id !== seqId));
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch(e) { alert(e.message); }
    };

    if (isFormOpen) {
        return (
            <div className="flex-1 overflow-y-auto p-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="max-w-2xl mx-auto space-y-6">
                    <button onClick={() => setIsFormOpen(false)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-2">
                        <ArrowLeft size={14} /> Back to Sequences
                    </button>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h2 className="text-base font-extrabold text-slate-800">{editId ? "Edit Sequence" : "Create Welcome Sequence"}</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Sequence Name (Internal)</label>
                                <input 
                                    type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Welcome Message Text</label>
                                <textarea 
                                    rows={3} value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})}
                                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Autofill Pre-filled Reply (Optional)</label>
                                <input 
                                    type="text" value={formData.autofill_message} onChange={e => setFormData({...formData, autofill_message: e.target.value})}
                                    placeholder="e.g. Hello! Can I get more info on this!"
                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Ice Breakers / Quick Replies (Max 5)</label>
                                <div className="space-y-2">
                                    {formData.ice_breakers.map((ib, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input 
                                                type="text" value={ib} onChange={e => handleIcebreakerChange(i, e.target.value)}
                                                className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50"
                                            />
                                            <button onClick={() => handleRemoveIcebreaker(i)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                                {formData.ice_breakers.length < 5 && (
                                    <button onClick={handleAddIcebreaker} className="mt-2 text-xs font-bold text-blue-600 hover:underline">+ Add Icebreaker</button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-4">
                            <button onClick={handleSave} disabled={saving} className="px-7 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 disabled:opacity-50">
                                {saving ? "Saving..." : "Save Sequence"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Welcome Message Sequences</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage Click-to-WhatsApp ad welcome sequences via the Meta API.</p>
                    </div>
                    <button onClick={() => { setEditId(null); setFormData({ name: "", text: "", autofill_message: "", ice_breakers: [] }); setIsFormOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-sm">
                        <Plus size={16} /> Create Sequence
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Sequence ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-slate-500">Loading...</td></tr>
                            ) : sequences.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-12 text-slate-500">No welcome sequences found.</td></tr>
                            ) : (
                                sequences.map(seq => (
                                    <tr key={seq.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{seq.sequence_id}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-800">{seq.name}</td>
                                        <td className="px-6 py-4">
                                            {seq.is_used_in_ad ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Used in Ad</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">Not Used</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(seq)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1" title="Edit"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDelete(seq.sequence_id)} disabled={seq.is_used_in_ad} className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent" title="Delete"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Placeholder Views ───────────────────────────────────────────────────────
function PlaceholderView({ label }) {
    return (
        <div className="flex-1 flex items-center justify-center p-12" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                    <BarChart2 size={28} className="text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-400">{label}</p>
                <p className="text-sm text-slate-300">This section is coming soon.</p>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function WhatsAppAd() {
    const [activeTab, setActiveTab] = useState("setup");
    const [showCreateAd, setShowCreateAd] = useState(false);

    const renderContent = () => {
        if (activeTab === "setup") {
            if (showCreateAd) return <CampaignView onBack={() => setShowCreateAd(false)} />;
            return <SetupView onCreateAd={() => setShowCreateAd(true)} />;
        }
        if (activeTab === "welcome_seq") {
            return <WelcomeSequencesView />;
        }
        return <PlaceholderView label={NAV_ITEMS.find(n => n.key === activeTab)?.label || activeTab} />;
    };

    return (
        <div className="flex-1 flex flex-col min-h-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-3 shrink-0 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-sm">
                    <Megaphone fill="white" stroke="white" size={16} />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-800 leading-tight">Click to WhatsApp Ad</h1>
                    <p className="text-xs text-slate-400 leading-tight">Drive high-intent Facebook & Instagram traffic directly to your bot</p>
                </div>
            </header>

            {/* Body: Inner Sidebar + Content */}
            <div className="flex flex-1 min-h-0">
                {/* Inner Sidebar */}
                <aside className="w-48 bg-white border-r border-slate-200 flex flex-col py-3 shrink-0">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => { setActiveTab(item.key); setShowCreateAd(false); }}
                                className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-all text-left ${
                                    isActive
                                        ? "bg-slate-100 text-slate-900 border-r-2 border-slate-800"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                                <Icon size={16} className={isActive ? "text-slate-700" : "text-slate-400"} />
                                {item.label}
                            </button>
                        );
                    })}
                </aside>

                {/* Content area */}
                <div className="flex-1 flex overflow-hidden bg-slate-50">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
