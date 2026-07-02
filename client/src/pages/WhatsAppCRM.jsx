import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import config from "../config";
import { Users, Plus, MoreHorizontal, GripVertical, MessageCircle, Phone, Search, X } from "lucide-react";

export default function WhatsAppCRM() {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const API_BASE = `${config.API_BASE}/contacts`;

    const [stages, setStages] = useState([
        { id: "s1", name: "New Leads", color: "bg-blue-500" },
        { id: "s2", name: "In Progress", color: "bg-amber-500" },
        { id: "s3", name: "Follow Up", color: "bg-purple-500" },
        { id: "s4", name: "Converted", color: "bg-emerald-500" }
    ]);

    const [dbContacts, setDbContacts] = useState([]);
    const [stageOverrides, setStageOverrides] = useState({});
    const [stageOrderOverrides, setStageOrderOverrides] = useState({});

    const [draggedCardId, setDraggedCardId] = useState(null);
    const [newStageName, setNewStageName] = useState("");
    const [isAddingStage, setIsAddingStage] = useState(false);

    // --- Create User Modal State ---
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        phone: '',
        channel: 'whatsapp',
        channel_user_id: ''
    });

    // --- Fetch Contacts ---
    const fetchContacts = async () => {
        try {
            const res = await authFetch(`${API_BASE}?workspace_id=${workspaceId}`);
            const data = await res.json();
            setDbContacts(Array.isArray(data?.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        }
    };

    useEffect(() => {
        if (workspaceId) fetchContacts();
    }, [workspaceId]);

    // Map dbContacts to Kanban cards
    const cards = dbContacts.map(c => ({
        id: c.id,
        stageId: stageOverrides[c.id] || "s1", // Default to New Leads (s1)
        name: c.name || "Anonymous",
        phone: c.phone || c.email || c.channel_user_id || "No Contact Info",
        time: new Date(c.last_interaction || c.subscribed_at || Date.now()).toLocaleDateString(),
        initials: (c.name || "U").substring(0, 2).toUpperCase()
    }));

    // --- Create User Handler ---
    const handleCreateUser = async () => {
        if (!newUserForm.name) return; // Basic validation
        setCreatingUser(true);
        try {
            const body = {
                workspace_id: workspaceId,
                ...newUserForm,
                channel_user_id: newUserForm.channel_user_id || `usr_${Date.now()}`
            };

            const res = await authFetch(`${API_BASE}/upsert`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowCreateUserModal(false);
                setNewUserForm({ name: '', email: '', phone: '', channel: 'whatsapp', channel_user_id: '' });
                fetchContacts();
            }
        } catch (err) {
            console.error('Failed to create user:', err);
        } finally {
            setCreatingUser(false);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e, cardId) => {
        setDraggedCardId(cardId);
        e.dataTransfer.setData("text/plain", cardId);
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => {
            e.target.style.opacity = "0.5";
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = "1";
        setDraggedCardId(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetStageId) => {
        e.preventDefault();
        if (!draggedCardId) return;

        // If dropping into empty stage or end of list
        setStageOverrides(prev => ({
            ...prev,
            [draggedCardId]: targetStageId
        }));

        setStageOrderOverrides(prev => {
            const currentOrder = prev[targetStageId] || cards.filter(c => (stageOverrides[c.id] || "s1") === targetStageId).map(c => c.id);
            if (!currentOrder.includes(draggedCardId)) {
                return { ...prev, [targetStageId]: [...currentOrder, draggedCardId] };
            }
            return prev;
        });
        
        setDraggedCardId(null);
    };

    const handleCardDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
    };

    const handleCardDrop = (e, targetStageId, targetCardId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedCardId || draggedCardId === targetCardId) return;

        setStageOverrides(prev => ({
            ...prev,
            [draggedCardId]: targetStageId
        }));

        setStageOrderOverrides(prev => {
            // Get all cards in target stage based on overrides or default s1
            const stageItems = cards.filter(c => {
                if (c.id === draggedCardId) return true; // include the one being dragged
                return (stageOverrides[c.id] || "s1") === targetStageId;
            }).map(c => c.id);
            
            const currentOrder = prev[targetStageId] || stageItems;
            
            // Remove dragged from current position
            let newOrder = currentOrder.filter(id => id !== draggedCardId);
            
            // Insert before target
            const targetIndex = newOrder.indexOf(targetCardId);
            if (targetIndex !== -1) {
                newOrder.splice(targetIndex, 0, draggedCardId);
            } else {
                newOrder.push(draggedCardId);
            }
            
            return {
                ...prev,
                [targetStageId]: newOrder
            };
        });

        setDraggedCardId(null);
    };

    // --- Stage Handlers ---
    const handleAddStage = () => {
        if (newStageName.trim()) {
            const newStage = {
                id: `s${Date.now()}`,
                name: newStageName.trim(),
                color: "bg-slate-400"
            };
            setStages([...stages, newStage]);
            setNewStageName("");
            setIsAddingStage(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-sm">
                        <Users fill="white" stroke="white" size={16} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 leading-tight">WA CRM</h1>
                        <p className="text-xs text-slate-400 leading-tight">Manage your WhatsApp contacts and deals</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search contacts..." 
                            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-400 w-64 bg-slate-50"
                        />
                    </div>
                    <button 
                        onClick={() => setShowCreateUserModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={14} /> Add Contact
                    </button>
                </div>
            </header>

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
                <div className="flex h-full items-start gap-6 w-max">
                    
                    {/* Stages / Columns */}
                    {stages.map(stage => {
                        const stageCards = cards.filter(c => c.stageId === stage.id);
                        return (
                            <div 
                                key={stage.id} 
                                className="w-80 flex flex-col max-h-full bg-slate-100/50 rounded-2xl border border-slate-200/60"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                                        <h3 className="font-bold text-slate-800 text-sm">{stage.name}</h3>
                                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                            {stageCards.length}
                                        </span>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                {/* Cards List */}
                                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
                                    {stageCards
                                        .sort((a, b) => {
                                            const order = stageOrderOverrides[stage.id] || [];
                                            const indexA = order.indexOf(a.id);
                                            const indexB = order.indexOf(b.id);
                                            if (indexA === -1 && indexB === -1) return 0;
                                            if (indexA === -1) return 1;
                                            if (indexB === -1) return -1;
                                            return indexA - indexB;
                                        })
                                        .map(card => (
                                        <div
                                            key={card.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, card.id)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleCardDragOver}
                                            onDrop={(e) => handleCardDrop(e, stage.id, card.id)}
                                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-green-300 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                        {card.initials}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800 text-sm truncate max-w-[140px]">{card.name}</h4>
                                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Phone size={10} /> {card.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <span className="text-[10px] font-medium text-slate-400">{card.time}</span>
                                                <button className="text-slate-400 hover:text-green-500 transition-colors">
                                                    <MessageCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {stageCards.length === 0 ? (
                                        <div className="h-24 shrink-0 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs font-medium text-slate-400">
                                            Drop cards here
                                        </div>
                                    ) : (
                                        draggedCardId && (
                                            <div className="h-16 shrink-0 flex items-center justify-center border-2 border-dashed border-slate-300/70 bg-slate-100/50 rounded-xl text-xs font-medium text-slate-400 mt-2">
                                                Drop to end of list
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Stage Column */}
                    <div className="w-80 shrink-0">
                        {!isAddingStage ? (
                            <button 
                                onClick={() => setIsAddingStage(true)}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-white border border-slate-200 border-dashed rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-sm"
                            >
                                <Plus size={16} /> Add Stage
                            </button>
                        ) : (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    placeholder="Stage name..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 mb-3"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddStage();
                                        if (e.key === 'Escape') {
                                            setIsAddingStage(false);
                                            setNewStageName("");
                                        }
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleAddStage}
                                        className="flex-1 bg-slate-900 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-slate-800"
                                    >
                                        Add
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsAddingStage(false);
                                            setNewStageName("");
                                        }}
                                        className="flex-1 bg-slate-100 text-slate-600 rounded-lg py-1.5 text-xs font-semibold hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Create User Modal (Exact copy from BotUsers) */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCreateUserModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>Create Bot User</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Add a new user manually</p>
                                </div>
                                <button onClick={() => setShowCreateUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Full Name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                        value={newUserForm.name}
                                        onChange={e => setNewUserForm(prev => ({...prev, name: e.target.value}))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                                        <input 
                                            type="email" 
                                            placeholder="user@example.com"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                            value={newUserForm.email}
                                            onChange={e => setNewUserForm(prev => ({...prev, email: e.target.value}))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                                        <input 
                                            type="tel" 
                                            placeholder="+1 234..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                            value={newUserForm.phone}
                                            onChange={e => setNewUserForm(prev => ({...prev, phone: e.target.value}))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Channel</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none"
                                        value={newUserForm.channel}
                                        onChange={e => setNewUserForm(prev => ({...prev, channel: e.target.value}))}
                                    >
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="telegram">Telegram</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => setShowCreateUserModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                                <button 
                                    onClick={handleCreateUser} 
                                    disabled={creatingUser || !newUserForm.name}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all disabled:opacity-50"
                                >
                                    {creatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Scrollbar Styles specific to CRM Board */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
