import React, { useState } from 'react';
import { 
  X, Settings, Zap, Database, Info, 
  Trash2, Copy, Eye, HelpCircle, Save,
  ChevronRight, AlertCircle, Plus
} from 'lucide-react';

export default function PropertyPanel({ isOpen, onClose, node, onUpdateNode }) {
  const [activeTab, setActiveTab] = useState('settings');

  if (!isOpen || !node) return null;

  return (
    <aside className="w-80 h-screen bg-white border-l border-slate-200 flex flex-col shadow-2xl z-[60] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
             {/* Dynamic Icon based on node type */}
             {node.type === 'message' && <Settings size={16} />}
             {node.type === 'action' && <Zap size={16} />}
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inspector</h3>
            <p className="text-[10px] font-bold text-slate-400 truncate w-32 capitalize">{node.type} Node</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-4 border-b border-slate-50">
        {[
          { id: 'settings', icon: Settings, label: 'Settings' },
          { id: 'logic', icon: Zap, label: 'Logic' },
          { id: 'variables', icon: Database, label: 'Results' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Name & ID Section */}
        <section>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Step Name</label>
          <input 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-200 transition-all"
            value={node.data.label || ''}
            onChange={(e) => onUpdateNode({ label: e.target.value })}
            placeholder="e.g. Welcome Message"
          />
        </section>

        {/* Dynamic Section Based on Node Type & Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
             {node.type === 'message' && <MessageNodeSettings data={node.data} onUpdate={onUpdateNode} />}
             {node.type === 'action' && <ActionNodeSettings data={node.data} onUpdate={onUpdateNode} />}
             {node.type === 'question' && <QuestionNodeSettings data={node.data} onUpdate={onUpdateNode} />}
          </div>
        )}

        {/* Validation Errors Notice */}
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex gap-3">
           <AlertCircle className="text-amber-500 flex-shrink-0" size={16} />
           <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
             This step has no exit connection. Remember to define a fallback path.
           </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <button className="flex items-center gap-2 p-2 px-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
          <Trash2 size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
        </button>
        <button className="flex items-center gap-2 p-2 px-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
          <Copy size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Duplicate</span>
        </button>
      </div>
    </aside>
  );
}

// Sub-components for specific settings (Simplified for now)
function MessageNodeSettings({ data, onUpdate }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content</label>
        <div className="flex gap-1">
           <button className="p-1 px-2 bg-slate-100 text-[8px] font-black rounded uppercase text-slate-400 hover:text-blue-500">Preview</button>
        </div>
      </div>
      <textarea 
        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-200 transition-all leading-relaxed"
        rows={6}
        placeholder="Type your message here..."
        value={data.text || ''}
        onChange={(e) => onUpdate({ text: e.target.value })}
      />
      <button className="w-full py-3 bg-white border border-dashed border-slate-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2">
        <Plus size={14} /> Add Button
      </button>
    </div>
  );
}

function ActionNodeSettings({ data, onUpdate }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold text-slate-500 text-center py-8">Action configuration panel coming soon.</p>
    </div>
  );
}

function QuestionNodeSettings({ data, onUpdate }) {
  return (
    <div className="space-y-4">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Question Type</label>
       <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-200 transition-all appearance-none">
          <option>Text Input</option>
          <option>Number</option>
          <option>Email</option>
          <option>Phone</option>
          <option>Choice Selection</option>
       </select>
    </div>
  );
}
