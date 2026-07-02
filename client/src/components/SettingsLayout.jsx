import React from 'react';
import { Outlet, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';

export default function SettingsLayout() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'profile', label: 'Workspace Profile', path: `/${workspaceId}/settings/profile` },
        { id: 'members', label: 'Members', path: `/${workspaceId}/settings/members` },
        { id: 'agents', label: 'Agent Groups', path: `/${workspaceId}/settings/agents` },
        { id: 'hours', label: 'Business Hours', path: `/${workspaceId}/settings/hours` },
    ];

    // If exact path matches, redirect to profile
    if (location.pathname === `/${workspaceId}/settings` || location.pathname === `/${workspaceId}/settings/`) {
        return <Navigate to={`/${workspaceId}/settings/profile`} replace />;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Header matching Ecommerce/Bot Users UI */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col justify-between sticky top-0 z-10 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Workspace Settings
                    </h2>
                    <div className="flex items-center gap-6 mt-4">
                        {tabs.map(tab => {
                            const isActive = location.pathname.includes(tab.path);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(tab.path)}
                                    className={`text-sm font-bold pb-2 transition-all border-b-2 ${isActive ? 'text-green-600 border-green-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Content Outlet */}
            <div className="flex-1 overflow-y-auto flex flex-col relative">
                <Outlet />
            </div>
        </div>
    );
}
