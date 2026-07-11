import React, { useState, useEffect } from 'react';
import { supabase } from '../../db';
import config from '../../config';
import { ArrowLeft, Plus, Trash2, HelpCircle, Save, Send } from 'lucide-react';
import PhonePreview from './PhonePreview';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const LANGUAGES = [{ code: 'en_US', name: 'English (US)' }, { code: 'en_GB', name: 'English (UK)' }, { code: 'es', name: 'Spanish' }];
const HEADER_TYPES = ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];
const PARAM_FORMATS = [{ id: 'named', label: 'Named (e.g. {{first_name}})' }, { id: 'positional', label: 'Positional (e.g. {{1}})' }];

export default function TemplateBuilder({ workspaceId, initialData, onBack }) {
    const { authFetch } = useAuth();
    const [name, setName] = useState(initialData?.name || '');
    const [category, setCategory] = useState(initialData?.category || 'MARKETING');
    const [language, setLanguage] = useState(initialData?.language || 'en_US');
    const [format, setFormat] = useState(initialData?.parameter_format || 'named');

    const [headerType, setHeaderType] = useState('NONE');
    const [headerText, setHeaderText] = useState('');
    
    const [bodyText, setBodyText] = useState('');
    const [bodyExamples, setBodyExamples] = useState({});

    const [footerText, setFooterText] = useState('');
    
    const [buttons, setButtons] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData?.components) {
            const h = initialData.components.find(c => c.type === 'HEADER');
            if (h) {
                setHeaderType(h.format);
                if (h.format === 'TEXT') setHeaderText(h.text || '');
            }
            const b = initialData.components.find(c => c.type === 'BODY');
            if (b) {
                setBodyText(b.text || '');
                if (b.example) {
                    const ex = {};
                    if (initialData.parameter_format === 'named' && b.example.body_text_named_params) {
                        b.example.body_text_named_params.forEach(p => { ex[p.param_name] = p.example; });
                    } else if (initialData.parameter_format === 'positional' && b.example.body_text && b.example.body_text[0]) {
                        b.example.body_text[0].forEach((val, i) => { ex[i+1] = val; });
                    }
                    setBodyExamples(ex);
                }
            }
            const f = initialData.components.find(c => c.type === 'FOOTER');
            if (f) setFooterText(f.text || '');
            
            const btn = initialData.components.find(c => c.type === 'BUTTONS');
            if (btn && btn.buttons) setButtons(btn.buttons);
        }
    }, [initialData]);

    const extractedVars = React.useMemo(() => {
        const regex = format === 'named' ? /{{([a-z_]+)}}/g : /{{(\d+)}}/g;
        const matches = [...bodyText.matchAll(regex)];
        return [...new Set(matches.map(m => m[1]))];
    }, [bodyText, format]);

    const handleVarExampleChange = (variable, value) => {
        setBodyExamples(prev => ({ ...prev, [variable]: value }));
    };

    const getTemplateData = () => {
        const components = [];
        
        if (headerType !== 'NONE') {
            components.push({
                type: 'HEADER',
                format: headerType,
                ...(headerType === 'TEXT' ? { text: headerText } : {})
            });
        }
        
        const bodyComp = { type: 'BODY', text: bodyText };
        if (extractedVars.length > 0) {
            if (format === 'named') {
                bodyComp.example = {
                    body_text_named_params: extractedVars.map(v => ({
                        param_name: v,
                        example: bodyExamples[v] || ''
                    }))
                };
            } else {
                bodyComp.example = {
                    body_text: [extractedVars.map(v => bodyExamples[v] || '')]
                };
            }
        }
        components.push(bodyComp);
        
        if (footerText) {
            components.push({ type: 'FOOTER', text: footerText });
        }
        
        if (buttons.length > 0) {
            components.push({ type: 'BUTTONS', buttons });
        }
        
        return {
            name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            category,
            language,
            parameter_format: format,
            components,
            status: initialData?.status || 'Draft',
            workspace_id: workspaceId
        };
    };

    const handleSave = async (submit = false) => {
        if (!name || !bodyText) {
            setError('Name and Body text are required.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const dataToSave = getTemplateData();
            let savedTmpl = initialData;
            
            if (initialData?.id) {
                const { data } = await supabase.from('whatsapp_templates').update(dataToSave).eq('id', initialData.id).select().single();
                savedTmpl = data;
            } else {
                const { data } = await supabase.from('whatsapp_templates').insert([dataToSave]).select().single();
                savedTmpl = data;
            }

            if (submit && savedTmpl) {
                const response = await authFetch(`${config.API_BASE}/whatsapp-templates/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        templateId: savedTmpl.id,
                        workspaceId
                    })
                });
                
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to submit template');
                }
            }
            
            onBack();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addButton = (type) => {
        if (buttons.length >= 3) return; // Meta limit usually 3 max depending on type
        setButtons([...buttons, { type, text: 'Click Here', ...(type === 'URL' ? { url: 'https://' } : type === 'PHONE_NUMBER' ? { phone_number: '' } : {}) }]);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{initialData?.id ? 'Edit Template' : 'Create Template'}</h1>
                        <p className="text-sm text-slate-500">Design your WhatsApp message template.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleSave(false)} 
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Save size={16} /> Save Draft
                    </button>
                    <button 
                        onClick={() => handleSave(true)} 
                        disabled={loading}
                        className="px-4 py-2 bg-[#00a884] text-white rounded-lg font-medium hover:bg-[#008f6f] flex items-center gap-2"
                    >
                        <Send size={16} /> Submit to Meta
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Builder Panel */}
                <div className="flex-1 overflow-y-auto p-6 flex justify-center">
                    <div className="max-w-2xl w-full space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-800">Basic Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                        placeholder="e.g. order_confirmation"
                                        maxLength={512}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Lowercase, numbers, and underscores only.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select 
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                                    <select 
                                        value={language} 
                                        onChange={e => setLanguage(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    >
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Parameter Format</label>
                                    <select 
                                        value={format} 
                                        onChange={e => setFormat(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    >
                                        {PARAM_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Components */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-slate-800">Template Components</h2>
                            
                            {/* Header */}
                            <div className="space-y-3">
                                <label className="block font-medium text-slate-700">Header (Optional)</label>
                                <select 
                                    value={headerType}
                                    onChange={e => setHeaderType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                >
                                    {HEADER_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                {headerType === 'TEXT' && (
                                    <input 
                                        type="text" 
                                        value={headerText}
                                        onChange={e => setHeaderText(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm mt-2"
                                        placeholder="Header text..."
                                        maxLength={60}
                                    />
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Body */}
                            <div className="space-y-3">
                                <label className="block font-medium text-slate-700">Body <span className="text-red-500">*</span></label>
                                <textarea
                                    value={bodyText}
                                    onChange={e => setBodyText(e.target.value)}
                                    rows={5}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
                                    placeholder={format === 'named' ? "Hi {{first_name}}, your order is ready." : "Hi {{1}}, your order is ready."}
                                    maxLength={1024}
                                />
                                {extractedVars.length > 0 && (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <HelpCircle size={16} /> Example Values for Variables
                                        </h4>
                                        {extractedVars.map(v => (
                                            <div key={v} className="flex items-center gap-3">
                                                <span className="text-sm text-slate-600 font-mono bg-slate-200 px-2 py-1 rounded w-32 shrink-0">{`{{${v}}}`}</span>
                                                <input 
                                                    type="text"
                                                    value={bodyExamples[v] || ''}
                                                    onChange={e => handleVarExampleChange(v, e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-green-500"
                                                    placeholder="Example value"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Footer */}
                            <div className="space-y-3">
                                <label className="block font-medium text-slate-700">Footer (Optional)</label>
                                <input 
                                    type="text" 
                                    value={footerText}
                                    onChange={e => setFooterText(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    placeholder="e.g. Reply STOP to unsubscribe"
                                    maxLength={60}
                                />
                            </div>

                            <hr className="border-slate-100" />

                            {/* Buttons */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block font-medium text-slate-700">Buttons (Optional, max 3)</label>
                                    {buttons.length < 3 && (
                                        <div className="flex gap-2">
                                            <button onClick={() => addButton('QUICK_REPLY')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700 font-medium">+ Quick Reply</button>
                                            <button onClick={() => addButton('URL')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700 font-medium">+ URL</button>
                                        </div>
                                    )}
                                </div>
                                
                                {buttons.map((btn, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 relative">
                                        <button 
                                            onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="text-xs font-semibold text-slate-500">{btn.type} BUTTON</div>
                                        <input 
                                            type="text"
                                            value={btn.text}
                                            onChange={e => {
                                                const nb = [...buttons];
                                                nb[idx].text = e.target.value;
                                                setButtons(nb);
                                            }}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-green-500"
                                            placeholder="Button Text"
                                            maxLength={25}
                                        />
                                        {btn.type === 'URL' && (
                                            <input 
                                                type="text"
                                                value={btn.url}
                                                onChange={e => {
                                                    const nb = [...buttons];
                                                    nb[idx].url = e.target.value;
                                                    setButtons(nb);
                                                }}
                                                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-green-500"
                                                placeholder="https://..."
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="w-[400px] bg-slate-100 border-l border-slate-200 p-6 flex flex-col items-center overflow-y-auto hidden lg:flex">
                    <h3 className="font-semibold text-slate-700 mb-6 w-full text-left">Live Preview</h3>
                    <PhonePreview templateData={getTemplateData()} />
                </div>
            </div>
        </div>
    );
}
