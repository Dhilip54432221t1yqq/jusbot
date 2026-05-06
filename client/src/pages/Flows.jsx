import { useState, useEffect } from "react";
import {
    MessageCircle, Plus, MoreVertical, Search, Grid, List,
    Folder, GitBranch, Sparkles, X
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useWorkspace } from "../contexts/WorkspaceContext";

const FlowPreview = ({ type }) => {
    const styles = {
        main: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <rect x="20" y="35" width="60" height="30" rx="4" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="120" y="25" width="60" height="20" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="120" y="55" width="60" height="20" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <line x1="80" y1="50" x2="120" y2="35" stroke="#6B7280" strokeWidth="1.5" />
                <line x1="80" y1="50" x2="120" y2="65" stroke="#6B7280" strokeWidth="1.5" />
            </svg>
        ),
        expo1: (/* ... existing SVG content ... */
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <circle cx="30" cy="50" r="8" fill="#22c55e" />
                <rect x="55" y="30" width="40" height="25" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="110" y="20" width="35" height="18" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
                <rect x="110" y="42" width="35" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="155" y="55" width="35" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <circle cx="155" cy="72" r="5" fill="#ec4899" />
                <line x1="38" y1="50" x2="55" y2="42" stroke="#6B7280" strokeWidth="1" />
                <line x1="95" y1="42" x2="110" y2="29" stroke="#6B7280" strokeWidth="1" />
                <line x1="95" y1="42" x2="110" y2="51" stroke="#6B7280" strokeWidth="1" />
                <line x1="145" y1="51" x2="155" y2="60" stroke="#6B7280" strokeWidth="1" />
            </svg>
        ),
        expo2: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <circle cx="25" cy="50" r="7" fill="#22c55e" />
                <rect x="45" y="38" width="38" height="24" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="98" y="25" width="32" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="98" y="47" width="32" height="18" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
                <rect x="145" y="35" width="32" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="145" y="57" width="32" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <line x1="32" y1="50" x2="45" y2="50" stroke="#6B7280" strokeWidth="1" />
                <line x1="83" y1="50" x2="98" y2="34" stroke="#6B7280" strokeWidth="1" />
                <line x1="83" y1="50" x2="98" y2="56" stroke="#6B7280" strokeWidth="1" />
                <line x1="130" y1="56" x2="145" y2="44" stroke="#6B7280" strokeWidth="1" />
                <line x1="130" y1="56" x2="145" y2="66" stroke="#6B7280" strokeWidth="1" />
            </svg>
        ),
        rk: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <rect x="10" y="38" width="36" height="24" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="60" y="28" width="30" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="60" y="54" width="30" height="18" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="105" y="18" width="28" height="16" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="105" y="38" width="28" height="16" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="105" y="58" width="28" height="16" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <circle cx="160" cy="68" r="8" fill="#ec4899" />
                <rect x="148" y="22" width="28" height="14" rx="3" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <line x1="46" y1="50" x2="60" y2="37" stroke="#6B7280" strokeWidth="1" />
                <line x1="46" y1="50" x2="60" y2="63" stroke="#6B7280" strokeWidth="1" />
                <line x1="90" y1="37" x2="105" y2="26" stroke="#6B7280" strokeWidth="1" />
                <line x1="90" y1="63" x2="105" y2="66" stroke="#6B7280" strokeWidth="1" />
                <line x1="133" y1="66" x2="152" y2="68" stroke="#6B7280" strokeWidth="1" />
            </svg>
        ),
        test: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <circle cx="30" cy="50" r="8" fill="#22c55e" />
                <rect x="52" y="35" width="45" height="30" rx="4" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="52" y="42" width="45" height="20" rx="2" fill="#1f2937" />
                <rect x="115" y="30" width="55" height="40" rx="4" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <line x1="38" y1="50" x2="52" y2="50" stroke="#6B7280" strokeWidth="1" />
                <line x1="97" y1="50" x2="115" y2="50" stroke="#6B7280" strokeWidth="1" />
            </svg>
        ),
        users: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <circle cx="35" cy="50" r="9" fill="#22c55e" />
                <rect x="58" y="32" width="50" height="36" rx="4" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <rect x="58" y="40" width="50" height="12" rx="2" fill="#1f2937" />
                <rect x="58" y="56" width="50" height="8" rx="2" fill="#1f2937" />
                <rect x="124" y="36" width="45" height="28" rx="4" fill="#374151" stroke="#4B5563" strokeWidth="1" />
                <line x1="44" y1="50" x2="58" y2="50" stroke="#6B7280" strokeWidth="1" />
                <line x1="108" y1="50" x2="124" y2="50" stroke="#6B7280" strokeWidth="1" />
            </svg>
        ),
    };
    return (
        <div className="w-full h-full flex items-center justify-center p-3">
            {styles[type] || styles.main}
        </div>
    );
};

