import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { toast } from 'react-hot-toast';

export default function AgentGroupModal({ isOpen, onClose, group, workspaceId, onSuccess }) {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [workspaceMembers, setWorkspaceMembers] = useState([]);
    const [fetchingMembers, setFetchingMembers] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        image_url: '',
        assign_method: 'random',
        assign_by_status: 'default',
        group_chat_enabled: true,
        conversation_visibility: 'all'
    });

    const [selectedMembers, setSelectedMembers] = useState({}); // { user_id: { weighting: number } }

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            if (group) {
                setFormData({
                    name: group.name || '',
                    image_url: group.image_url || '',
                    assign_method: group.assign_method || 'random',
                    assign_by_status: group.assign_by_status || 'default',
                    group_chat_enabled: group.group_chat_enabled ?? true,
                    conversation_visibility: group.conversation_visibility || 'all'
                });

                const membersObj = {};
                if (group.agent_group_members) {
                    group.agent_group_members.forEach(m => {
                        membersObj[m.user_id] = { weighting: m.weighting || 0 };
                    });
                }
                setSelectedMembers(membersObj);
            }
        }
    }, [isOpen, group]);

    const fetchMembers = async () => {
        setFetchingMembers(true);
        try {
            const res = await authFetch(`${config.API_BASE}/workspaces/${workspaceId}/members`);
            if (res.ok) {
                const data = await res.json();
                setWorkspaceMembers(data || []);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setFetchingMembers(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100 * 1024) {
            toast.error("Image size must be less than 100kb.");
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${workspaceId}-${Math.random()}.${fileExt}`;
            const filePath = `groups/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('agent-group-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('agent-group-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Image Upload Failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const membersArr = Object.entries(selectedMembers).map(([user_id, data]) => ({
            user_id,
            weighting: data.weighting
        }));

        const payload = {
            ...formData,
            members: membersArr
        };

        try {
            const url = group 
                ? `${config.API_BASE}/agent-groups/${group.id}` 
                : `${config.API_BASE}/agent-groups/workspace/${workspaceId}`;
            const method = group ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save agent group');
            }

            toast.success(`Agent group ${group ? 'updated' : 'created'} successfully`);
            onSuccess();
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (userId) => {
        setSelectedMembers(prev => {
            const newSelected = { ...prev };
            if (newSelected[userId]) {
                delete newSelected[userId];
            } else {
                newSelected[userId] = { weighting: 4 }; // Default weighting
            }
            return newSelected;
        });
    };

    const updateWeighting = (userId, increment) => {
        setSelectedMembers(prev => {
            if (!prev[userId]) return prev;
            const newWeighting = Math.max(0, prev[userId].weighting + increment);
            return {
                ...prev,
                [userId]: { ...prev[userId], weighting: newWeighting }
            };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Group</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex gap-8 mb-8">
                        {/* Image Upload */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Image <span className="font-normal text-slate-400">PNG, 512x512, max 100kB.</span>
                            </label>
                            <div className="relative group w-24 h-24">
                                <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 bg-slate-50 cursor-pointer">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Group" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon className="text-slate-300 w-8 h-8 mb-1" />
                                            <span className="text-[10px] text-slate-400 font-medium">Image</span>
                                        </>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </div>
                        </div>

                        {/* Group Name */}
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-700 mb-2 block">
                                <span className="text-red-500">*</span> Group Name
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    maxLength={100}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">{formData.name.length}/100</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Assign Method */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-3 block">Assign Method</label>
                            <div className="flex items-center gap-5">
                                {['random', 'least_assigned', 'round_robin'].map(method => (
                                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="assign_method" 
                                            value={method}
                                            checked={formData.assign_method === method}
                                            onChange={(e) => setFormData({...formData, assign_method: e.target.value})}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-600 capitalize">{method.replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Group Chat Toggle */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-3 block">Group Chat</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.group_chat_enabled}
                                    onChange={(e) => setFormData({...formData, group_chat_enabled: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Assign by status */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-3 block">Assign by status</label>
                            <div className="flex items-center gap-5">
                                {['default', 'online_first', 'online_only'].map(status => (
                                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="assign_status" 
                                            value={status}
                                            checked={formData.assign_by_status === status}
                                            onChange={(e) => setFormData({...formData, assign_by_status: e.target.value})}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-600 capitalize">{status.replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Conversation Visibility */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-3 block">Conversation visibility</label>
                            <select 
                                value={formData.conversation_visibility}
                                onChange={(e) => setFormData({...formData, conversation_visibility: e.target.value})}
                                className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm outline-none text-slate-700"
                            >
                                <option value="all">All conversations</option>
                                <option value="assigned_to_me">Only conversations assigned to me</option>
                            </select>
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-400">Member</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-400 w-32 text-center">Role</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-400 w-32 text-center">Weighting</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-400 w-24 text-center">In Group</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fetchingMembers ? (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                                            Loading members...
                                        </td>
                                    </tr>
                                ) : workspaceMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                                            No workspace members found.
                                        </td>
                                    </tr>
                                ) : (
                                    workspaceMembers.map(member => {
                                        const isSelected = !!selectedMembers[member.user_id];
                                        const weighting = selectedMembers[member.user_id]?.weighting || 0;
                                        
                                        return (
                                            <tr key={member.user_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 flex items-center gap-3">
                                                    {member.avatar_url ? (
                                                        <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                                            {member.email?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-slate-700 font-medium">{member.name || member.email}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize
                                                        ${member.role === 'owner' ? 'bg-slate-100 text-slate-600' : 
                                                          member.role === 'admin' ? 'bg-green-500 text-white' : 
                                                          'bg-blue-500 text-white'}`}
                                                    >
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isSelected && (
                                                        <div className="flex items-center justify-center">
                                                            <div className="flex border border-slate-300 rounded-md overflow-hidden bg-white">
                                                                <button onClick={() => updateWeighting(member.user_id, -1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 border-r border-slate-300">-</button>
                                                                <div className="px-4 py-1 text-sm text-slate-700 w-12 text-center">{weighting}</div>
                                                                <button onClick={() => updateWeighting(member.user_id, 1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 border-l border-slate-300">+</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <label className="relative inline-flex items-center justify-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={isSelected}
                                                            onChange={() => toggleMember(member.user_id)}
                                                        />
                                                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                                    </label>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || !formData.name}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {group ? 'Save' : 'Create'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
