import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderPlus, Hash, ChevronRight, ChevronDown, 
  Search, Filter, Plus, MoreVertical, Layers, GitBranch,
  Workflow, Zap, Box
} from 'lucide-react';

export default function Sidebar({ isOpen, onToggle, workspaceId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(['root']);
  const [activeTab, setActiveTab] = useState('flows'); // flows | subflows | variables

  if (!isOpen) return (
    <div className="w-12 h-screen bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 shadow-sm animate-in slide-in-from-left duration-300">
      <button onClick={onToggle} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
        <ChevronRight size={20} />
      </button>
      <div className="w-px h-8 bg-slate-100" />
      <button className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Layers size={20} /></button>
      <button className="p-2 text-slate-400 hover:text-slate-600"><Workflow size={20} /></button>
      <button className="p-2 text-slate-400 hover:text-slate-600"><Zap size={20} /></button>
    </div>
  );

  return (
    <aside className="w-72 h-screen bg-white border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-300 z-[60]">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
             <Layers className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">Management</span>
        </div>
        <button onClick={onToggle} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
          <ChevronRight size={18} className="rotate-180" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-4 border-b border-slate-50">
        {['flows', 'subflows'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
              activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="p-4 space-y-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input 
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-200 transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
        {activeTab === 'flows' ? (
          <div className="space-y-1">
            <TreeItem 
              label="Marketing Automation" 
              type="folder" 
              expanded={expandedFolders.includes('marketing')}
              id="marketing"
              onClick={() => setExpandedFolders(prev => prev.includes('marketing') ? prev.filter(i => i !== 'marketing') : [...prev, 'marketing'])}
            >
              <TreeItem label="Welcome Flow" type="flow" />
              <TreeItem label="Abandoned Cart" type="flow" />
            </TreeItem>
            <TreeItem 
              label="Support Bot" 
              type="folder" 
              expanded={expandedFolders.includes('support')}
              id="support"
               onClick={() => setExpandedFolders(prev => prev.includes('support') ? prev.filter(i => i !== 'support') : [...prev, 'support'])}
            >
              <TreeItem label="FAQ Resolver" type="flow" />
            </TreeItem>
            <TreeItem label="Order Confirmation" type="flow" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="px-2 mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Reusable Logic</span>
            </div>
            <TreeItem label="Format Currency" type="subflow" detail="Function" icon={<Box size={14} />} />
            <TreeItem label="User Verification" type="subflow" detail="Standard" icon={<GitBranch size={14} />} />
            <TreeItem label="Sync to CRM" type="subflow" detail="Workflow" icon={<Zap size={14} />} />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
         <button className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-all">
            <Plus size={16} />
            <span className="text-xs font-bold">New {activeTab === 'flows' ? 'Flow' : 'Sub-flow'}</span>
         </button>
         <button className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-all">
            <FolderPlus size={16} />
            <span className="text-xs font-bold">New Folder</span>
         </button>
      </div>

      {/* Labels / Tags Section */}
      <div className="px-4 pb-6 mt-2">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 px-2">Labels</p>
        <div className="flex flex-wrap gap-2 px-1">
           <LabelBadge name="Production" color="bg-green-500" />
           <LabelBadge name="Testing" color="bg-amber-500" />
           <LabelBadge name="API" color="bg-blue-500" />
        </div>
      </div>
    </aside>
  );
}

function TreeItem({ label, type, expanded, children, onClick, detail, icon }) {
  return (
    <div>
      <div 
        onClick={onClick}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-all border border-transparent hover:border-blue-100"
      >
        {type === 'folder' ? (
          expanded ? <ChevronDown size={14} className="text-slate-400 group-hover:text-blue-400" /> : <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-400" />
        ) : (
          <div className="w-3" />
        )}
        
        {type === 'folder' && <Folder size={16} className="text-amber-400 flex-shrink-0" />}
        {type === 'flow' && <GitBranch size={16} className="text-indigo-400 flex-shrink-0" />}
        {type === 'subflow' && <div className="text-emerald-500 overflow-hidden">{icon}</div>}
        
        <span className="text-xs font-bold truncate flex-1 tracking-tight">{label}</span>
        
        {detail && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase text-center">{detail}</span>}
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/50 rounded-lg transition-all">
          <MoreVertical size={14} />
        </button>
      </div>
      {expanded && children && (
        <div className="ml-4 pl-3 border-l border-slate-100 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function LabelBadge({ name, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full cursor-pointer hover:border-blue-200 transition-all group">
      <div className={`w-2 h-2 rounded-full ${color} group-hover:scale-125 transition-transform`} />
      <span className="text-[10px] font-bold text-slate-500">{name}</span>
    </div>
  );
}
