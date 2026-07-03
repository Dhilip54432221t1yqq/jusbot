import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit3, Copy, Send, Trash2, ChevronLeft, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import TemplateBuilder from './TemplateBuilder';

const SAMPLE_TEMPLATES = [
    {
        name: 'order_confirmation',
        category: 'UTILITY',
        language: 'en_US',
        parameter_format: 'named',
        components: [
            { type: 'BODY', text: 'Thank you, {{first_name}}! Your order number is {{order_number}}.', example: { body_text_named_params: [{ param_name: 'first_name', example: 'Pablo' }, { param_name: 'order_number', example: '860198-230332' }] } },
            { type: 'FOOTER', text: 'Reply STOP to unsubscribe' }
        ]
    },
    {
        name: 'appointment_reminder',
        category: 'UTILITY',
        language: 'en_US',
        parameter_format: 'named',
        components: [
            { type: 'BODY', text: 'Hi {{name}}, this is a reminder for your appointment on {{date}} at {{time}}.', example: { body_text_named_params: [{ param_name: 'name', example: 'John' }, { param_name: 'date', example: 'Oct 15' }, { param_name: 'time', example: '10:00 AM' }] } },
            { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Confirm' }, { type: 'QUICK_REPLY', text: 'Reschedule' }] }
        ]
    },
    {
        name: 'discount_offer',
        category: 'MARKETING',
        language: 'en_US',
        parameter_format: 'named',
        components: [
            { type: 'HEADER', format: 'IMAGE' },
            { type: 'BODY', text: 'Exclusive offer for you, {{name}}! Get {{discount}} off your next purchase using code: {{code}}.', example: { body_text_named_params: [{ param_name: 'name', example: 'Sarah' }, { param_name: 'discount', example: '20%' }, { param_name: 'code', example: 'SAVE20' }] } },
            { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Shop Now', url: 'https://example.com/shop' }] }
        ]
    },
    {
        name: 'login_otp',
        category: 'AUTHENTICATION',
        language: 'en_US',
        parameter_format: 'positional',
        components: [
            { type: 'BODY', text: 'Your verification code is {{1}}. Never share this code with anyone.', example: { body_text: [['123456']] } },
            { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Copy Code', url: 'https://' }] } // Using URL for copy as a placeholder if copy code isn't supported
        ]
    }
];

export default function WhatsAppTemplates() {
    const [view, setView] = useState('list'); // 'list' | 'builder'
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const { user } = useAuth();
    const { workspaceId } = useParams();

    useEffect(() => {
        if (view === 'list') {
            fetchTemplates();
        }
    }, [view, workspaceId]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('whatsapp_templates')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setTemplates(data || []);
        } catch (err) {
            console.error("Error fetching templates:", err);
            // Ignore error for now, maybe table doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            await supabase.from('whatsapp_templates').delete().eq('id', id);
            fetchTemplates();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDuplicate = (tmpl) => {
        const dup = { ...tmpl, id: null, name: tmpl.name + '_copy', status: 'Draft' };
        setEditingTemplate(dup);
        setView('builder');
    };

    if (view === 'builder') {
        return (
            <TemplateBuilder 
                workspaceId={workspaceId}
                initialData={editingTemplate}
                onBack={() => {
                    setView('list');
                    setEditingTemplate(null);
                }} 
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-tight">WhatsApp Message Templates</h1>
                    <p className="text-sm text-slate-500 mt-1">Create and manage Meta-approved templates for outgoing messages.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm outline-none cursor-pointer"
                        onChange={(e) => {
                            if (e.target.value !== '') {
                                const sample = SAMPLE_TEMPLATES[e.target.value];
                                setEditingTemplate(sample);
                                setView('builder');
                                e.target.value = '';
                            }
                        }}
                    >
                        <option value="">Use Sample Template...</option>
                        {SAMPLE_TEMPLATES.map((t, i) => (
                            <option key={i} value={i}>{t.category}: {t.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => { setEditingTemplate(null); setView('builder'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        <Plus size={18} />
                        Create Template
                    </button>
                </div>
            </header>

            <div className="p-8 flex-1 overflow-y-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="px-6 py-4 font-medium">Template Name</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium">Language</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Quality</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading...</td></tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <Plus size={24} className="text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-700">No templates yet</h3>
                                            <p className="text-slate-500 mt-1 max-w-sm">Create your first WhatsApp message template to start engaging customers outside the 24h window.</p>
                                            <button 
                                                onClick={() => setView('builder')}
                                                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
                                            >
                                                Create Template
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                templates.map(tmpl => (
                                    <tr key={tmpl.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{tmpl.name}</td>
                                        <td className="px-6 py-4 text-slate-600 capitalize">{tmpl.category}</td>
                                        <td className="px-6 py-4 text-slate-600">{tmpl.language}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                                ${tmpl.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                  tmpl.status === 'In Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                  tmpl.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                  'bg-slate-100 text-slate-700 border-slate-200'}`
                                            }>
                                                {tmpl.status === 'Approved' && <CheckCircle size={12} />}
                                                {tmpl.status === 'In Review' && <Clock size={12} />}
                                                {tmpl.status === 'Rejected' && <XCircle size={12} />}
                                                {tmpl.status === 'Draft' && <Edit3 size={12} />}
                                                {tmpl.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {tmpl.quality_rating || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => { setEditingTemplate(tmpl); setView('builder'); }} className="text-slate-400 hover:text-blue-600" title="Edit/View">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => handleDuplicate(tmpl)} className="text-slate-400 hover:text-slate-700" title="Duplicate">
                                                    <Copy size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(tmpl.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
