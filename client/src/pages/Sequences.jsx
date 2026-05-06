import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, Info, ChevronRight, 
  MessageSquare, Clock, Layout, Play, Send, Zap, Activity
} from 'lucide-react';
import { supabase } from '../supabase';

import config from '../config';
const API = `${config.API_BASE}`;

export default function Sequences() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSeqName, setNewSeqName] = useState('');

  useEffect(() => {
    fetchSequences();
  }, [workspaceId]);

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/sequences?workspace_id=${workspaceId}`);
      const data = await res.json();
      setSequences(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggle = async (seq) => {
    const newStatus = seq.status === 'active' ? 'inactive' : 'active';
    setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, status: newStatus } : s));
    await fetch(`${API}/sequences/${seq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sequence and all its messages?')) return;
    await fetch(`${API}/sequences/${id}`, { method: 'DELETE' });
    fetchSequences();
  };

  const handleCreate = async () => {
    if (!newSeqName.trim()) return;
    try {
      const res = await fetch(`${API}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, name: newSeqName })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/${workspaceId}/automation/sequences/${data.sequence.id}`);
      }
    } catch (e) { console.error(e); }
  };

  const filtered = sequences.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-800">Sequences</h1>
            <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">Follow-up Logic</div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-200 transition-colors"
          >
            <Plus size={16} /> New Sequence
          </button>
        </header>

        <div className="p-7 max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
               <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search sequences..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-300"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-[80px_1fr_150px_150px_100px] border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
              <div>Active</div>
              <div>Sequence Name</div>
              <div>Messages</div>
              <div>Created</div>
              <div className="text-right">Actions</div>
            </div>

            {loading ? (
               <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2">
                 <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 Loading sequences...
               </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                        <Zap size={32} className="text-blue-200" />
                    </div>
                    <p className="font-semibold text-slate-500 text-sm">No sequences yet</p>
                    <p className="text-xs text-center max-w-[280px]">Automate follow-ups after triggers, keywords, or purchases to keep users engaged.</p>
                </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map(seq => {
                    const isActive = seq.status === 'active';
                    return (
                        <div key={seq.id} className={`grid grid-cols-[80px_1fr_150px_150px_100px] items-center px-6 py-4 hover:bg-slate-50/30 transition-colors group ${!isActive ? 'opacity-60' : ''}`}>
                            <div>
                                <button
                                    onClick={() => handleToggle(seq)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="font-bold text-slate-700 text-sm">{seq.name}</div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <MessageSquare size={13} className="text-slate-300" />
                                {seq.sequence_messages?.[0]?.count || 0} step(s)
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                                {new Date(seq.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                                <button
                                    onClick={() => navigate(`/${workspaceId}/automation/sequences/${seq.id}`)}
                                    className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(seq.id)}
                                    className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <ChevronRight size={14} className="text-slate-200 group-hover:text-blue-300 transition-colors" />
                            </div>
                        </div>
                    );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg text-center">New Sequence</h3>
                        <p className="text-xs text-slate-400 text-center font-medium mt-1">Give your automation a name to get started</p>
                    </div>
                    <input
                        autoFocus
                        placeholder="e.g. Lead Follow-up"
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-400 focus:bg-white transition-all uppercase placeholder:normal-case"
                        value={newSeqName}
                        onChange={e => setNewSeqName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-400">Cancel</button>
                        <button 
                            onClick={handleCreate}
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all"
                        >
                            Create & Build
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
