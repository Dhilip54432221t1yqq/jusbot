import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, Bell, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserDropdown() {
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center p-1 hover:bg-slate-50 rounded-xl transition-all group"
            >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[100] origin-top-right"
                    >
                        <div className="p-4 border-b border-slate-50 mb-1">
                            <p className="text-sm font-bold text-slate-800">{user.email?.split('@')[0]}</p>
                            <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
                        </div>

                        <div className="space-y-1">
                            <button 
                                onClick={() => { navigate(`/${workspaceId}/settings/profile`); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold"
                            >
                                <User size={18} className="text-slate-400" />
                                My Profile
                            </button>
                            <button 
                                onClick={() => { navigate(`/${workspaceId}/settings/workspace`); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold"
                            >
                                <Settings size={18} className="text-slate-400" />
                                Workspace Settings
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold">
                                <Bell size={18} className="text-slate-400" />
                                Notifications
                            </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
