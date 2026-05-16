import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Users, UserPlus, Trash2, Shield, 
    Mail, Loader2, Search, MoreVertical,
    UserCircle, ShieldCheck, Edit2, X, Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import config from '../../config';
import LottieLoader from '../../components/LottieLoader';
import { toast } from 'react-hot-toast';

export default function Members() {
    const { workspaceId } = useParams();
    const { authFetch, user } = useAuth();
    const { activeWorkspace } = useWorkspace();
    const [members, setMembers] = useState(/** @type {any[]} */ ([]));
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [editingMember, setEditingMember] = useState(null); // { user_id, role, name }
    const [confirmDelete, setConfirmDelete] = useState(null); // { user_id, name }
    const [error, setError] = useState(null);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${config.API_BASE}/workspaces/${workspaceId}/members`);
            if (!res.ok) throw new Error('Failed to fetch members');
            const data = await res.ok ? await res.json() : [];
            setMembers(data);
        } catch (/** @type {any} */ err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [workspaceId]);

    const handleInvite = async (/** @type {any} */ e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        
        setInviting(true);
        setError(null);
        try {
            const res = await authFetch(`${config.API_BASE}/workspaces/${workspaceId}/members`, {
                method: 'POST',
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to add member');
            
            toast.success('Member added successfully');
            setInviteEmail('');
            fetchMembers();
        } catch (/** @type {any} */ err) {
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (/** @type {any} */ memberId) => {
        try {
            const res = await authFetch(`${config.API_BASE}/workspaces/${workspaceId}/members/${memberId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove member');
            toast.success('Member removed successfully');
            setConfirmDelete(null);
            fetchMembers();
        } catch (/** @type {any} */ err) {
            toast.error(err.message);
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            const res = await authFetch(`${config.API_BASE}/workspaces/${workspaceId}/members/${memberId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error('Failed to update role');
            toast.success('Role updated successfully');
            setEditingMember(null);
            fetchMembers();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
    const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
                        <Users className="w-7 h-7 text-green-500" />
                        Workspace Members
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage who has access to this workspace and their roles.</p>
                </div>
            </div>

            {/* Invite Section */}
            {canManageMembers && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserPlus size={16} className="text-green-500" />
                        Add New Member
                    </h2>
                    <form onSubmit={handleInvite} className="flex gap-3">
                        <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="email" 
                                placeholder="member@company.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                                required
                            />
                        </div>
                        <div className="relative w-40">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select 
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value)}
                                className="w-full pl-11 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <MoreVertical size={14} className="text-slate-400" />
                            </div>
                        </div>
                        <button 
                            type="submit"
                            disabled={inviting || !inviteEmail}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Member'}
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-xs mt-3 font-medium flex items-center gap-1">⚠ {error}</p>}
                </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search members..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-green-500 transition-all"
                        />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{members.length} Members Total</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center gap-4 text-slate-400">
                            <LottieLoader size={180} message="Loading members..." />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="p-20 flex flex-col items-center gap-4 text-slate-400 text-center">
                            <UserCircle className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-medium">No members found.</p>
                        </div>
                    ) : (
                        members.map(member => (
                            <div key={member.id} className="p-4 flex items-center hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
                                {/* Member Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {member.avatar_url ? (
                                        <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100 shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 font-bold text-sm uppercase shrink-0">
                                            {member.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">
                                            {member.name === 'Owner' || member.name === 'Admin' || member.name === 'Member' ? member.email?.split('@')[0] : member.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                    </div>
                                </div>

                                {/* Joined Date */}
                                <div className="w-40 shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Joined Date</p>
                                    <p className="text-xs text-slate-600 font-medium">
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Role Display */}
                                <div className="w-32 shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Role</p>
                                    <p className="text-xs text-slate-600 font-bold capitalize">
                                        {member.role}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="w-24 shrink-0 flex justify-end items-center gap-1">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        {canManageMembers && member.role !== 'owner' && (
                                            <>
                                                <button 
                                                    onClick={() => setEditingMember(member)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Role"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmDelete(member)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Custom Edit Role Modal */}
            {editingMember && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[17px] font-bold text-slate-800">Edit Member Role</h3>
                            <button onClick={() => setEditingMember(null)} className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                                <X size={16} />
                            </button>
                        </header>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                {editingMember.avatar_url ? (
                                    <img src={editingMember.avatar_url} alt={editingMember.name} className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm" />
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 font-bold text-lg uppercase shrink-0">
                                        {editingMember.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-slate-800">
                                        {editingMember.name === 'Owner' || editingMember.name === 'Admin' || editingMember.name === 'Member' ? editingMember.email?.split('@')[0] : editingMember.name}
                                    </p>
                                    <p className="text-xs text-slate-400">{editingMember.email}</p>
                                </div>
                            </div>
                            
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Choose Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['member', 'admin'].map(role => (
                                    <button 
                                        key={role}
                                        onClick={() => setEditingMember({ ...editingMember, role })}
                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all ${editingMember.role === role ? 'border-green-600 bg-green-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <p className={`text-[13px] font-bold capitalize ${editingMember.role === role ? 'text-green-700' : 'text-slate-700'}`}>{role}</p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            {role === 'admin' ? 'Full control over workspace' : 'Limited access to settings'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <footer className="p-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setEditingMember(null)} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-all">
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleUpdateRole(editingMember.id, editingMember.role)}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
                            >
                                Update Role
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Custom Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[17px] font-bold text-slate-800">Remove Member</h3>
                            <button onClick={() => setConfirmDelete(null)} className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                                <X size={16} />
                            </button>
                        </header>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={28} className="text-red-500" />
                            </div>
                            <h4 className="text-[15px] font-bold text-slate-800 mb-2">Are you sure?</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Are you sure to remove <strong className="text-slate-800 font-bold">{confirmDelete.name}</strong> from <strong className="text-slate-800 font-bold">{activeWorkspace?.name || 'this workspace'}</strong>?
                            </p>
                        </div>
                        <footer className="p-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-all">
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleRemove(confirmDelete.id)}
                                className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                            >
                                Yes, Remove
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
