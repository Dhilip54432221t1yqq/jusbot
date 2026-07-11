import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../db';
import config from '../../config';
import { ArrowLeft, Save, Send, AlertCircle, Code, Layout, Settings, CheckCircle, Smartphone } from 'lucide-react';
import FlowPreview from './FlowPreview';

const CATEGORIES = ['SIGN_UP', 'SIGN_IN', 'APPOINTMENT_BOOKING', 'LEAD_GENERATION', 'CONTACT_US', 'CUSTOMER_SUPPORT', 'SURVEY', 'OTHER'];

const DEFAULT_JSON = {
    "version": "3.1",
    "data_api_version": "3.0",
    "routing_model": {
        "INITIAL_SCREEN": "WELCOME_SCREEN"
    },
    "screens": [
        {
            "id": "WELCOME_SCREEN",
            "title": "Welcome",
            "data": {},
            "layout": {
                "type": "SingleColumnLayout",
                "children": [
                    { "type": "TextHeading", "text": "Hello!" },
                    { "type": "TextBody", "text": "Please fill out this form." },
                    { "type": "TextInput", "label": "Your Name", "name": "user_name", "required": true },
                    { "type": "Footer", "label": "Submit", "on-click-action": { "name": "complete", "payload": { "name": "${form.user_name}" } } }
                ]
            }
        }
    ]
};

