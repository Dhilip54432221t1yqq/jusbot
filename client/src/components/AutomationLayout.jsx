import React from 'react';
import { Outlet, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function AutomationLayout() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'triggers', label: 'Triggers', path: `/${workspaceId}/whatsapp/automation/triggers` },
        { id: 'keywords', label: 'Keywords', path: `/${workspaceId}/whatsapp/automation/keywords` },
        { id: 'sequences', label: 'Sequences', path: `/${workspaceId}/whatsapp/automation/sequences` },
    ];

    // If exact path matches, redirect to triggers
    if (location.pathname === `/${workspaceId}/whatsapp/automation` || location.pathname === `/${workspaceId}/whatsapp/automation/`) {
        return <Navigate to={`/${workspaceId}/whatsapp/automation/triggers`} replace />;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Header matching Bot Users UI */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col justify-between sticky top-0 z-10 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                        Automation
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
            <div className="flex-1 overflow-hidden flex flex-col relative">
                <Outlet />
            </div>
        </div>
    );
}
