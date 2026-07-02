import React from 'react';
import { MessageCircle, LayoutDashboard, Cloud, BarChart3, Plug, ShoppingCart, Settings, GitBranch, Folder, Instagram, Users, Zap, ChevronDown, CreditCard, ArrowLeft, Megaphone, FolderOpen, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

/**
 * @param {Object} props
 * @param {string} props.activeNav
 */
export default function Sidebar({ activeNav }) {
    const navigate = useNavigate();
    const { authFetch } = useAuth();
    const { workspaceId } = useParams();

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: `/${workspaceId}/dashboard` },
        { name: 'Live Chat', icon: MessageCircle, path: `/${workspaceId}/livechat` },
        { name: 'WhatsApp Cloud', icon: Cloud, path: null, key: 'whatsapp' },
        { name: 'Instagram', icon: Instagram, path: null, key: 'instagram' },
        { name: 'Analytics', icon: BarChart3, path: `/${workspaceId}/analytics` },
        { name: 'Integration', icon: Plug, path: `/${workspaceId}/integrations` },
        { name: 'Ecommerce', icon: ShoppingCart, path: `/${workspaceId}/ecommerce` },
        { name: 'Workspace Settings', icon: Settings, path: `/${workspaceId}/settings/profile`, key: 'settings' },
        { name: 'Billing', icon: CreditCard, path: `/${workspaceId}/billing` }
    ];

    /** @type {any} */
    const [openMenus, setOpenMenus] = React.useState({});
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = React.useState(() => location.pathname.includes('/instagram-dashboard'));

    React.useEffect(() => {
        if (location.pathname.includes('/instagram-dashboard') || location.pathname.includes('/whatsapp')) {
            setIsCollapsed(true);
        } else {
            setIsCollapsed(false);
        }
    }, [location.pathname]);

    const itemsToRender = navItems;

    const handleNavClick = async (/** @type {any} */ item) => {
        if (item.action) {
            item.action();
            return;
        }
        if (item.isDropdown) {
            setOpenMenus((/** @type {any} */ prev) => ({ ...prev, [item.key]: !prev[item.key] }));
            return;
        }
        if (item.key === 'whatsapp') {
            navigate(`/${workspaceId}/whatsapp-cloud`);
            return;
        }
        if (item.key === 'instagram') {
            const isIgConnected = localStorage.getItem(`reflx_instagram_connected_${workspaceId}`) === 'true';
            if (isIgConnected) {
                navigate(`/${workspaceId}/instagram-dashboard`);
            } else {
                navigate(`/${workspaceId}/instagram`);
            }
            return;
        }
        if (item.path) navigate(item.path);
    };

    return (
        <div className={`bg-white border-r border-slate-200 flex flex-col pb-4 flex-shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-[88px]' : 'w-64'}`}>
            {/* Navigation */}
            <nav className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : 'px-4 custom-scrollbar'}`}>
                {(/** @type {any[]} */ (itemsToRender)).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || activeNav === item.name || (/** @type {any[]} */ (item.subItems || [])).some(si => activeNav === si.name);
                    const isOpen = item.key ? (/** @type {any} */ (openMenus))[item.key] : false;

                    return (
                        <div key={item.name}>
                            <button
                                onClick={() => {
                                    if (isCollapsed && item.isDropdown) {
                                        setIsCollapsed(false);
                                        setOpenMenus(prev => ({ ...prev, [item.key]: true }));
                                    } else {
                                        handleNavClick(item);
                                    }
                                }}
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all ${isActive && !item.isDropdown
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                style={{ letterSpacing: '-0.01em' }}
                                title={isCollapsed ? item.name : ''}
                            >
                                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-green-500' : ''} ${isActive && !item.isDropdown ? '!text-white' : ''}`} />
                                    {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">{item.name}</span>}
                                </div>
                                {!isCollapsed && item.isDropdown && (
                                    <ChevronDown size={14} className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-green-500' : 'text-slate-400'}`} />
                                )}
                            </button>

                            {!isCollapsed && item.isDropdown && isOpen && (
                                <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 flex flex-col gap-1">
                                    {(/** @type {any[]} */ (item.subItems)).map(sub => (
                                        <button
                                            key={sub.name}
                                            onClick={() => sub.path && navigate(sub.path)}
                                            className={`text-left px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${activeNav === sub.name
                                                ? 'text-green-600 bg-green-50'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                                } ${!sub.path ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Collapse Toggle Bottom */}
            <div className={`px-6 py-3 flex ${isCollapsed ? 'justify-center px-0' : 'justify-end'} border-t border-slate-100 mt-2 mb-4`}>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-full border-[2.5px] border-slate-800 text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={18} strokeWidth={3} /> : <ChevronLeft size={18} strokeWidth={3} />}
                </button>
            </div>

            {/* Footer */}
            <div className="px-4 mt-auto">
                {!isCollapsed ? (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-lg shadow-slate-200">
                        <p className="text-xs font-semibold mb-1" style={{ letterSpacing: '0.02em' }}>Need Help?</p>
                        <p className="text-xs text-slate-300 mb-3 opacity-90">Check our documentation</p>
                        <button className="w-full bg-white text-slate-800 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ letterSpacing: '0.01em' }}>
                            View Docs
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-900 rounded-xl p-3 text-white flex justify-center items-center shadow-md cursor-pointer hover:bg-slate-800 transition-colors" title="Need Help?">
                        <Megaphone size={18} />
                    </div>
                )}
            </div>
        </div>
    );
}
