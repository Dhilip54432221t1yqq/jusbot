import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, X, CheckCircle, ChevronLeft, Clock, Send, 
  Calendar, Shield, Save, ArrowDown, Trash2, Edit2, Zap
} from 'lucide-react';
import { supabase } from '../supabase';
import config from '../config';

const API = config.API_BASE;

export default function SequenceEditor() {
    const { workspaceId, id } = useParams();
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [sequence, setSequence] = useState(null);
    const [messages, setMessages] = useState([]);
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMsg, setEditingMsg] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        fetchData();
        fetchFlows();
    }, [id]);

    const fetchData = async () => {
        try {
            const [sRes, mRes] = await Promise.all([
                authFetch(`${API}/sequences/${id}`),
                authFetch(`${API}/sequences/${id}/messages`)
            ]);
            // For now, assume a GET single sequence is needed or handle locally
            // Let's just use the messages for now as we have the ID and name usually comes from previous page or an API
            const mData = await mRes.json();
            setMessages(mData);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchFlows = async () => {
        const { data } = await supabase.from('flows').select('id, name').eq('workspace_id', workspaceId).order('name');
        if (data) setFlows(data);
    };

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleDeleteMsg = async (msgId) => {
        if (!window.confirm('Remove this step?')) return;
        await authFetch(`${API}/sequences/messages/${msgId}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/${workspaceId}/automation/sequences`)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                Sequence Builder
                                <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">ID: {id.slice(0,8)}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => { setEditingMsg(null); setShowModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-100 transition-colors"
                        >
                            <Plus size={16} /> Add Step
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
                    <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
                        
                        {/* Start Node */}
                        <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-slate-200 p-4 flex items-center gap-4 shadow-sm relative mb-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-100">
                                <Play size={18} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Sequence Triggered</h3>
                                <p className="text-[11px] text-slate-400 font-medium tracking-tight">User subscribed (via flow or automation)</p>
                            </div>
                        </div>

                        {messages.length === 0 && !loading && (
                            <div className="mt-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto">
                                    <ArrowDown size={24} className="text-slate-300 animate-bounce" />
                                </div>
                                <p className="text-sm text-slate-400 font-medium">Add your first follow-up message</p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div key={msg.id} className="w-full flex flex-col items-center gap-4">
                                {/* Connector Line */}
                                <div className="w-[2px] h-8 bg-slate-200" />

                                {/* Step Card */}
                                <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all">
                                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-400">{index + 1}</div>
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Wait {msg.delay_value} {msg.delay_unit}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingMsg(msg); setShowModal(true); }} className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md"><Edit2 size={13}/></button>
                                            <button onClick={() => handleDeleteMsg(msg.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md"><Trash2 size={13}/></button>
                                        </div>
                                    </div>
                                    <div className="p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                            <Send size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-800 truncate">{msg.flows?.name || 'Invalid flow'}</div>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                <span className="flex items-center gap-1"><Clock size={10}/> {msg.send_anytime ? 'Anytime' : `Between ${msg.time_start}-${msg.time_end}`}</span>
                                                <span className="flex items-center gap-1"><Calendar size={10}/> {JSON.parse(msg.days || '[]').length === 7 ? 'Every Day' : `${JSON.parse(msg.days || '[]').length} d/w`}</span>
                                                <span className="flex items-center gap-1 text-blue-500"><Shield size={10}/> {msg.content_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </div>

            {/* Message Modal */}
            {showModal && (
                <MessageModal
                    msg={editingMsg}
                    flows={flows}
                    sequenceId={id}
                    authFetch={authFetch}
                    onClose={() => setShowModal(false)}
                    onSaved={() => { fetchData(); setShowModal(false); }}
                />
            )}

            {/* Toast */}
            {toast.show && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-3 text-sm font-bold border border-slate-800 animate-in slide-in-from-bottom-4">
                    <CheckCircle size={18} className="text-green-400" />
                    {toast.message}
                </div>
            )}
        </div>
    );
}

function MessageModal({ msg, flows, sequenceId, authFetch, onClose, onSaved }) {
    const [form, setForm] = useState({
        delay_value: msg?.delay_value || 0,
        delay_unit: msg?.delay_unit || 'minutes',
        send_anytime: msg?.send_anytime ?? true,
        time_start: msg?.time_start || '09:00',
        time_end: msg?.time_end || '18:00',
        days: msg?.days ? JSON.parse(msg.days) : [0,1,2,3,4,5,6],
        content_type: msg?.content_type || 'default',
        flow_id: msg?.flow_id || '',
        order_index: msg?.order_index || 0
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.flow_id) return alert('Select a flow');
        setSaving(true);
        try {
            const url = msg ? `${API}/sequences/messages/${msg.id}` : `${API}/sequences/${sequenceId}/messages`;
            const method = msg ? 'PUT' : 'POST';
            await authFetch(url, {
                method,
                body: JSON.stringify({ ...form, days: JSON.stringify(form.days) })
            });
            onSaved();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const toggleDay = (day) => {
        setForm(f => ({
            ...f,
            days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day]
        }));
    };

    const daysList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{msg ? 'Edit Sequence Step' : 'Add Sequence Step'}</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure delivery timing and content</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                    
                    {/* Delay Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] block mb-2 px-1">DELAY VALUE</label>
                            <input
                                type="number"
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                                value={form.delay_value}
                                onChange={e => setForm(f => ({ ...f, delay_value: parseInt(e.target.value) }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] block mb-2 px-1">UNIT</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-400 focus:bg-white transition-all appearance-none"
                                value={form.delay_unit}
                                onChange={e => setForm(f => ({ ...f, delay_unit: e.target.value }))}
                            >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Time Constraints */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm font-bold text-slate-700">Send Anytime</span>
                            <button 
                                onClick={() => setForm(f => ({ ...f, send_anytime: !f.send_anytime }))}
                                className={`w-11 h-6 rounded-full relative transition-colors ${form.send_anytime ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.send_anytime ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>

                        {!form.send_anytime && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">From</label>
                                    <input type="time" className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-sm font-bold" value={form.time_start} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">To</label>
                                    <input type="time" className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-sm font-bold" value={form.time_end} onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Valid Days</label>
                            <div className="flex justify-between gap-1 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                                {daysList.map((d, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleDay(i)}
                                        className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all ${form.days.includes(i) ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content & Flow */}
                    <div className="space-y-4 pt-2">
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Content Type (Safety)</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-400"
                                value={form.content_type}
                                onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
                            >
                                <option value="default">Default (24h Window)</option>
                                <option value="CONFIRMED_EVENT_UPDATE">Confirmed Event Update</option>
                                <option value="POST_PURCHASE_UPDATE">Post Purchase Update</option>
                                <option value="ACCOUNT_UPDATE">Account Update</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Select Sub Flow</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-green-400"
                                value={form.flow_id}
                                onChange={e => setForm(f => ({ ...f, flow_id: e.target.value }))}
                            >
                                <option value="">Choose a flow...</option>
                                {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-[20px] shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                        {msg ? 'Update Step' : 'Add to Timeline'}
                    </button>
                </div>
            </div>
        </div>
    );
}
