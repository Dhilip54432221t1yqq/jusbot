import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Play, Settings2, Trash2, Edit3, MoreVertical, Globe, Database, UserPlus } from 'lucide-react';

export default function ActionNode({ data, selected }) {
  const actions = data.actions || [];
  
  return (
    <div className={`
      w-[280px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-slate-100 hover:border-slate-200'}
    `}>
      {/* Node Decorator */}
      <div className="absolute -top-3 left-4 flex gap-1">
        <div className="px-2 py-0.5 bg-amber-500 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
          Action
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-amber-500 !border-2 !border-white" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-amber-500 !border-2 !border-white" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap size={14} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Automation</span>
        </div>
        <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={14} /></button>
      </div>

      {/* Actions List Container */}
      <div className="p-3 space-y-2">
        {actions.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl group hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
            <Settings2 className="w-6 h-6 text-slate-200 mb-2 group-hover:text-amber-400 transition-colors" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center px-4 leading-tight">Configure Actions</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {actions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50/50 border border-slate-100 rounded-xl transition-all hover:bg-white hover:border-amber-100 group/item">
                <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-500 border border-slate-100 group-hover/item:scale-110 transition-transform">
                  <ActionIcon type={action.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-700 truncate capitalize">{action.type.replace('_', ' ')}</p>
                  <p className="text-[8px] font-bold text-slate-400 truncate uppercase tracking-tighter">{action.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Mode indicator and Source Handle */}
      <div className="px-3 pb-3">
         <div className="w-full h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4 group hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-all relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-amber-400/20" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-600">Next Step</span>
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover:border-amber-300 transition-all">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-amber-500" />
            </div>
            <Handle type="source" position={Position.Right} id="continue" className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0" />
         </div>
      </div>
    </div>
  );
}

function ActionIcon({ type }) {
  if (type === 'external_request') return <Globe size={12} />;
  if (type === 'variable_operation') return <Database size={12} />;
  if (type === 'tag_operation') return <UserPlus size={12} />;
  return <Zap size={12} />;
}
