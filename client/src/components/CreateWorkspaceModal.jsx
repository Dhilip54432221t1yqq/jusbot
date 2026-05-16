import { useState } from 'react';
import { X, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

export default function CreateWorkspaceModal({ /** @type {boolean} */ isOpen, /** @type {() => void} */ onClose }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { fetchWorkspaces } = useWorkspace();
    const { authFetch } = useAuth();

    const handleSubmit = async (/** @type {any} */ e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const response = await authFetch(`${config.API_BASE}/workspaces`, {
                method: 'POST',
                body: JSON.stringify({ name })
            });

            if (!response.ok) throw new Error('Failed to create workspace');

            await (/** @type {any} */ (fetchWorkspaces))();
            onClose();
            setName('');
        } catch (error) {
            console.error('Error creating workspace:', error);
            alert('Failed to create workspace');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Create New Workspace</h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-inner">
                                    <MessageCircle size={32} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Workspace Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. My Awesome Studio"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none"
                                    required
                                />
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                    Starting a new workspace allows you to manage different brands or projects separately with their own flows and contacts.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 px-6 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="flex-[2] py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Workspace
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
