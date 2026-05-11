import { useState, useEffect } from 'react';
import { 
    CheckCircle2, FileText, Plus, 
    Download, Upload, MoreHorizontal, MessageCircle, Instagram, Facebook, 
    Globe, Clock, Tag, X, User, Trash2, Edit3, Search, Filter as FilterIcon
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import config from '../config';

const API_BASE = `${config.API_BASE}/contacts`;

const BotUsers = () => {
    const { workspaceId } = useParams();
    
    const [contacts, setContacts] = useState(/** @type {any[]} */ ([]));
    const [segments, setSegments] = useState(/** @type {any[]} */ ([]));
    const [activeSegment, setActiveSegment] = useState(/** @type {any} */ (null));
    const [importJobs, setImportJobs] = useState(/** @type {any[]} */ ([]));
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState(/** @type {any} */ (null));
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        phone: '',
        channel: 'whatsapp',
        channel_user_id: ''
    });
    const [creatingUser, setCreatingUser] = useState(false);
    const [showCreateSegmentModal, setShowCreateSegmentModal] = useState(false);
    const [newSegmentName, setNewSegmentName] = useState('');
    const [creatingSegment, setCreatingSegment] = useState(false);
    
    // Filters State
    const [filters, setFilters] = useState({
        channel: '',
        tag: [],
        email_exists: 'false',
        phone_exists: 'false'
    });

    const fetchContacts = async (extraFilters = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('workspace_id', workspaceId || '');
            queryParams.append('search', searchQuery);
            
            // Append main filters
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => queryParams.append(key, v));
                } else if (value !== '' && value !== 'false') {
                    queryParams.append(key, value);
                }
            });

            // Append extra filters (from segments)
            Object.entries(extraFilters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => queryParams.append(key, v));
                } else {
                    queryParams.append(key, String(value));
                }
            });

            const res = await fetch(`${API_BASE}?${queryParams.toString()}`);
            const data = await res.json();
            setContacts(Array.isArray(data?.items) ? data.items : []);
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSegments = async () => {
        try {
            const res = await fetch(`${API_BASE}/segments?workspace_id=${workspaceId}`);
            const data = await res.json();
            setSegments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch segments:', err);
        }
    };

    const fetchImportJobs = async () => {
        try {
            const res = await fetch(`${API_BASE}/import-jobs?workspace_id=${workspaceId}`);
            const data = await res.json();
            setImportJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    useEffect(() => {
        if (workspaceId) {
            fetchContacts();
            fetchSegments();
            fetchImportJobs();
        }
    }, [workspaceId]);

    const handleApplySegment = (/** @type {any} */ segment) => {
        setActiveSegment(segment);
        // Map segment conditions to filters
        /** @type {any} */
        const segmentFilters = {};
        segment.conditions.forEach((/** @type {any} */ c) => {
            segmentFilters[c.field] = c.value;
        });
        fetchContacts(segmentFilters);
    };

    const handleSearch = (/** @type {any} */ e) => {
        if (e.key === 'Enter') {
            fetchContacts();
        }
    };

    const toggleFilter = (/** @type {string} */ key, /** @type {any} */ value) => {
        setFilters((/** @type {any} */ prev) => ({
            ...prev,
            [key]: prev[key] === value ? '' : value
        }));
    };

    const handleCreateUser = async () => {
        if (!newUserForm.name) return; // Basic validation
        setCreatingUser(true);
        try {
            const body = {
                workspace_id: workspaceId,
                ...newUserForm,
                channel_user_id: newUserForm.channel_user_id || `usr_${Date.now()}`
            };

            const res = await fetch(`${API_BASE}/upsert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowCreateUserModal(false);
                setNewUserForm({ name: '', email: '', phone: '', channel: 'whatsapp', channel_user_id: '' });
                fetchContacts();
            }
        } catch (err) {
            console.error('Failed to create user:', err);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleCreateSegment = async () => {
        if (!newSegmentName) return;
        setCreatingSegment(true);
        try {
            // Simplified segment creation with no conditions initially or using current filters
            /** @type {any[]} */
            const conditions = [];
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'false' && !Array.isArray(value)) {
                    conditions.push({ field: key, operator: 'equals', value });
                }
            });

            const res = await fetch(`${API_BASE}/segments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace_id: workspaceId,
                    name: newSegmentName,
                    conditions
                })
            });

            if (res.ok) {
                setShowCreateSegmentModal(false);
                setNewSegmentName('');
                fetchSegments();
            }
        } catch (err) {
            console.error('Failed to create segment:', err);
        } finally {
            setCreatingSegment(false);
        }
    };

    /** @param {any} contact */
    const handleContactClick = async (contact) => {
        try {
            const res = await fetch(`${API_BASE}/${contact.id}?workspace_id=${workspaceId}`);
            const data = await res.json();
            setSelectedContact(data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setSelectedContact(contact); // Fallback to basic data
        }
    };

    return (
        <>
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Bot Users</h2>
                        <div className="flex items-center gap-6 mt-4">
                            <button 
                                onClick={() => { setActiveSegment(null); fetchContacts({}); }}
                                className={`text-sm font-bold pb-2 transition-all border-b-2 ${!activeSegment ? 'text-green-600 border-green-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                All Users
                            </button>
                            {segments.map((/** @type {any} */ seg) => (
                                <button 
                                    key={seg.id}
                                    onClick={() => handleApplySegment(seg)}
                                    className={`text-sm font-bold pb-2 transition-all border-b-2 ${activeSegment?.id === seg.id ? 'text-green-600 border-green-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                                >
                                    {seg.name}
                                </button>
                            ))}
                            <button 
                                onClick={() => setShowCreateSegmentModal(true)}
                                className="text-sm font-bold text-green-600/60 pb-2 flex items-center gap-1 hover:text-green-600 transition-all"
                            >
                                <Plus size={14} /> New Segment
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                        >
                            <Upload size={16} /> Import
                        </button>
                        <button 
                            onClick={() => setShowCreateUserModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Create User
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {/* Controls Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <FilterIcon size={16} /> {Object.values(filters).filter(v => v !== '' && v !== 'false').length > 0 ? 'Filters Active' : 'Advanced Filters'}
                            </button>
                            <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Expansion */}
                    {showFilters && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm animate-in slide-in-from-top duration-200">
                             <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FilterIcon size={14} className="text-blue-500" /> Filter Conditions
                                </h4>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => { setFilters({ channel:'', tag:[], email_exists: 'false', phone_exists:'false' }); fetchContacts({}); }}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        Clear All
                                    </button>
                                    <button 
                                        onClick={() => fetchContacts()}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Channel</p>
                                    <div className="space-y-2">
                                        {['whatsapp', 'instagram', 'facebook', 'telegram'].map(ch => (
                                            <label key={ch} className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={filters.channel === ch}
                                                    onChange={() => toggleFilter('channel', ch)}
                                                    className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 capitalize">{ch}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Profile Data</p>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={filters.email_exists === 'true'}
                                                onChange={() => setFilters(prev => ({ ...prev, email_exists: prev.email_exists === 'true' ? 'false' : 'true' }))}
                                                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">Email exists</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={filters.phone_exists === 'true'}
                                                onChange={() => setFilters(prev => ({ ...prev, phone_exists: prev.phone_exists === 'true' ? 'false' : 'true' }))}
                                                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">Phone exists</span>
                                        </label>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Contacts Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Bot User</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Channel</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Status</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Last Active</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Subscribed</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading audience...</td></tr>
                                ) : contacts.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No users found. Start an interaction to see data!</td></tr>
                                ) : contacts.map((/** @type {any} */ contact) => (
                                    <tr 
                                        key={contact.id} 
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        onClick={() => handleContactClick(contact)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold">
                                                    {contact.avatar_url ? <img src={contact.avatar_url} alt="" className="w-full h-full object-cover" /> : contact.name?.charAt(0) || <User size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{contact.name || 'Anonymous User'}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{contact.email || contact.phone || 'No contact info'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {contact.channel === 'instagram' ? <Instagram size={14} className="text-pink-500" /> : 
                                                 contact.channel === 'facebook' ? <Facebook size={14} className="text-blue-600" /> :
                                                 contact.channel === 'whatsapp' ? <MessageCircle size={14} className="text-green-500" /> :
                                                 <Globe size={14} className="text-slate-400" />}
                                                <span className="text-xs font-semibold text-slate-600 capitalize">{contact.channel}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                                contact.status === 'subscribed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {contact.status || 'Subscribed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Clock size={12} />
                                                <span className="text-xs font-medium">{new Date(contact.last_interaction).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-slate-500">{new Date(contact.subscribed_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {/* Profile Slide-over */}
            {selectedContact && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedContact(null)}></div>
                    <div className="relative w-[500px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        {/* Profile Header */}
                        <div className="p-8 border-b border-slate-100 relative">
                            <button 
                                onClick={() => setSelectedContact(null)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                            >
                                <X size={20} />
                            </button>
                            
                            <div className="flex flex-col items-center text-center mt-4">
                                <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden mb-4">
                                    {selectedContact.avatar_url ? <img src={selectedContact.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={48} className="text-slate-300 m-6" />}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>{selectedContact.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{selectedContact.channel} user</span>
                                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
                                    <FileText size={18} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Download Data</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-4 bg-red-50/50 rounded-2xl hover:bg-red-50 transition-all border border-red-100">
                                    <Trash2 size={18} className="text-red-400" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Delete User</span>
                                </button>
                            </div>
                        </div>

                        {/* Profile Tabs */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-8 space-y-8">
                                {/* System Info Section */}
                                <section>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Channel Details</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm italic font-serif">ID</div>
                                                <span className="text-xs font-bold text-slate-600">Channel User ID</span>
                                            </div>
                                            <code className="text-[10px] bg-white px-2 py-1 rounded border border-slate-100 font-mono text-slate-500">{selectedContact.channel_user_id || 'unassigned'}</code>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Language</p>
                                                <p className="text-xs font-bold text-slate-700">{selectedContact.language || 'English (en)'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Timezone</p>
                                                <p className="text-xs font-bold text-slate-700">{selectedContact.timezone || 'UTC+0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Tags Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tags</h4>
                                        <button className="text-[10px] font-bold text-blue-600 hover:underline">+ Manage</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedContact.user_tags || []).map((/** @type {any} */ t) => (
                                            <span key={t.tag_id} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                                                <Tag size={10} /> {t.tags?.name}
                                            </span>
                                        ))}
                                        <button className="px-3 py-1.5 border border-dashed border-slate-300 text-slate-400 rounded-xl text-xs font-bold hover:border-blue-400 hover:text-blue-500 transition-all">+ Add Tag</button>
                                    </div>
                                </section>

                                {/* Custom User Fields Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">User Fields</h4>
                                        <button className="text-[10px] font-bold text-blue-600 hover:underline">Edit All</button>
                                    </div>
                                    <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                                        {(selectedContact.user_field_values || []).map((/** @type {any} */ f) => (
                                            <div key={f.field_id} className="p-4 flex items-center justify-between group">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{f.fields?.field_name}</span>
                                                    <span className="text-sm font-semibold text-slate-700">{f.value || '-'}</span>
                                                </div>
                                                <button className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-500 transition-all">
                                                    <Edit3 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="p-6 text-center">
                                            <p className="text-xs text-slate-400 mb-2">No other custom fields set for this user.</p>
                                            <button className="text-xs font-bold text-blue-600 hover:underline">+ Assign Field</button>
                                        </div>
                                    </div>
                                </section>

                                {/* Notes Section */}
                                <section className="pb-8">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Internal Notes</h4>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <textarea 
                                                placeholder="Add an internal note about this user..."
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-h-[100px] transition-all"
                                            />
                                            <button className="absolute bottom-3 right-3 px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-blue-100 hover:scale-105 transition-all">
                                                Post Note
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {(selectedContact.contact_notes || []).map((/** @type {any} */ note) => (
                                                <div key={note.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-slate-800">Agent {note.agent_id?.slice(0, 4)}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed">{note.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCreateUserModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Create Bot User</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Add a new user manually</p>
                                </div>
                                <button onClick={() => setShowCreateUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Full Name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                        value={newUserForm.name}
                                        onChange={e => setNewUserForm(prev => ({...prev, name: e.target.value}))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                                        <input 
                                            type="email" 
                                            placeholder="user@example.com"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                            value={newUserForm.email}
                                            onChange={e => setNewUserForm(prev => ({...prev, email: e.target.value}))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                                        <input 
                                            type="tel" 
                                            placeholder="+1 234..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                            value={newUserForm.phone}
                                            onChange={e => setNewUserForm(prev => ({...prev, phone: e.target.value}))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Channel</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none"
                                        value={newUserForm.channel}
                                        onChange={e => setNewUserForm(prev => ({...prev, channel: e.target.value}))}
                                    >
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="telegram">Telegram</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => setShowCreateUserModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                                <button 
                                    onClick={handleCreateUser} 
                                    disabled={creatingUser || !newUserForm.name}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all disabled:opacity-50"
                                >
                                    {creatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Segment Modal */}
            {showCreateSegmentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCreateSegmentModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Save Segment</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Save current filters as a segment</p>
                                </div>
                                <button onClick={() => setShowCreateSegmentModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Segment Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. VIP Customers"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                        value={newSegmentName}
                                        onChange={e => setNewSegmentName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => setShowCreateSegmentModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                                <button 
                                    onClick={handleCreateSegment} 
                                    disabled={creatingSegment || !newSegmentName}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transition-all disabled:opacity-50"
                                >
                                    {creatingSegment ? 'Saving...' : 'Save Segment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowImportModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Import Bot Users</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Upload CSV to bulk create or update contacts</p>
                                </div>
                                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={24} className="text-slate-400" /></button>
                            </div>

                            {/* Job Progress */}
                            <div className="mb-10">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Active & Recent Jobs</h4>
                                <div className="space-y-3">
                                    {importJobs.length === 0 ? (
                                        <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                            <p className="text-xs text-slate-300">No import history found</p>
                                        </div>
                                    ) : importJobs.map(job => (
                                        <div key={job.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${job.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 animate-pulse'}`}>
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{job.filename}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                                                        {job.processed_rows} / {job.total_rows} rows processed • {job.status}
                                                    </p>
                                                </div>
                                            </div>
                                            {job.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div className="p-12 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={32} className="text-blue-600" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-1">Click to upload CSV</h4>
                                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">Ensure your CSV contains columns: <b>name, email, phone, tag, city</b></p>
                                <input type="file" className="hidden" accept=".csv" />
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button onClick={() => setShowImportModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                                <button className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all">Start Import Job</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BotUsers;
