import React from 'react';
import { MessageCircle, LayoutDashboard, Cloud, BarChart3, Plug, ShoppingCart, Settings, GitBranch, Folder, Instagram, Users, Zap, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';

/**
 * @param {Object} props
 * @param {string} props.activeNav
 */
export default function Sidebar({ activeNav }) {
    const navigate = useNavigate();
    const { workspaceId } = useParams();

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: `/${workspaceId}/dashboard` },
        { name: 'Flows', icon: GitBranch, path: `/${workspaceId}/flows` },
        { 
            name: 'Automation', 
            icon: Zap, 
            path: null, 
            key: 'automation',
            isDropdown: true,
            subItems: [
                { name: 'Trigger', path: `/${workspaceId}/automation/triggers` },
                { name: 'Keyword', path: `/${workspaceId}/automation/keywords` },
                { name: 'Comment Keywords', path: null },
                { name: 'Sequences', path: `/${workspaceId}/automation/sequences` },
                { name: 'Facebook Lead Ads', path: null },
            ]
        },
        { name: 'Content', icon: Folder, path: `/${workspaceId}/content` },
        { name: 'Bot Users', icon: Users, path: `/${workspaceId}/contacts` },
        { name: 'Live Chat', icon: MessageCircle, path: `/${workspaceId}/livechat` },
        { name: 'WhatsApp Cloud', icon: Cloud, path: null, key: 'whatsapp' },
        { name: 'Instagram', icon: Instagram, path: null, key: 'instagram' },
        { name: 'Analytics', icon: BarChart3, path: `/${workspaceId}/analytics` },
        { name: 'Integration', icon: Plug, path: `/${workspaceId}/integrations` },
        { name: 'Ecommerce', icon: ShoppingCart, path: `/${workspaceId}/ecommerce` },
        { 
            name: 'Workspace Settings', 
            icon: Settings, 
            path: null,
            key: 'settings',
            isDropdown: true,
            subItems: [
                { name: 'Profile', path: `/${workspaceId}/settings/profile` },
                { name: 'Members', path: `/${workspaceId}/settings/members` },
                { name: 'Agent Groups', path: `/${workspaceId}/settings/agents` },
                { name: 'Business Hours', path: `/${workspaceId}/settings/hours` },
                { name: 'Store Locations', path: `/${workspaceId}/settings/stores` },
                { name: 'Settings', path: `/${workspaceId}/settings/general` },
                { name: 'Channels', path: `/${workspaceId}/settings/channels` },
                { name: 'Audit Logs', path: `/${workspaceId}/settings/logs` },
            ]
        }
    ];

    /** @type {any} */
    const [openMenus, setOpenMenus] = React.useState({ automation: false, settings: false });

    const handleNavClick = async (/** @type {any} */ item) => {
        if (item.isDropdown) {
            setOpenMenus((/** @type {any} */ prev) => ({ ...prev, [item.key]: !prev[item.key] }));
            return;
        }
        if (item.key === 'whatsapp') {
            // Check if already connected — route to connected dashboard or setup
            try {
                const res = await fetch(`http://localhost:3000/api/whatsapp-cloud/status/${workspaceId}`);
                const data = await res.json();
                if (data.connected) {
                    navigate(`/${workspaceId}/whatsapp-connected`);
                } else {
                    navigate(`/${workspaceId}/whatsapp-cloud`);
                }
            } catch (e) {
                navigate(`/${workspaceId}/whatsapp-cloud`);
            }
            return;
        }
        if (item.key === 'instagram') {
            try {
                const res = await fetch(`http://localhost:3000/api/instagram/overview/check/${workspaceId}`);
                const data = await res.json();
                if (data.connected) {
                    navigate(`/${workspaceId}/instagram-dashboard`);
                } else {
                    navigate(`/${workspaceId}/instagram`);
                }
            } catch (e) {
                navigate(`/${workspaceId}/instagram`);
            }
            return;
        }
        if (item.path) navigate(item.path);
    };

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col pb-4 flex-shrink-0">
            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {(/** @type {any[]} */ (navItems)).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.name || (/** @type {any[]} */ (item.subItems || [])).some(si => activeNav === si.name);
                    const isOpen = (/** @type {any} */ (openMenus))[item.key];

                    return (
                        <div key={item.name}>
                            <button
                                onClick={() => handleNavClick(item)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive && !item.isDropdown
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                style={{ letterSpacing: '-0.01em' }}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-500' : ''} ${isActive && !item.isDropdown ? '!text-white' : ''}`} />
                                    <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
                                </div>
                                {item.isDropdown && (
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-green-500' : 'text-slate-400'}`} />
                                )}
                            </button>

                            {item.isDropdown && isOpen && (
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

            {/* Footer */}
            <div className="px-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-lg shadow-slate-200">
                    <p className="text-xs font-semibold mb-1" style={{ letterSpacing: '0.02em' }}>Need Help?</p>
                    <p className="text-xs text-slate-300 mb-3 opacity-90">Check our documentation</p>
                    <button className="w-full bg-white text-slate-800 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors" style={{ letterSpacing: '0.01em' }}>
                        View Docs
                    </button>
                </div>
            </div>
        </div>
    );
}
