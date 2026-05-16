import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Zap, Plus, Search, Edit2, Trash2, Play, X, CheckCircle, AlertCircle,
  Clock, MessageCircle, Instagram, Facebook, Tag, Globe, ShoppingCart,
  FileText, ChevronDown, GitBranch, Info
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

import config from '../config';
import LottieLoader from '../components/LottieLoader';
const API = `${config.API_BASE}`;

const EVENT_TYPES = [
  { key: 'custom',             label: 'Custom / Manual',          icon: Zap,            iconColor: '#7C3AED', iconBg: '#EDE9FE' },
  { key: 'whatsapp_incoming',  label: 'WhatsApp Incoming',         icon: MessageCircle,  iconColor: '#25D366', iconBg: '#DCFCE7' },
  { key: 'instagram_incoming', label: 'Instagram Incoming',        icon: Instagram,      iconColor: '#E1306C', iconBg: '#FCE7F3' },
  { key: 'facebook_incoming',  label: 'Facebook Incoming',         icon: Facebook,       iconColor: '#1877F2', iconBg: '#DBEAFE' },
  { key: 'tag_added',          label: 'Tag Added',                 icon: Tag,            iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  { key: 'tag_removed',        label: 'Tag Removed',               icon: Tag,            iconColor: '#EF4444', iconBg: '#FEE2E2' },
  { key: 'field_changed',      label: 'User Field Changed',        icon: Edit2,          iconColor: '#6366F1', iconBg: '#EEF2FF' },
  { key: 'webhook',            label: 'Webhook / API',             icon: Globe,          iconColor: '#0891B2', iconBg: '#CFFAFE' },
  { key: 'form_submitted',     label: 'Form Submitted',            icon: FileText,       iconColor: '#0D9488', iconBg: '#CCFBF1' },
  { key: 'payment_success',    label: 'Payment / Order Success',   icon: ShoppingCart,   iconColor: '#16A34A', iconBg: '#DCFCE7' },
];

const getEventMeta = (key) => EVENT_TYPES.find(e => e.key === key) || EVENT_TYPES[0];

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-500' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function Triggers() {
  const { workspaceId } = useParams();
  const { authFetch } = useAuth();

  const [triggers, setTriggers] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [logsDrawer, setLogsDrawer] = useState(null);
  const [logs, setLogs] = useState([]);
  const [fireModal, setFireModal] = useState(null);
  const [firePayload, setFirePayload] = useState('{\n  "user_id": "",\n  "message": ""\n}');
  const [firing, setFiring] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchTriggers(); fetchFlows(); }, [workspaceId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/triggers?workspace_id=${workspaceId}`);
      const data = await res.json();
      setTriggers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchFlows = async () => {
    const { data } = await supabase.from('flows').select('id, name').eq('workspace_id', workspaceId).order('name');
    if (data) setFlows(data);
  };

  const fetchLogs = async (triggerId = '') => {
    try {
      const res = await authFetch(`${API}/triggers/${triggerId}/logs?workspace_id=${workspaceId}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id = '') => {
    if (!window.confirm('Delete this trigger?')) return;
    await authFetch(`${API}/triggers/${id}?workspace_id=${workspaceId}`, { method: 'DELETE' });
    showToast('Trigger deleted');
    fetchTriggers();
  };

  const handleToggle = async (trigger) => {
    // Optimistic update
    setTriggers(ts => ts.map(t => t.id === trigger.id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t));
    await authFetch(`${API}/triggers/${trigger.id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ workspace_id: workspaceId })
    });
  };

  const handleFlowLink = async (trigger, flowId) => {
    await authFetch(`${API}/triggers/${trigger.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...trigger, workspace_id: workspaceId, flow_id: flowId || null })
    });
    fetchTriggers();
  };

  const handleFire = async () => {
    setFiring(true);
    try {
      let payload = {};
      try { payload = JSON.parse(firePayload); } catch { }
      const res = await authFetch(`${API}/triggers/${fireModal.id}/fire`, {
        method: 'POST',
        body: JSON.stringify({ workspace_id: workspaceId, payload })
      });
      const data = await res.json();
      if (data.success) { showToast(`Trigger "${fireModal.name}" fired!`); setFireModal(null); }
      else showToast(data.error || 'Fire failed', 'error');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setFiring(false); }
  };

  // Filters
  const filteredTriggers = triggers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.event_type.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchType = filterType === 'all' || t.event_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-y-auto">
        {/* Page header */}
        <header className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-800">Triggers</h1>
            <button className="text-slate-400 hover:text-slate-600"><Info size={15} /></button>
          </div>
          <button
            onClick={() => { setEditingTrigger(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-green-200 transition-colors"
          >
            <Plus size={16} /> Trigger
          </button>
        </header>

        {/* Filter bar */}
        <div className="bg-white border-b border-slate-100 px-7 py-3 flex items-center gap-3">
          {/* Status filter */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:border-green-400 cursor-pointer"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:border-green-400 cursor-pointer min-w-[120px]"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">Type</option>
              {EVENT_TYPES.map(et => <option key={et.key} value={et.key}>{et.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search by name"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-green-400 placeholder:text-slate-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white mx-6 my-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[56px_1fr_200px_200px_80px] border-b border-slate-100 px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div>Active</div>
            <div>Name</div>
            <div>When this happens</div>
            <div>Run workflow</div>
            <div></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LottieLoader size={180} message="Loading triggers..." />
            </div>
          ) : filteredTriggers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <Zap size={24} className="text-green-400" />
              </div>
              <p className="font-semibold text-slate-500">No triggers found</p>
              <p className="text-sm">Create your first trigger to automate flows</p>
              <button
                onClick={() => { setEditingTrigger(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold mt-1"
              >
                <Plus size={14} /> New Trigger
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredTriggers.map(trigger => {
                const meta = getEventMeta(trigger.event_type);
                const Icon = meta.icon;
                const isActive = trigger.status === 'active';
                const linkedFlow = flows.find(f => f.id === trigger.flow_id);

                return (
                  <div key={trigger.id} className={`grid grid-cols-[56px_1fr_200px_200px_80px] items-center px-4 py-3.5 hover:bg-slate-50/60 transition-colors group ${!isActive ? 'opacity-60' : ''}`}>
                    {/* Toggle */}
                    <div>
                      <Toggle checked={isActive} onChange={() => handleToggle(trigger)} />
                    </div>

                    {/* Name + icon */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: meta.iconBg }}
                      >
                        <Icon size={14} style={{ color: meta.iconColor }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 truncate">{trigger.name}</span>
                      {trigger.description && (
                        <span className="text-xs text-slate-400 truncate hidden xl:block">{trigger.description}</span>
                      )}
                    </div>

                    {/* When this happens */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: meta.iconBg }}
                      >
                        <Icon size={11} style={{ color: meta.iconColor }} />
                      </div>
                      <span className="text-xs text-slate-600 truncate">{meta.label}</span>
                    </div>

                    {/* Run workflow: flow selector */}
                    <div>
                      <div className="relative inline-block w-full max-w-[186px]">
                        <select
                          className="w-full appearance-none text-xs border border-dashed border-slate-300 hover:border-green-400 rounded-lg px-3 py-2 bg-transparent text-green-600 focus:outline-none focus:border-green-400 cursor-pointer pr-6 font-medium"
                          value={trigger.flow_id || ''}
                          onChange={e => handleFlowLink(trigger, e.target.value)}
                        >
                          <option value="">Choose Sub Flow</option>
                          {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setFireModal(trigger); setFirePayload('{\n  "user_id": "",\n  "message": ""\n}'); }}
                        title="Fire trigger"
                        className="p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                      >
                        <Play size={14} />
                      </button>
                      <button
                        onClick={() => { setLogsDrawer(trigger.id); fetchLogs(trigger.id); }}
                        title="View logs"
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        <Clock size={14} />
                      </button>
                      <button
                        onClick={() => { setEditingTrigger(trigger); setShowModal(true); }}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(trigger.id)}
                        title="Delete"
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
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <TriggerModal
          trigger={editingTrigger}
          flows={flows}
          workspaceId={workspaceId}
          onClose={() => { setShowModal(false); setEditingTrigger(null); }}
          onSaved={() => {
            fetchTriggers();
            showToast(editingTrigger ? 'Trigger updated!' : 'Trigger created!');
            setShowModal(false);
            setEditingTrigger(null);
          }}
        />
      )}

      {/* Logs Drawer */}
      {logsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setLogsDrawer(null)} />
          <div className="relative bg-white w-[480px] h-full shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Trigger Logs</h3>
                <p className="text-xs text-slate-400 mt-0.5">Last 50 executions</p>
              </div>
              <button onClick={() => setLogsDrawer(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <Clock size={28} className="opacity-30" />
                  <p className="text-sm">No logs yet</p>
                </div>
              ) : logs.map(log => (
                <div key={log.id} className={`rounded-xl border p-3 ${log.status === 'success' ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {log.status === 'success'
                      ? <CheckCircle size={13} className="text-green-500" />
                      : <AlertCircle size={13} className="text-red-500" />
                    }
                    <span className={`text-[11px] font-bold ${log.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {log.status?.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-auto">{new Date(log.fired_at).toLocaleString()}</span>
                  </div>
                  {log.error && <p className="text-[11px] text-red-600 font-mono mt-1">{log.error}</p>}
                  <details className="mt-1">
                    <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-700">View payload</summary>
                    <pre className="text-[10px] bg-white border border-slate-100 rounded p-2 mt-1 overflow-x-auto text-slate-600">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fire Trigger Modal */}
      {fireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-[460px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Fire Trigger</h3>
                <p className="text-xs text-slate-400 mt-0.5">"{fireModal.name}"</p>
              </div>
              <button onClick={() => setFireModal(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={17} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Payload (JSON)</label>
              <textarea
                className="w-full h-36 font-mono text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:border-green-400 resize-none"
                value={firePayload}
                onChange={e => setFirePayload(e.target.value)}
              />
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setFireModal(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleFire}
                disabled={firing}
                className="flex-[2] py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-green-200"
              >
                {firing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={15} />}
                {firing ? 'Firing...' : 'Fire Now'}
              </button>
            </div>
          </div>
        </div>
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

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function TriggerModal({ trigger, flows, workspaceId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: trigger?.name || '',
    description: trigger?.description || '',
    event_type: trigger?.event_type || 'whatsapp_incoming',
    flow_id: trigger?.flow_id || '',
    status: trigger?.status || 'active',
    data_mapping: trigger?.data_mapping || [],
  });
  const { authFetch } = useAuth();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const addMapping = () => update('data_mapping', [...form.data_mapping, { key: '', value: '' }]);
  const updateMapping = (i, field, val) => {
    const m = [...form.data_mapping];
    m[i] = { ...m[i], [field]: val };
    update('data_mapping', m);
  };
  const removeMapping = (i) => update('data_mapping', form.data_mapping.filter((_, idx) => idx !== i));

  const filteredEventTypes = EVENT_TYPES.filter(et =>
    et.label.toLowerCase().includes(search.toLowerCase()) || et.key.includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, workspace_id: workspaceId, flow_id: form.flow_id || null };
      const url = trigger ? `${API}/triggers/${trigger.id}` : `${API}/triggers`;
      const method = trigger ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) onSaved();
      else alert(data.error || 'Failed to save');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const selectedMeta = getEventMeta(form.event_type);
  const SelectedIcon = selectedMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">{trigger ? 'Edit Trigger' : 'New Trigger'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={17} className="text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Trigger Name *</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="e.g. WhatsApp Order Received"
              value={form.name}
              onChange={e => update('name', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Notes / Description</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Optional notes"
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
          </div>

          {/* Event Type — searchable list */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">When this happens *</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="relative border-b border-slate-100 px-3 py-2">
                <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  className="w-full pl-6 text-sm bg-transparent focus:outline-none placeholder:text-slate-300"
                  placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {filteredEventTypes.map(et => {
                  const Icon = et.icon;
                  const isSelected = form.event_type === et.key;
                  return (
                    <button
                      key={et.key}
                      onClick={() => update('event_type', et.key)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-green-50 text-green-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: et.iconBg }}>
                        <Icon size={13} style={{ color: et.iconColor }} />
                      </div>
                      {et.label}
                      {isSelected && <CheckCircle size={14} className="ml-auto text-green-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Connected Flow */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Run Workflow (Sub Flow)</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              value={form.flow_id}
              onChange={e => update('flow_id', e.target.value)}
            >
              <option value="">No flow selected</option>
              {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* Data Mapping */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data Mapping</label>
              <button onClick={addMapping} className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800">
                <Plus size={13} /> Add Field
              </button>
            </div>
            {form.data_mapping.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No mappings — click "Add Field" to map incoming payload data to variables
              </div>
            ) : (
              <div className="space-y-2">
                {form.data_mapping.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-green-400"
                      placeholder="field_key"
                      value={m.key}
                      onChange={e => updateMapping(i, 'key', e.target.value)}
                    />
                    <span className="text-slate-300 text-sm">→</span>
                    <input
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-green-400"
                      placeholder="{{payload_key}} or static"
                      value={m.value}
                      onChange={e => updateMapping(i, 'value', e.target.value)}
                    />
                    <button onClick={() => removeMapping(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</label>
            <Toggle checked={form.status === 'active'} onChange={() => update('status', form.status === 'active' ? 'inactive' : 'active')} />
            <span className={`text-xs font-semibold ${form.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
              {form.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-white bg-white">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-[2] py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : trigger ? 'Update Trigger' : 'Create Trigger'}
          </button>
        </div>
      </div>
    </div>
  );
}
