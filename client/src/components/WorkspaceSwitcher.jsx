import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Check, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function WorkspaceSwitcher() {
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    /** @type {any} */
    const { workspaces, activeWorkspace, fetchWorkspaces } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const dropdownRef = useRef(/** @type {any} */ (null));

    useEffect(() => {
        fetchWorkspaces();
        
        const handleClickOutside = (/** @type {any} */ event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = (/** @type {string} */ id) => {
        setIsOpen(false);
        navigate(`/${id}/dashboard`);
        window.location.reload(); // Instant reload to refresh context
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all group"
            >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md shadow-green-100 group-hover:scale-105 transition-transform">
                    {activeWorkspace?.logo_url ? (
                        <img src={activeWorkspace.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <MessageCircle size={18} className="text-white" />
                    )}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-[14px] font-bold text-slate-800 leading-none mb-1">
                        {activeWorkspace?.name || 'Loading...'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Active Workspace
                    </p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[100] origin-top-left"
                    >
                        <div className="p-3 mb-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Your Workspaces</h3>
                        </div>
                        
                        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {(/** @type {any[]} */ (workspaces)).map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => handleSwitch(ws.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${ws.id === workspaceId ? 'bg-green-50 text-green-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${ws.id === workspaceId ? 'bg-green-100' : 'bg-slate-100 text-slate-400'}`}>
                                            {ws.logo_url ? <img src={ws.logo_url} alt="" className="w-full h-full object-cover rounded-lg" /> : (ws.name?.charAt(0) || 'W')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{ws.name}</p>
                                            <p className="text-[10px] font-medium opacity-70 uppercase">{ws.role}</p>
                                        </div>
                                    </div>
                                    {ws.id === workspaceId && <Check size={16} className="text-green-600" />}
                                </button>
                            ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <button 
                                className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-bold text-sm"
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowCreateModal(true);
                                }}
                            >
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                    <Plus size={18} />
                                </div>
                                Create Workspace
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateWorkspaceModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
            />
        </div>
    );
}
