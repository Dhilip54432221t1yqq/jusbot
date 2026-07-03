import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Plus, Edit3, Copy, Trash2, Eye, Link, Play } from 'lucide-react';

export default function FlowList() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectModalFlow, setConnectModalFlow] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [buttonText, setButtonText] = useState('Open Flow');
    const navigate = useNavigate();

    useEffect(() => {
        fetchFlows();
    }, []);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('whatsapp_flows')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setFlows(data || []);
        } catch (err) {
            console.error("Error fetching flows:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const { data } = await supabase.from('whatsapp_templates').select('id, name').eq('status', 'Approved');
            if (data) setTemplates(data);
        } catch(e) { console.error(e); }
    };

    const openConnectModal = (flow) => {
        setConnectModalFlow(flow);
        fetchTemplates();
    };

    const handleConnect = async () => {
        if (!selectedTemplate || !buttonText) return;
        try {
            await supabase.from('whatsapp_template_flows').insert([{
                template_id: selectedTemplate,
                flow_id: connectModalFlow.id,
                button_text: buttonText,
                flow_token_strategy: 'DEFAULT'
            }]);
            setConnectModalFlow(null);
            alert("Successfully connected Flow to Template!");
        } catch(e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this local draft? (Published flows cannot be deleted from Meta here)")) return;
        try {
            await supabase.from('whatsapp_flows').delete().eq('id', id);
            fetchFlows();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDuplicate = async (flow) => {
        const { id, created_at, updated_at, meta_flow_id, ...rest } = flow;
        rest.name = `${flow.name}_copy`;
        rest.status = 'DRAFT';
        
        try {
            await supabase.from('whatsapp_flows').insert([rest]);
            fetchFlows();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Your WhatsApp Flows</h2>
                <button 
                    onClick={() => navigate('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Create Flow
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                            <th className="px-6 py-4 font-medium">Flow Name</th>
                            <th className="px-6 py-4 font-medium">Category</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Endpoint</th>
                            <th className="px-6 py-4 font-medium">Last Updated</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading flows...</td></tr>
                        ) : flows.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-12">
                                    <h3 className="text-lg font-medium text-slate-700">No WhatsApp Flows yet.</h3>
                                    <p className="text-slate-500 mt-1">Create your first interactive WhatsApp experience.</p>
                                    <button 
                                        onClick={() => navigate('create')}
                                        className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
                                    >
                                        Create Flow
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            flows.map(flow => (
                                <tr key={flow.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{flow.name}</div>
                                        {flow.meta_flow_id && <div className="text-xs text-slate-400 font-mono mt-1">ID: {flow.meta_flow_id}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{flow.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            flow.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            flow.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {flow.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {flow.flow_type === 'DYNAMIC' ? (
                                            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded font-medium">Enabled</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Disabled</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {new Date(flow.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => navigate(`edit/${flow.id}`)} className="text-slate-400 hover:text-blue-600" title="Edit/View">
                                                <Edit3 size={18} />
                                            </button>
                                            <button onClick={() => handleDuplicate(flow)} className="text-slate-400 hover:text-slate-700" title="Duplicate">
                                                <Copy size={18} />
                                            </button>
                                            {flow.status === 'PUBLISHED' && (
                                                <button onClick={() => openConnectModal(flow)} className="text-slate-400 hover:text-green-600" title="Connect to Template">
                                                    <Link size={18} />
                                                </button>
                                            )}
                                            {flow.status === 'DRAFT' && (
                                                <button onClick={() => handleDelete(flow.id)} className="text-slate-400 hover:text-red-600" title="Delete Draft">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {connectModalFlow && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-3xl shadow-2xl w-[400px] p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Connect to Template</h3>
                            <button onClick={() => setConnectModalFlow(null)} className="p-2 hover:bg-slate-100 rounded-xl">×</button>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">WhatsApp Template</label>
                                <select 
                                    value={selectedTemplate} 
                                    onChange={e => setSelectedTemplate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="">Select an approved template...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Button Text</label>
                                <input 
                                    type="text" 
                                    value={buttonText} 
                                    onChange={e => setButtonText(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setConnectModalFlow(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
                            <button onClick={handleConnect} className="flex-1 py-3 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-[1.02]">Connect</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
