import React, { useState } from 'react';
import { 
  X, Settings, Zap, Database, Info, 
  Trash2, Copy, Eye, HelpCircle, Save,
  ChevronRight, AlertCircle, Plus, Edit2, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import { useParams } from 'react-router-dom';

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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const actionsList = data.actions || [];
  
  const handleAddAction = (type) => {
    const newAction = { type, id: Math.random().toString(36).substring(7) };
    if (type === 'assign_agent_group') {
      newAction.label = 'Assign to Agent Group';
      newAction.groupId = '';
    } else if (type === 'set_variable') {
      newAction.label = 'Set Variable';
      newAction.variable = '';
      newAction.value = '';
    } else if (type === 'business_hours_reply') {
      newAction.label = 'Business Hours Reply';
      newAction.awayMessage = '';
    }
    onUpdate({ actions: [...actionsList, newAction] });
    setShowAddMenu(false);
  };

  const handleUpdateAction = (id, updates) => {
    const newActions = actionsList.map(a => a.id === id ? { ...a, ...updates } : a);
    onUpdate({ actions: newActions });
  };

  const handleRemoveAction = (id) => {
    onUpdate({ actions: actionsList.filter(a => a.id !== id) });
  };

  return (
    <div className="space-y-4 relative">
      {actionsList.map((action, idx) => (
        <div key={action.id || idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl relative group">
           <button onClick={() => handleRemoveAction(action.id)} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-slate-100">
             <Trash2 size={14} />
           </button>
           <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-3">{action.label}</h4>
           
           {action.type === 'assign_agent_group' && (
             <AgentGroupSelect action={action} onUpdate={(updates) => handleUpdateAction(action.id, updates)} />
           )}
           {action.type === 'set_variable' && (
             <div className="space-y-3">
               <div>
                 <label className="text-[10px] font-bold text-slate-400 block mb-1">Variable Name</label>
                 <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs" value={action.variable || ''} onChange={e => handleUpdateAction(action.id, { variable: e.target.value })} />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-400 block mb-1">Value</label>
                 <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs" value={action.value || ''} onChange={e => handleUpdateAction(action.id, { value: e.target.value })} />
               </div>
             </div>
           )}
           {action.type === 'business_hours_reply' && (
             <div className="space-y-3">
               <div>
                 <label className="text-[10px] font-bold text-slate-400 block mb-1">Away Message (When Closed)</label>
                 <textarea 
                   className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs leading-relaxed" 
                   rows={3}
                   value={action.awayMessage || ''} 
                   onChange={e => handleUpdateAction(action.id, { awayMessage: e.target.value })} 
                   placeholder="e.g. We are currently closed. Our business hours are..."
                 />
               </div>
             </div>
           )}
        </div>
      ))}

      <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full py-3 bg-white border border-dashed border-slate-200 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 hover:border-orange-300 transition-all flex items-center justify-center gap-2">
        <Plus size={14} /> Add Action
      </button>

      {showAddMenu && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
           <div className="p-2 flex flex-col">
              <button onClick={() => handleAddAction('set_variable')} className="flex items-center gap-3 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                 <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><Zap size={14} /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-700">Set Variable</p>
                   <p className="text-[10px] text-slate-400">Save data to a custom field</p>
                 </div>
              </button>
              <button onClick={() => handleAddAction('assign_agent_group')} className="flex items-center gap-3 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                 <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={14} /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-700">Assign to Agent Group</p>
                   <p className="text-[10px] text-slate-400">Route chat to specific team</p>
                 </div>
              </button>
              <button onClick={() => handleAddAction('business_hours_reply')} className="flex items-center gap-3 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
                 <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><Clock size={14} /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-700">Business Hours Reply</p>
                   <p className="text-[10px] text-slate-400">Reply with away message when closed</p>
                 </div>
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

function AgentGroupSelect({ action, onUpdate }) {
  const { authFetch } = useAuth();
  const { workspaceId } = useParams();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchGroups = async () => {
      try {
        const res = await authFetch(`${config.API_BASE}/agent-groups/workspace/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setGroups(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [workspaceId]);

  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 block mb-1">Select Group</label>
      <select 
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700" 
        value={action.groupId || ''} 
        onChange={(e) => onUpdate({ groupId: e.target.value })}
      >
        <option value="" disabled>-- Choose Agent Group --</option>
        {loading ? (
          <option disabled>Loading...</option>
        ) : (
          groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
        )}
      </select>
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
