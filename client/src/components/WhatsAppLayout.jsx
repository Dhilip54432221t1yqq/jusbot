import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  FolderOpen, Megaphone, MessageCircle, ShoppingBag, 
  Users, Settings, ArrowLeft, Zap, Folder, ChevronDown, GitBranch,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function WhatsAppLayout() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // WhatsApp inner sidebar tabs
  const tabs = [
    { id: 'flows', name: 'Flows', icon: GitBranch, path: `/${workspaceId}/whatsapp/flows` },
    { id: 'templates', name: 'Prefilled Template', icon: FolderOpen, path: `/${workspaceId}/whatsapp/templates` },
    { id: 'ad', name: 'Click to Whatsapp ad', icon: Megaphone, path: `/${workspaceId}/whatsapp/ad` },
    { id: 'widget', name: 'WhatsApp Widget', icon: MessageCircle, path: `/${workspaceId}/whatsapp/widget` },
    { id: 'store', name: 'Store', icon: ShoppingBag, path: `/${workspaceId}/whatsapp/store` },
    { id: 'crm', name: 'WA CRM', icon: Users, path: `/${workspaceId}/whatsapp/crm` },
    { id: 'contacts', name: 'Bot Users', icon: Users, path: `/${workspaceId}/whatsapp/contacts` },
    { id: 'automation', name: 'Automation', icon: Zap, path: `/${workspaceId}/whatsapp/automation/triggers` },
    { id: 'content', name: 'Content', icon: Folder, path: `/${workspaceId}/whatsapp/content` },
    { id: 'setup', name: 'Setup', icon: Settings, path: `/${workspaceId}/whatsapp-cloud` },
  ];


  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {/* WhatsApp Internal Sidebar */}
      <div className={`bg-white border-r border-slate-200 flex flex-col z-10 transition-all duration-300 ${isCollapsed ? 'w-[88px]' : 'w-64'}`}>
        <div className={`p-6 border-b border-slate-100 flex ${isCollapsed ? 'justify-center p-4' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/WhatsApp%20Icon.png" alt="WhatsApp" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-slate-800 text-sm truncate">WhatsApp Cloud</h2>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : 'p-4 custom-scrollbar'}`}>
          {tabs.map((tab) => {
            const isActive = (tab.id === 'automation' && location.pathname.includes('/automation')) || location.pathname === tab.path;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                title={isCollapsed ? tab.name : ''}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-green-50 text-green-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={18} className={`shrink-0 ${isActive ? 'text-green-600' : ''}`} />
                {!isCollapsed && <span className="truncate">{tab.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className={`px-6 py-3 flex ${isCollapsed ? 'justify-center px-0' : 'justify-end'} border-t border-slate-100 mt-2 mb-4`}>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-full border-[2.5px] border-slate-800 text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight size={18} strokeWidth={3} /> : <ChevronLeft size={18} strokeWidth={3} />}
            </button>
        </div>
      </div>

      {/* Main Content Area (Outlet renders the active route component) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <Outlet />
      </div>
    </div>
  );
}
