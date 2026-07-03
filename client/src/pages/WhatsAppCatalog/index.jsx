import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import CatalogOverview from './CatalogOverview';
import ProductSync from './ProductSync';
import CatalogSettings from './CatalogSettings';
import ProductMessages from './ProductMessages';
import CatalogOrders from './CatalogOrders';

export default function WhatsAppCatalog() {
    const location = useLocation();

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-8 py-3 flex gap-6 shrink-0 overflow-x-auto">
                <NavLink to="" currentPath={location.pathname}>Catalog Overview</NavLink>
                <NavLink to="products" currentPath={location.pathname}>Product Sync</NavLink>
                <NavLink to="settings" currentPath={location.pathname}>Commerce Settings</NavLink>
                <NavLink to="messages" currentPath={location.pathname}>Product Messages</NavLink>
                <NavLink to="orders" currentPath={location.pathname}>Catalog Orders</NavLink>
            </div>

            <div className="flex-1 overflow-hidden">
                <Routes>
                    <Route path="" element={<CatalogOverview />} />
                    <Route path="products" element={<ProductSync />} />
                    <Route path="settings" element={<CatalogSettings />} />
                    <Route path="messages" element={<ProductMessages />} />
                    <Route path="orders" element={<CatalogOrders />} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
            </div>
        </div>
    );
}

function NavLink({ to, currentPath, children }) {
    const basePath = currentPath.split('/whatsapp/catalog')[0] + '/whatsapp/catalog';
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