export default function FlowBuilder() {
    const { flowId } = useParams();
    const navigate = useNavigate();
    
    // Core state
    const [name, setName] = useState('');
    const [category, setCategory] = useState('LEAD_GENERATION');
    const [flowType, setFlowType] = useState('STATIC'); // 'STATIC' | 'DYNAMIC'
    const [endpointUrl, setEndpointUrl] = useState('');
    
    const [flowJson, setFlowJson] = useState(DEFAULT_JSON);
    const [jsonString, setJsonString] = useState(JSON.stringify(DEFAULT_JSON, null, 2));
    
    const [viewMode, setViewMode] = useState('JSON'); // 'VISUAL' | 'JSON' | 'SETTINGS'
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (flowId) {
            fetchFlowData();
        }
    }, [flowId]);

    const fetchFlowData = async () => {
        try {
            const { data, error: fetchErr } = await supabase.from('whatsapp_flows').select('*').eq('id', flowId).single();
            if (fetchErr) throw fetchErr;
            if (data) {
                setName(data.name);
                setCategory(data.category);
                setFlowType(data.flow_type);
                if (data.endpoint_url) setEndpointUrl(data.endpoint_url);
                if (data.flow_json) {
                    setFlowJson(data.flow_json);
                    setJsonString(JSON.stringify(data.flow_json, null, 2));
                }
            }
        } catch (err) {
            setError('Failed to load flow: ' + err.message);
        }
    };

    const handleJsonChange = (e) => {
        const val = e.target.value;
        setJsonString(val);
        try {
            const parsed = JSON.parse(val);
            setFlowJson(parsed);
            setError('');
        } catch (err) {
            setError('Invalid JSON syntax');
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(jsonString);
            setJsonString(JSON.stringify(parsed, null, 2));
            setError('');
        } catch (err) {
            setError('Cannot format invalid JSON');
        }
    };

    const validateFlow = () => {
        if (!name.trim()) return "Flow name is required";
        if (flowType === 'DYNAMIC' && !endpointUrl.trim()) return "Endpoint URL is required for Dynamic flows";
        
        try {
            const parsed = typeof flowJson === 'string' ? JSON.parse(flowJson) : flowJson;
            if (!parsed.version) return "Flow JSON must have a version";
            if (!parsed.screens || parsed.screens.length === 0) return "Flow JSON must have at least one screen";
        } catch(e) {
            return "Flow JSON is invalid";
        }
        return null;
    };

    const handleSave = async (publish = false) => {
        const valError = validateFlow();
        if (valError) {
            setError(valError);
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            // Need workspaceId from token or context, assume it's fetched or available via context
            // In a real app we'd get workspace_id from auth or url params
            const workspaceIdMatch = window.location.pathname.match(/^\/([^/]+)/);
            const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : null;

            const payload = {
                name,
                category,
                flow_type: flowType,
                flow_json_version: flowJson.version || '3.1',
                data_api_version: flowJson.data_api_version || null,
                endpoint_url: flowType === 'DYNAMIC' ? endpointUrl : null,
                flow_json: typeof flowJson === 'string' ? JSON.parse(flowJson) : flowJson,
                endpoint_enabled: flowType === 'DYNAMIC',
                workspace_id: workspaceId
            };

            let savedFlowId = flowId;
            let currentMetaId = null;

            if (flowId) {
                // Update
                const { data, error: upErr } = await supabase.from('whatsapp_flows').update(payload).eq('id', flowId).select().single();
                if (upErr) throw upErr;
                currentMetaId = data.meta_flow_id;
            } else {
                // Insert
                payload.status = 'DRAFT';
                const { data, error: insErr } = await supabase.from('whatsapp_flows').insert([payload]).select().single();
                if (insErr) throw insErr;
                savedFlowId = data.id;
            }

            if (publish) {
                const { data: { session } } = await supabase.auth.getSession();
                const wabaId = prompt("Enter WABA ID to publish to Meta:");
                if (!wabaId) throw new Error("WABA ID required to publish");

                const response = await fetch(`${config.API_BASE}/whatsapp-flows/publish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ flowId: savedFlowId, wabaId, workspaceId })
                });
                
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to publish');
                
                setSuccessMsg('Flow published successfully!');
            } else {
                setSuccessMsg('Draft saved successfully!');
            }
            
            if (!flowId && savedFlowId) {
                navigate(`../edit/${savedFlowId}`, { replace: true });
            }
            
            setTimeout(() => setSuccessMsg(''), 3000);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('..')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">
                            {flowId ? 'Edit Flow' : 'Create Flow'} {name && `- ${name}`}
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleSave(false)}
                        disabled={loading}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Save size={16} /> Save Draft
                    </button>
                    <button 
                        onClick={() => handleSave(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow hover:shadow-lg flex items-center gap-2 transition"
                    >
                        <Send size={16} /> Publish Flow
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 flex items-center gap-2 shrink-0 border-b border-red-200">
                    <AlertCircle size={18} /> <span className="text-sm font-medium">{error}</span>
                </div>
            )}
            {successMsg && (
                <div className="bg-green-50 text-green-700 p-3 flex items-center gap-2 shrink-0 border-b border-green-200">
                    <CheckCircle size={18} /> <span className="text-sm font-medium">{successMsg}</span>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Tabs Column */}
                <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-4 shrink-0">
                    <button onClick={() => setViewMode('SETTINGS')} className={`p-3 rounded-xl transition ${viewMode === 'SETTINGS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Settings">
                        <Settings size={20} />
                    </button>
                    <button onClick={() => setViewMode('VISUAL')} className={`p-3 rounded-xl transition ${viewMode === 'VISUAL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Visual Builder">
                        <Layout size={20} />
                    </button>
                    <button onClick={() => setViewMode('JSON')} className={`p-3 rounded-xl transition ${viewMode === 'JSON' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="JSON Editor">
                        <Code size={20} />
                    </button>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col overflow-y-auto relative bg-slate-50">
                    
                    {viewMode === 'SETTINGS' && (
                        <div className="max-w-2xl mx-auto w-full p-8 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Flow Configuration</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Flow Name</label>
                                    <input 
                                        type="text" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. sign_up_flow"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Lowercase, numbers, and underscores only.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select 
                                        value={category} onChange={e => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Flow Type</label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={flowType === 'STATIC'} onChange={() => setFlowType('STATIC')} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-medium text-slate-700">Static (No Endpoint)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={flowType === 'DYNAMIC'} onChange={() => setFlowType('DYNAMIC')} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-medium text-slate-700">Dynamic (Uses Endpoint)</span>
                                        </label>
                                    </div>
                                </div>
                                {flowType === 'DYNAMIC' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint URL <span className="text-red-500">*</span></label>
                                        <input 
                                            type="url" value={endpointUrl} onChange={e => setEndpointUrl(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="https://your-server.com/api/webhook"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {viewMode === 'VISUAL' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center shadow-sm max-w-lg">
                                <Layout className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Visual Builder Coming Soon</h3>
                                <p className="text-slate-500 mb-6 leading-relaxed">
                                    The drag-and-drop screen builder is currently under development. 
                                    Please use the <strong>JSON Editor</strong> to build your WhatsApp Flows in the meantime.
                                </p>
                                <button onClick={() => setViewMode('JSON')} className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition">
                                    Switch to JSON Editor
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode === 'JSON' && (
                        <div className="flex-1 flex flex-col p-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-700">Flow JSON Editor</h3>
                                <div className="flex gap-2">
                                    <button onClick={formatJson} className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 font-medium">Format JSON</button>
                                </div>
                            </div>
                            <textarea
                                value={jsonString}
                                onChange={handleJsonChange}
                                className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-xl font-mono text-[13px] outline-none resize-none shadow-inner border border-slate-800 custom-scrollbar"
                                spellCheck={false}
                            />
                        </div>
                    )}

                </div>

                {/* Right Preview Column */}
                <div className="w-[380px] bg-white border-l border-slate-200 p-6 flex flex-col items-center overflow-y-auto shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] hidden lg:flex relative">
                    <div className="w-full flex items-center gap-2 mb-6 text-slate-700">
                        <Smartphone size={18} className="text-blue-500" />
                        <h3 className="font-bold text-sm">Live WhatsApp Preview</h3>
                    </div>
                    <FlowPreview flowJson={flowJson} />
                </div>
            </div>
        </div>
    );
}
