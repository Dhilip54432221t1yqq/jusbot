import { useState } from "react";
import { Copy, Check, MessageCircle, X, Send, Palette, Type, AlignLeft, Phone, ChevronDown, Settings } from "lucide-react";
import { buildSnippet } from "./widgetSnippet";

const FONTS = ["Poppins", "Inter", "Roboto", "Nunito", "Lato", "Montserrat", "Open Sans"];
const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];
const BUBBLE_SIZES = ["small", "medium", "large"];
/** @type {Record<string, number>} */
const SIZE_PX = { small: 52, medium: 64, large: 76 };

/**
 * @param {{title: string, icon?: React.ReactNode, children: React.ReactNode}} props
 */
function Section({ title, icon, children }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-slate-400">{icon}</span>}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

/**
 * @param {{label: string, children: React.ReactNode}} props
 */
function Field({ label, children }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">{label}</label>
            {children}
        </div>
    );
}

export default function WhatsAppWidget() {
    /** @type {any} */
    const [cfg, setCfg] = useState({
        phone: "919876543210",
        prefilledText: "Hi! I found you on your website and I'd love to chat 👋",
        brandName: "JusBot Support",
        brandSubtitle: "Typically replies instantly",
        brandAvatar: "JB",
        welcomeMsg: "Hello! 👋 How can we help you today? Click below to start a WhatsApp chat.",
        bubbleColor: "#25D366",
        headerColor: "#075E54",
        ctaColor: "#25D366",
        textColor: "#ffffff",
        font: "Poppins",
        position: "bottom-right",
        size: "medium",
        showOnLoad: false,
        popupDelay: 3,
    });

    const [copied, setCopied] = useState(false);
    const [chatOpen, setChatOpen] = useState(true);
    /**
     * @param {string} k
     * @param {any} v
     */
    const set = (k, v) => setCfg((/** @type {any} */ p) => ({ ...p, [k]: v }));
    const sz = SIZE_PX[cfg.size];

    const copy = () => {
        navigator.clipboard.writeText(buildSnippet(cfg));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const posClass = (/** @type {Record<string, string>} */ ({
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
    }))[cfg.position] || "bottom-6 right-6";

    return (
        <div className="flex-1 flex flex-col min-h-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-3 shrink-0 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-sm">
                    <MessageCircle fill="white" stroke="white" size={16} />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-800 leading-tight">WhatsApp Widget</h1>
                    <p className="text-xs text-slate-400 leading-tight">Customize and embed a chat widget on any website</p>
                </div>
            </header>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Left Controls */}
                <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <MessageCircle size={16} className="text-green-500" /> Widget Builder
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Customize and embed on any website</p>
                    </div>

                    <div className="p-5 space-y-6">
                        <Section title="Contact" icon={<Phone size={13} />}>
                            <Field label="WhatsApp Number (with country code)">
                                <input value={cfg.phone} onChange={e => set("phone", e.target.value)}
                                    placeholder="919876543210"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none"
                                    style={{ fontFamily: "'Poppins', sans-serif" }} />
                            </Field>
                            <Field label="Pre-filled Message">
                                <textarea value={cfg.prefilledText} onChange={e => set("prefilledText", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none resize-none"
                                    style={{ fontFamily: "'Poppins', sans-serif" }} />
                            </Field>
                        </Section>

                        <Section title="Branding" icon={<AlignLeft size={13} />}>
                            <Field label="Brand Name">
                                <input value={cfg.brandName} onChange={e => set("brandName", e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none"
                                    style={{ fontFamily: "'Poppins', sans-serif" }} />
                            </Field>
                            <Field label="Subtitle">
                                <input value={cfg.brandSubtitle} onChange={e => set("brandSubtitle", e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none"
                                    style={{ fontFamily: "'Poppins', sans-serif" }} />
                            </Field>
                            <Field label="Avatar Text (2 letters)">
                                <input value={cfg.brandAvatar}
                                    onChange={e => set("brandAvatar", e.target.value.slice(0, 2).toUpperCase())}
                                    maxLength={2}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none"
                                    style={{ fontFamily: "'Poppins', sans-serif" }} />
                            </Field>
                            <Field label="Welcome Message">
                                <textarea value={cfg.welcomeMsg} onChange={e => set("welcomeMsg", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none resize-none"
                                    style={{ fontFamily: "'Poppins', sans-serif" }} />
                            </Field>
                        </Section>

                        <Section title="Colors" icon={<Palette size={13} />}>
                            <div className="grid grid-cols-2 gap-3">
                                {[["Bubble Color", "bubbleColor"], ["Header Color", "headerColor"], ["CTA Button", "ctaColor"], ["CTA Text", "textColor"]].map(([label, key]) => (
                                    <Field key={key} label={label}>
                                        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5">
                                            <input type="color" value={cfg[key]} onChange={e => set(key, e.target.value)}
                                                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent" />
                                            <span className="text-xs font-mono text-slate-500">{cfg[key]}</span>
                                        </div>
                                    </Field>
                                ))}
                            </div>
                        </Section>

                        <Section title="Typography & Layout" icon={<Type size={13} />}>
                            <Field label="Font Family">
                                <div className="relative">
                                    <select value={cfg.font} onChange={e => set("font", e.target.value)}
                                        className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-lg border border-slate-200 focus:border-green-400 outline-none"
                                        style={{ fontFamily: "'Poppins', sans-serif" }}>
                                        {FONTS.map(f => <option key={f}>{f}</option>)}
                                    </select>
                                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </Field>
                            <Field label="Position">
                                <div className="grid grid-cols-2 gap-2">
                                    {POSITIONS.map(p => (
                                        <button key={p} onClick={() => set("position", p)}
                                            className={`text-xs py-1.5 px-2 rounded-lg border font-medium transition-all ${cfg.position === p ? "border-green-400 bg-green-50 text-green-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <Field label="Bubble Size">
                                <div className="grid grid-cols-3 gap-2">
                                    {BUBBLE_SIZES.map(s => (
                                        <button key={s} onClick={() => set("size", s)}
                                            className={`text-xs py-1.5 px-2 rounded-lg border font-medium capitalize transition-all ${cfg.size === s ? "border-green-400 bg-green-50 text-green-700" : "border-slate-200 text-slate-500"}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </Section>

                        <Section title="Behavior" icon={<Settings size={13} />}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-600">Auto-open on load</span>
                                <button onClick={() => set("showOnLoad", !cfg.showOnLoad)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${cfg.showOnLoad ? "bg-green-500" : "bg-slate-200"}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg.showOnLoad ? "left-5" : "left-0.5"}`} />
                                </button>
                            </div>
                            {cfg.showOnLoad && (
                                <Field label={"Popup delay: " + cfg.popupDelay + "s"}>
                                    <input type="range" min={0} max={15} value={cfg.popupDelay}
                                        onChange={e => set("popupDelay", +e.target.value)}
                                        className="w-full accent-green-500" />
                                </Field>
                            )}
                        </Section>
                    </div>
                </div>

                {/* Right Preview + Snippet */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

                    {/* Preview */}
                    <div className="relative overflow-hidden flex-shrink-0" style={{ height: "550px" }}>
                        {/* Fake website bg */}
                        <div className="absolute inset-0 bg-white overflow-hidden">
                            <div className="h-14 bg-slate-800 flex items-center px-8 gap-4">
                                <div className="w-20 h-3 bg-white/20 rounded-full" />
                                <div className="flex gap-3 ml-auto">
                                    {[1, 2, 3].map(i => <div key={i} className="w-12 h-3 bg-white/20 rounded-full" />)}
                                </div>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="w-48 h-4 bg-slate-200 rounded" />
                                <div className="w-full h-2.5 bg-slate-100 rounded" />
                                <div className="w-4/5 h-2.5 bg-slate-100 rounded" />
                                <div className="w-3/4 h-2.5 bg-slate-100 rounded" />
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
                                </div>
                            </div>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-300 font-medium">
                                Preview — Your Website
                            </div>
                        </div>

                        {/* Widget overlay */}
                        <div className={"absolute " + posClass} style={{ fontFamily: "'" + cfg.font + "', sans-serif", zIndex: 50 }}>
                            {chatOpen && (
                                <div className="mb-3 w-72 bg-white rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: cfg.headerColor }}>
                                        <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {cfg.brandAvatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{cfg.brandName}</p>
                                            <p className="text-white/70 text-[11px] truncate">{cfg.brandSubtitle}</p>
                                        </div>
                                        <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white ml-auto">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="p-3.5 bg-[#ece5dd]">
                                        <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[90%]">
                                            <p className="text-[13px] text-slate-700 leading-relaxed">{cfg.welcomeMsg}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 text-right">now ✓✓</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            <p className="text-xs text-slate-400 truncate">{cfg.prefilledText}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.ctaColor }}>
                                            <Send size={13} color={cfg.textColor} />
                                        </div>
                                    </div>
                                    <a href={"https://wa.me/" + cfg.phone + "?text=" + encodeURIComponent(cfg.prefilledText)}
                                        target="_blank" rel="noreferrer"
                                        className="flex items-center justify-center gap-2 mx-3 mb-3 mt-2 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                                        style={{ background: cfg.ctaColor, color: cfg.textColor, fontFamily: "'" + cfg.font + "', sans-serif" }}>
                                        <MessageCircle size={15} fill={cfg.textColor} /> Start WhatsApp Chat
                                    </a>
                                </div>
                            )}
                            <button onClick={() => setChatOpen(o => !o)}
                                className="rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                                style={{ width: sz, height: sz, background: cfg.bubbleColor }}>
                                {chatOpen
                                    ? <X size={sz * 0.38} color="#fff" />
                                    : <MessageCircle size={sz * 0.42} color="#fff" fill="#fff" />}
                            </button>
                        </div>
                    </div>

                    {/* Snippet panel */}
                    <div className="border-t border-slate-200 bg-white px-6 py-4 flex-shrink-0" style={{ maxHeight: "260px" }}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Embed Script</p>
                                <p className="text-xs text-slate-400">
                                    Paste this before the <code className="bg-slate-100 px-1 rounded text-slate-600">&lt;/body&gt;</code> tag of your website
                                </p>
                            </div>
                            <button onClick={copy}
                                className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (copied ? "bg-green-100 text-green-700" : "bg-slate-900 text-white hover:bg-slate-800")}>
                                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                            </button>
                        </div>
                        <pre className="bg-slate-950 text-green-400 text-[11px] p-4 rounded-xl overflow-auto max-h-32 leading-relaxed font-mono whitespace-pre-wrap">
                            {buildSnippet(cfg)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
