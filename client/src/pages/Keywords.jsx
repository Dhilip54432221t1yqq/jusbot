import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, X, CheckCircle, AlertCircle,
  GitBranch, Info, ChevronDown, MessageSquare,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../supabase';

import config from '../config';
const API = `${config.API_BASE}`;

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked = false, onChange = () => {} }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function Keywords() {
  const { workspaceId } = useParams();

  const [keywords, setKeywords] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Default Reply Settings
  const [defaultReply, setDefaultReply] = useState({
    enabled: false,
    flow_id: '',
    frequency: 'every_time'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchKeywords();
    fetchFlows();
    fetchSettings();
  }, [workspaceId]);

  const showToast = (message = '', type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/keywords?workspace_id=${workspaceId}`);
      const data = await res.json();
      setKeywords(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchFlows = async () => {
    const { data } = await supabase.from('flows').select('id, name').eq('workspace_id', workspaceId).order('name');
    if (data) setFlows(data);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/automation/settings?workspace_id=${workspaceId}`);
      const data = await res.json();
      if (data) {
        setDefaultReply({
          enabled: data.default_reply_enabled,
          flow_id: data.default_reply_flow_id || '',
          frequency: data.default_reply_frequency || 'every_time'
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (kw = {}) => {
    const newStatus = kw.status === 'active' ? 'inactive' : 'active';
    setKeywords(prev => prev.map(k => k.id === kw.id ? { ...k, status: newStatus } : k));
    await fetch(`${API}/keywords/${kw.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...kw, workspace_id: workspaceId, status: newStatus })
    });
  };

  const handleDelete = async (id = '') => {
    if (!window.confirm('Delete this keyword rule?')) return;
    await fetch(`${API}/keywords/${id}?workspace_id=${workspaceId}`, { method: 'DELETE' });
    showToast('Keyword rule deleted');
    fetchKeywords();
  };

  const handleUpdateSettings = async (updates = {}) => {
    const next = { ...defaultReply, ...updates };
    setDefaultReply(next);
    setSavingSettings(true);
    try {
      await fetch(`${API}/automation/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          default_reply_enabled: next.enabled,
          default_reply_flow_id: next.flow_id,
          default_reply_frequency: next.frequency
        })
      });
    } catch (e) { console.error(e); }
    finally { setSavingSettings(false); }
  };

  const filteredKeywords = keywords.filter((k) =>
    (k.keywords || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-slate-800">Keywords</h1>
          <button className="text-slate-400 hover:text-slate-600"><Info size={15} /></button>
        </div>
        <button
          onClick={() => { setEditingKeyword(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-green-200 transition-colors"
        >
          <Plus size={16} /> Keyword
        </button>
      </header>

      <div className="p-7 max-w-6xl mx-auto space-y-8">
          
        {/* Default Reply Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-50">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Default Reply Settings</h2>
                <p className="text-[11px] text-slate-400 font-medium">Auto-reply when no keywords match</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {savingSettings && <span className="text-[10px] text-slate-400 animate-pulse">Saving...</span>}
              <Toggle
                checked={defaultReply.enabled}
                onChange={() => handleUpdateSettings({ enabled: !defaultReply.enabled })}
              />
            </div>
          </div>
            
          <div className={`p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${!defaultReply.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Flow</label>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400 cursor-pointer"
                  value={defaultReply.flow_id}
                  onChange={(e) => handleUpdateSettings({ flow_id: e.target.value })}
                >
                  <option value="">Choose fallback flow</option>
                  {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Frequency</label>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400 cursor-pointer"
                  value={defaultReply.frequency}
                  onChange={(e) => handleUpdateSettings({ frequency: e.target.value })}
                >
                  <option value="every_time">Every Time</option>
                  <option value="once_per_session">Once per session</option>
                  <option value="custom">Custom</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Keywords List Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
             <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                placeholder="Search keywords..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-green-400 transition-all placeholder:text-slate-300"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[80px_1fr_120px_200px_100px] border-b border-slate-100 px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
            <div>Active</div>
            <div>Keyword(s)</div>
            <div>Match Type</div>
            <div>Connected Flow</div>
            <div className="text-right">Actions</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              Loading keywords...
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                <HelpCircle size={32} className="opacity-20" />
              </div>
              <p className="font-semibold text-slate-500 text-sm">No keywords created yet</p>
              <p className="text-xs max-w-[240px] text-center">Trigger flows when users type specific words like "help" or "price".</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-bold shadow-md shadow-green-100"
              >
                Create Keyword
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredKeywords.map(kw => {
                const isActive = kw.status === 'active';
                const linkedFlow = flows.find(f => f.id === kw.flow_id);
                  
                return (
                  <div key={kw.id} className={`grid grid-cols-[80px_1fr_120px_200px_100px] items-center px-6 py-4 hover:bg-slate-50/50 transition-colors group ${!isActive ? 'opacity-60' : ''}`}>
                    <div>
                      <Toggle checked={isActive} onChange={() => handleToggle(kw)} />
                    </div>
                    <div className="min-w-0 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(kw.keywords || '').split(',').map((word = '', i = 0) => (
                          <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md text-[11px] font-bold">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        kw.match_type === 'is' ? 'bg-purple-100 text-purple-700' :
                        kw.match_type === 'contains' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {kw.match_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold truncate max-w-[180px]">
                        <GitBranch size={13} className="text-slate-300" />
                        {linkedFlow?.name || <span className="text-red-400 italic">No flow selected</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingKeyword(kw); setShowModal(true); }}
                        className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(kw.id)}
                        className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <KeywordModal
          keyword={editingKeyword}
          flows={flows}
          workspaceId={workspaceId}
          onClose={() => { setShowModal(false); setEditingKeyword(null); }}
          onSaved={() => {
            fetchKeywords();
            showToast(editingKeyword ? 'Keyword updated!' : 'Keyword created!');
            setShowModal(false);
          }}
        />
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-900 border-slate-700 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} className="text-green-400" />}
          {toast.message}
        </div>
      </div>
    </div>
  );
}

// ─── Create/Edit Modal ──────────────────────────────────────────────────────
function KeywordModal({ keyword = null, flows = [], workspaceId = '', onClose = () => {}, onSaved = () => {} }) {
    const [form, setForm] = useState({
        match_type: keyword?.match_type || 'is',
        keywords: keyword?.keywords || '',
        flow_id: keyword?.flow_id || '',
        status: keyword?.status || 'active'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!form.keywords.trim()) return setError('Please enter at least one keyword');
        if (!form.flow_id) return setError('Please select a flow');
        
        // Validation: no spaces around commas
        if (form.keywords.includes(', ')) {
            return setError('Do not use spaces after commas. Example: hi,hello,help');
        }

        setSaving(true);
        setError('');
        try {
            const body = { ...form, workspace_id: workspaceId };
            const url = keyword ? `${API}/keywords/${keyword.id}` : `${API}/keywords`;
            const method = keyword ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (data.success) {
                onSaved();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{keyword ? 'Edit Keyword Rule' : 'New Keyword Rule'}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Configure how the bot responds to user messages</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-600">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    {/* Match Type */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">MATCH CONDITION</label>
                        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                            {['is', 'contains', 'starts_with'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setForm(f => ({ ...f, match_type: type }))}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                        form.match_type === type 
                                        ? 'bg-white text-green-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {type.replace('_', ' ').toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Keywords Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">KEYWORDS</label>
                            <span className="text-[10px] text-slate-400 font-medium italic">Comma-separated</span>
                        </div>
                        <input
                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-green-400 focus:bg-white transition-all placeholder:text-slate-300"
                            placeholder="e.g. price,cost,pricing"
                            value={form.keywords}
                            onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                        />
                        <p className="text-[10px] text-slate-400 mt-2 px-1 flex items-center gap-1">
                             <Info size={10} /> Use comma-separated keywords without spaces
                        </p>
                    </div>

                    {/* Flow Selector */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">TRIGGER FLOW</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-green-400 focus:bg-white transition-all cursor-pointer"
                                value={form.flow_id}
                                onChange={e => setForm(f => ({ ...f, flow_id: e.target.value }))}
                            >
                                <option value="">Select a sub flow</option>
                                {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between px-1 pt-2">
                        <span className="text-sm font-bold text-slate-700">Rules Active</span>
                        <Toggle 
                            checked={form.status === 'active'} 
                            onChange={() => setForm(f => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))} 
                        />
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-[18px] shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} />}
                        {saving ? 'Saving...' : keyword ? 'Update Logic' : 'Create Automation'}
                    </button>
                </div>
            </div>
        </div>
    );
}