export default function FlowsPage() {
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    const { activeWorkspace } = useWorkspace();
    const [viewMode, setViewMode] = useState("grid");
    const [search, setSearch] = useState("");
    const [filterLabel, setFilterLabel] = useState("All");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createType, setCreateType] = useState(null);
    const [newName, setNewName] = useState("");
    const [openMenu, setOpenMenu] = useState(null);

    const [activeFolder, setActiveFolder] = useState(null);
    const [folders, setFolders] = useState([]);
    const [flows, setFlows] = useState([]);

    useEffect(() => {
        if (workspaceId) {
            if (!activeFolder) fetchFolders();
            fetchFlows();
        }
    }, [activeFolder, workspaceId]);

    const fetchFolders = async () => {
        try {
            const { data, error } = await supabase
                .from('folders')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });
            if (data) setFolders(data);
        } catch (err) { console.error(err); }
    };

    const fetchFlows = async () => {
        try {
            let query = supabase.from('flows').select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (activeFolder) query = query.eq('folder_id', activeFolder.id);
            else query = query.is('folder_id', null);

            const { data, error } = await query;
            if (data) setFlows(data);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (createType === 'folder') {
                await supabase.from('folders').insert([{ name: newName, user_id: user.id, workspace_id: workspaceId }]);
                fetchFolders();
            } else {
                await supabase.from('flows').insert([{
                    name: newName,
                    user_id: user.id,
                    workspace_id: workspaceId,
                    nodes: 1,
                    preview: 'main',
                    workspace_name: activeWorkspace?.name || 'JusBot',
                    folder_id: activeFolder ? activeFolder.id : null
                }]);
                fetchFlows();
            }
            setShowCreateModal(false);
            setNewName("");
        } catch (err) { console.error(err); }
    };

    const handleDeleteFlow = async (id) => {
        if (!window.confirm("Delete flow?")) return;
        await supabase.from('flows').delete().eq('id', id);
        fetchFlows();
    };

    const filtered = flows.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveFolder(null)} className={`text-2xl font-bold ${activeFolder ? 'text-slate-400 hover:text-slate-600' : 'text-slate-800'}`} style={{ fontFamily: "'Sora', sans-serif" }}>Sub Flows</button>
                    {activeFolder && (
                        <><span className="text-2xl text-slate-300">/</span><h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>{activeFolder.name}</h2></>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"><Sparkles className="w-4 h-4" />AI Generator</button>
                    <button onClick={() => { setCreateType("flow"); setShowCreateModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"><Plus className="w-4 h-4" />New Flow</button>
                </div>
            </div>

            {!activeFolder && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {folders.map(folder => (
                            <div key={folder.id} onClick={() => setActiveFolder(folder)} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3"><Folder className="w-5 h-5 text-slate-400 group-hover:text-green-500" /><span className="text-sm font-bold text-slate-700">{folder.name}</span></div>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">0</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { setCreateType("folder"); setShowCreateModal(true); }} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-green-400 hover:text-green-600 transition-all text-sm font-bold"><Plus className="w-4 h-4" />Create Folder</button>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white outline-none focus:ring-2 focus:ring-green-500/20"><option>All Flows</option></select>
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 w-72"><Search className="w-4 h-4 text-slate-400" /><input type="text" placeholder="Search flows..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm outline-none w-full" /></div>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-600"}`}><Grid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-600"}`}><List className="w-4 h-4" /></button>
                </div>
            </div>

            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {filtered.map(flow => (
                    <div key={flow.id} onClick={() => navigate(`/${workspaceId}/flow-builder/${flow.id}`)} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-green-400 transition-all cursor-pointer group">
                        <div className="h-40 bg-slate-800 relative"><FlowPreview type={flow.preview} /></div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm truncate">{flow.name}</span>
                            <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === flow.id ? null : flow.id); }} className="p-1 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                        </div>
                    </div>
                ))}
                <button onClick={() => { setCreateType("flow"); setShowCreateModal(true); }} className="h-52 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-green-400 hover:bg-green-50 transition-all group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors"><Plus className="w-6 h-6 text-slate-400 group-hover:text-green-600" /></div>
                    <span className="text-sm font-bold text-slate-400 group-hover:text-green-600">New Flow</span>
                </button>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-3xl shadow-2xl w-[400px] p-8">
                        <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-slate-800">{createType === "folder" ? "New Folder" : "New Flow"}</h3><button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button></div>
                        <div className="mb-8"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Name</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter name..." className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-green-500/10 focus:bg-white outline-none transition-all" /></div>
                        <div className="flex gap-4"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button><button onClick={handleCreate} className="flex-1 py-3.5 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all">Create</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
