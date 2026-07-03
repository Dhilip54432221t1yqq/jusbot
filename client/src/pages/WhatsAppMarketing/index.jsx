import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import MarketingDashboard from './MarketingDashboard';
import MarketingCampaigns from './MarketingCampaigns';
import SendMarketingMessage from './SendMarketingMessage';
import MarketingSettings from './MarketingSettings';
import DeliveryLogs from './DeliveryLogs';
import CreativeOptimizations from './CreativeOptimizations';

export default function WhatsAppMarketing() {
    const location = useLocation();

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50">
            {/* Secondary Navigation */}
            <div className="bg-white border-b border-slate-200 px-8 py-3 flex gap-6 shrink-0 overflow-x-auto">
                <NavLink to="" currentPath={location.pathname}>Marketing Messages</NavLink>
                <NavLink to="campaigns" currentPath={location.pathname}>Campaigns</NavLink>
                <NavLink to="send" currentPath={location.pathname}>Send Message</NavLink>
                <NavLink to="settings" currentPath={location.pathname}>API Settings</NavLink>
                <NavLink to="logs" currentPath={location.pathname}>Delivery Logs</NavLink>
                <NavLink to="creative" currentPath={location.pathname}>Creative Optimizations</NavLink>
            </div>

            <div className="flex-1 overflow-hidden">
                <Routes>
                    <Route path="" element={<MarketingDashboard />} />
                    <Route path="campaigns" element={<MarketingCampaigns />} />
                    <Route path="send" element={<SendMarketingMessage />} />
                    <Route path="settings" element={<MarketingSettings />} />
                    <Route path="logs" element={<DeliveryLogs />} />
                    <Route path="creative" element={<CreativeOptimizations />} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
            </div>
        </div>
    );
}

function NavLink({ to, currentPath, children }) {
    const basePath = currentPath.split('/whatsapp/marketing')[0] + '/whatsapp/marketing';
    const targetPath = to ? `${basePath}/${to}` : basePath;
    const isActive = currentPath === targetPath || (to === '' && currentPath === basePath);

    return (
        <Link 
            to={to} 
            className={`text-sm font-medium pb-3 -mb-[13px] border-b-2 whitespace-nowrap transition-colors ${
                isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
            {children}
        </Link>
    );
}
