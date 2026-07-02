import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Search, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import LottieLoader from '../../components/LottieLoader';
import { toast } from 'react-hot-toast';
import AgentGroupModal from '../../components/AgentGroupModal';

export default function AgentGroups() {
    const { workspaceId } = useParams();
    const { authFetch } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${config.API_BASE}/agent-groups/workspace/${workspaceId}`);
            if (!res.ok) throw new Error('Failed to fetch agent groups');
            const data = await res.json();
            setGroups(data || []);
        } catch (err) {
            console.error('Error fetching groups:', err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [workspaceId]);

    const handleOpenModal = (group = null) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        fetchGroups();
    };

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl">
            {/* Banner */}
            <div className="bg-cyan-50 border border-cyan-100 p-4 rounded-xl mb-6">
                <p className="text-sm text-cyan-800">
                    Agent groups let you divide agents to groups based on skills, experience, level etc. You can assign the conversation to agent group in the flow action.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div className="relative w-72">
                    <input 
                        type="text" 
                        placeholder="Search by name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                >
                    <Plus size={16} />
                    Group
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Id</th>
                            <th className="py-3 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                            <th className="py-3 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Assign Method</th>
                            <th className="py-3 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Assign by status</th>
                            <th className="py-3 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Group Chat</th>
                            <th className="py-3 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Members</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <LottieLoader size={120} message="Loading agent groups..." />
                                    </div>
                                </td>
                            </tr>
                        ) : filteredGroups.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-12 text-center text-sm text-slate-400 font-medium border-b border-slate-100">
                                    No Data
                                </td>
                            </tr>
                        ) : (
                            filteredGroups.map(group => (
                                <tr 
                                    key={group.id} 
                                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => handleOpenModal(group)}
                                >
                                    <td className="py-4 px-6 text-sm text-slate-500 font-mono text-xs">{group.id.split('-')[0]}...</td>
                                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">
                                        <div className="flex items-center gap-3">
                                            {group.image_url ? (
                                                <img src={group.image_url} alt={group.name} className="w-8 h-8 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <Users size={14} className="text-slate-400" />
                                                </div>
                                            )}
                                            {group.name}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600 capitalize">{group.assign_method.replace('_', ' ')}</td>
                                    <td className="py-4 px-6 text-sm text-slate-600 capitalize">{group.assign_by_status.replace('_', ' ')}</td>
                                    <td className="py-4 px-6 text-sm text-slate-600">
                                        {group.group_chat_enabled ? 'Yes' : 'No'}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600">
                                        {group.agent_group_members?.length || 0}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <AgentGroupModal 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal} 
                    group={editingGroup} 
                    workspaceId={workspaceId}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
}
