import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Users, UserPlus, Trash2, Shield, 
    Mail, Loader2, Search, MoreVertical,
    UserCircle, ShieldCheck
} from 'lucide-react';

export default function Members() {
    const { workspaceId } = useParams();
    const [members, setMembers] = useState(/** @type {any[]} */ ([]));
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [error, setError] = useState(null);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/workspaces/${workspaceId}/members`);
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
            const res = await fetch(`http://localhost:3000/api/workspaces/${workspaceId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: 'member' })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to add member');
            
            setInviteEmail('');
            fetchMembers();
        } catch (/** @type {any} */ err) {
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (/** @type {any} */ userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        
        try {
            const res = await fetch(`http://localhost:3000/api/workspaces/${workspaceId}/members/${userId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove member');
            fetchMembers();
        } catch (/** @type {any} */ err) {
            alert(err.message);
        }
    };

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
                            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                            <p className="text-sm font-medium">Loading members...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="p-20 flex flex-col items-center gap-4 text-slate-400 text-center">
                            <UserCircle className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-medium">No members found.</p>
                        </div>
                    ) : (
                        members.map(member => (
                            <div key={member.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-500 border border-white shadow-sm font-bold text-sm uppercase">
                                        {member.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-800">{member.name}</h3>
                                            {member.role === 'owner' && (
                                                <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    <ShieldCheck size={10} /> Master
                                                </span>
                                            )}
                                            {member.email.includes('Run SQL') && (
                                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Setup Incomplete
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Joined</p>
                                        <p className="text-xs text-slate-600 font-medium">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {member.role !== 'owner' && (
                                            <button 
                                                onClick={() => handleRemove(member.user_id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Remove Member"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-blue-100 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-blue-900 mb-1">Role Permissions</h3>
                    <p className="text-xs text-blue-700/80 leading-relaxed">
                        Owners have full access to workspace settings, billing, and member management. 
                        Members can manage flows, contacts, and integrations but cannot access sensitive workspace settings.
                    </p>
                </div>
            </div>
        </div>
    );
}
