
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, Search, RefreshCw, Folder } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const API_BASE = `${config.API_BASE}/content`;

const ContentManager = ({ onClose = () => {}, isModal = true, workspaceId }) => {
    const [activeTab, setActiveTab] = useState('user'); // user | bot | system | tags | templates
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUploadDropdown, setShowUploadDropdown] = useState(false);
    const [uploadType, setUploadType] = useState('image'); // default for single upload
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const uploadBtnRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const { authFetch } = useAuth();

    // Calculate dropdown position when it opens
    useEffect(() => {
        if (showUploadDropdown && uploadBtnRef.current) {
            const rect = uploadBtnRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right
            });
        }
    }, [showUploadDropdown]);

    const isVariableTab = ['user', 'bot', 'system'].includes(activeTab);

    useEffect(() => {
        if (workspaceId) {
            fetchItems();
        }
    }, [activeTab, workspaceId]);

    const fetchItems = async () => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            let endpoint = activeTab;
            let url = `${API_BASE}/${activeTab}?workspace_id=${workspaceId}`;

            if (isVariableTab) {
                url = `${API_BASE}/fields?workspace_id=${workspaceId}&scope=${activeTab}`;
            } else {
                url = `${API_BASE}/${activeTab.replace('_', '-')}?workspace_id=${workspaceId}`;
            }

            const res = await authFetch(url);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch items', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        if (!workspaceId) return;
        try {
            let url = `${API_BASE}/${activeTab.replace('_', '-')}?workspace_id=${workspaceId}`;
            let sanitizedData;
            
            if (activeTab === 'tags') {
                sanitizedData = { name: data.name, workspace_id: workspaceId };
            } else if (activeTab === 'templates') {
                sanitizedData = {
                    name: data.name,
                    category: data.category,
                    language: data.language,
                    header_type: data.header_type,
                    header_content: data.header_content,
                    body_text: data.body_text,
                    footer_text: data.footer_text,
                    buttons: data.buttons,
                    workspace_id: workspaceId
                };
            } else if (activeTab === 'media') {
                sanitizedData = {
                    name: data.name,
                    type: data.type,
                    url: data.url,
                    size: data.size,
                    workspace_id: workspaceId
                };
            } else {
                sanitizedData = { ...data, workspace_id: workspaceId };
                sanitizedData.field_scope = activeTab;
                url = `${API_BASE}/fields?workspace_id=${workspaceId}`;
            }

            let res;
            if (editingItem) {
                const updateUrl = isVariableTab 
                    ? `${API_BASE}/fields/${editingItem.id}?workspace_id=${workspaceId}`
                    : `${API_BASE}/${activeTab.replace('_', '-')}/${editingItem.id}?workspace_id=${workspaceId}`;
                
                res = await authFetch(updateUrl, {
                    method: 'PUT',
                    body: JSON.stringify(sanitizedData)
                });
            } else {
                res = await authFetch(url, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedData)
                });
            }

            if (!res.ok) throw new Error('Failed to save');

            setShowCreateModal(false);
            setEditingItem(null);
            fetchItems();
        } catch (err) {
            console.error('Save failed', err);
            alert('Error saving data');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            const deleteUrl = isVariableTab 
                ? `${API_BASE}/fields/${id}?workspace_id=${workspaceId}`
                : `${API_BASE}/${activeTab.replace('_', '-')}/${id}?workspace_id=${workspaceId}`;
            
            await authFetch(deleteUrl, { method: 'DELETE' });
            fetchItems();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const filteredItems = items.filter(item => 
        (item.field_name || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderTable = () => {
        if (loading) return <div className="p-8 text-center text-slate-400">Loading variables...</div>;
        if (filteredItems.length === 0) return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                <Folder size={48} className="opacity-20" />
                <p>No {activeTab} fields found</p>
            </div>
        );

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                            <th className="px-6 py-4">{activeTab === 'media' ? 'Name' : 'Field Name'}</th>
                            <th className="px-6 py-4">Type</th>
                            {activeTab === 'bot' && <th className="px-6 py-4">Default Value</th>}
                            {activeTab === 'system' && <th className="px-6 py-4">Scope</th>}
                            {activeTab === 'media' && <th className="px-6 py-4">Size</th>}
                            {activeTab === 'media' && <th className="px-6 py-4">Created At</th>}
                            {activeTab !== 'media' && <th className="px-6 py-4">Folder</th>}
                            {activeTab !== 'media' && <th className="px-6 py-4">Description</th>}
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        <span className="font-semibold text-slate-700 text-sm">
                                            {item.field_name || item.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">
                                        {item.variable_type || item.type}
                                    </span>
                                </td>
                                {activeTab === 'bot' && <td className="px-6 py-4 text-sm text-slate-600 font-mono italic">{item.default_value || item.value || '-'}</td>}
                                {activeTab === 'system' && (
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-500">{item.is_editable ? 'Editable' : 'System Managed'}</span>
                                    </td>
                                )}
                                {activeTab === 'media' && <td className="px-6 py-4 text-xs text-slate-500">{item.size || '-'}</td>}
                                {activeTab === 'media' && (
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                    </td>
                                )}
                                {activeTab !== 'media' && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Folder size={12} />
                                            <span className="text-xs">{item.folder || 'General'}</span>
                                        </div>
                                    </td>
                                )}
                                {activeTab !== 'media' && <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate">{item.description}</td>}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.is_editable !== false && (
                                            <>
                                                <button onClick={() => { setEditingItem(item); setShowCreateModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const tabs = [
        { id: 'user', label: 'User Fields' },
        { id: 'bot', label: 'Bot Fields' },
        { id: 'system', label: 'System Fields' },
        { id: 'tags', label: 'Tags' },
        { id: 'templates', label: 'Templates' },
        { id: 'media', label: 'Media' }
    ];

    return (
        <div className={`flex flex-col h-full bg-white ${isModal ? 'fixed inset-0 z-[100] bg-black/50 items-center justify-center p-12' : ''}`}>
            <div className={`${isModal ? 'bg-white w-full max-w-6xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden' : 'flex-1 flex flex-col h-full'}`}>
                {/* Modern Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>Variable Management</h2>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">Manage data containers and system properties</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Search variables..." 
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {activeTab !== 'system' && (
                            <div 
                                 onMouseEnter={() => activeTab === 'media' && setShowUploadDropdown(true)}
                                 onMouseLeave={() => setShowUploadDropdown(false)}>
                                <button 
                                    ref={uploadBtnRef}
                                    onClick={() => activeTab !== 'media' && setShowCreateModal(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    {activeTab === 'media' ? 'Upload' : `New ${activeTab.replace('_', ' ')}`}
                                </button>
                            </div>
                        )}
                        {isModal && onClose && <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={24} /></button>}
                    </div>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="px-8 border-b border-slate-100 flex items-center gap-2 bg-white sticky top-[89px] z-10">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <div className="p-8">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {renderTable()}
                        </div>

                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateModal
                    type={activeTab === 'media' ? 'media' : activeTab}
                    mediaType={uploadType}
                    initialData={editingItem}
                    onClose={() => { setShowCreateModal(false); setEditingItem(null); }}
                    onSave={handleSave}
                />
            )}

            {/* Fixed-position Upload Dropdown — rendered outside overflow containers */}
            {activeTab === 'media' && showUploadDropdown && (
                <div 
                    className="fixed z-[9999]"
                    style={{ top: dropdownPos.top, right: dropdownPos.right }}
                    onMouseEnter={() => setShowUploadDropdown(true)}
                    onMouseLeave={() => setShowUploadDropdown(false)}
                >
                    <div className="w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2">
                        {[
                            { id: 'image', label: 'Upload Image' },
                            { id: 'audio', label: 'Upload Audio' },
                            { id: 'video', label: 'Upload Video' },
                            { id: 'document', label: 'Upload File' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    setUploadType(opt.id);
                                    setShowCreateModal(true);
                                    setShowUploadDropdown(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateModal = ({ type, mediaType, initialData, onClose, onSave }) => {
    const isVariable = ['user', 'bot', 'system'].includes(type);
    
    const [formData, setFormData] = useState(initialData || {
        field_name: '',
        variable_type: 'Text',
        default_value: '',
        description: '',
        folder: 'General',
        // Legacy/Template fields
        name: '',
        category: 'MARKETING',
        language: 'en',
        header_type: 'None',
        header_content: '',
        body_text: '',
        footer_text: '',
        buttons: [],
        // Media fields
        type: mediaType || 'image',
        url: '',
        size: ''
    });

    const [file, setFile] = useState(null);

    useEffect(() => {
        if (mediaType && !initialData) {
            setFormData(prev => ({ ...prev, type: mediaType }));
        }
    }, [mediaType, initialData]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Format size
            const sizeInBytes = selectedFile.size;
            let formattedSize = '';
            if (sizeInBytes < 1024) formattedSize = sizeInBytes + ' B';
            else if (sizeInBytes < 1024 * 1024) formattedSize = (sizeInBytes / 1024).toFixed(1) + ' KB';
            else formattedSize = (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';

            setFormData(prev => ({
                ...prev,
                name: selectedFile.name,
                size: formattedSize,
                // In a real app, you'd upload now or on save and get a URL.
                // For now, we'll simulate a URL or let user enter if not uploading.
                url: URL.createObjectURL(selectedFile)
            }));
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        // Ensure name consistency for variables vs other items
        const finalData = { ...formData };
        if (isVariable && !finalData.name) {
            finalData.name = finalData.field_name;
        }
        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white w-[540px] rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {initialData ? 'Edit' : 'Upload'} {type === 'media' ? (formData.type ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1) : 'Media') : type.replace('_', ' ')}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Define your {type} data structure</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Name Field */}
                    {!['media', 'tags', 'templates'].includes(type) && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                 {isVariable ? 'Variable Name' : 'Item Name'}
                            </label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                value={isVariable ? formData.field_name : formData.name}
                                onChange={e => handleChange(isVariable ? 'field_name' : 'name', e.target.value)}
                                placeholder={isVariable ? 'e.g. user_city' : 'Enter name'}
                            />
                        </div>
                    )}

                    {isVariable && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Variable Type</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                    value={formData.variable_type}
                                    onChange={e => handleChange('variable_type', e.target.value)}
                                >
                                    {['Text', 'Number', 'Boolean', 'Date', 'DateTime', 'JSON'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Folder</label>
                                <input
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                    value={formData.folder}
                                    onChange={e => handleChange('folder', e.target.value)}
                                    placeholder="Folder name"
                                />
                            </div>
                        </div>
                    )}

                    {type === 'bot' && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Default Value</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                value={formData.default_value || ''}
                                onChange={e => handleChange('default_value', e.target.value)}
                                placeholder="Value shared across all users"
                            />
                        </div>
                    )}

                    {/* Description Area */}
                    {!['media', 'tags', 'templates'].includes(type) && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none min-h-[80px]"
                                value={formData.description || ''}
                                onChange={e => handleChange('description', e.target.value)}
                                placeholder="Explain what this variable stores..."
                            />
                        </div>
                    )}

                    {/* Media Specific Fields */}
                    {type === 'media' && (
                        <div className="space-y-6">
                            {!formData.name && (
                                <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all group cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept={formData.type === 'image' ? 'image/*' : formData.type === 'audio' ? 'audio/*' : formData.type === 'video' ? 'video/*' : '*'}
                                    />
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Plus size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600">Click to select {formData.type}</p>
                                    <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
                                </div>
                            )}

                            {formData.name && (
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                <Folder size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 truncate max-w-[300px]">{formData.name}</p>
                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{formData.type} • {formData.size}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setFormData(prev => ({ ...prev, name: '', url: '', size: '' }))} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Template Specific Logic Omitted for brevity, but should be preserved if needed */}
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-500 hover:bg-slate-200/50 rounded-xl text-sm font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
                    >
                        {initialData ? 'Done' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentManager;
