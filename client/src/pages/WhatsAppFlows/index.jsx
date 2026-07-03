import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import FlowList from './FlowList';
import FlowBuilder from './FlowBuilder';
import LearnFlows from './LearnFlows';
import ResponsesList from './ResponsesList';

export default function WhatsAppFlows() {
    const location = useLocation();

    // Determine if we are inside a sub-route that needs full screen (like the builder)
    const isBuilder = location.pathname.includes('/create') || location.pathname.includes('/edit/');

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50">
            {/* Secondary Navigation - only show if not in builder */}
            {!isBuilder && (
                <div className="bg-white border-b border-slate-200 px-8 py-3 flex gap-6 shrink-0">
                    <NavLink to="" currentPath={location.pathname}>All Flows</NavLink>
                    <NavLink to="create" currentPath={location.pathname}>Create Flow</NavLink>
                    <NavLink to="learn" currentPath={location.pathname}>Learn About Flows</NavLink>
                    <NavLink to="responses" currentPath={location.pathname}>Responses</NavLink>
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                <Routes>
                    <Route path="" element={<FlowList />} />
                    <Route path="create" element={<FlowBuilder />} />
                    <Route path="edit/:flowId" element={<FlowBuilder />} />
                    <Route path="learn" element={<LearnFlows />} />
                    <Route path="responses" element={<ResponsesList />} />
                </Routes>
            </div>
        </div>
    );
}

function NavLink({ to, currentPath, children }) {
    // Basic active matching logic
    const basePath = currentPath.split('/whatsapp/flows')[0] + '/whatsapp/flows';
    const targetPath = to ? `${basePath}/${to}` : basePath;
    const isActive = currentPath === targetPath || (to === '' && currentPath === basePath);

    return (
        <Link 
            to={to} 
            className={`text-sm font-medium pb-3 -mb-[13px] border-b-2 transition-colors ${
                isActive ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
            {children}
        </Link>
    );
}
