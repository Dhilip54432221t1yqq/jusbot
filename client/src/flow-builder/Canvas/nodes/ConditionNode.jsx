import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, MoreVertical, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function ConditionNode({ data, selected }) {
  const groups = data.groups || [];

  return (
    <div className={`
      w-[300px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-emerald-600 ring-4 ring-emerald-600/10' : 'border-slate-100 hover:border-slate-200'}
    `}>
      {/* Node Decorator */}
      <div className="absolute -top-3 left-4 flex gap-1">
        <div className="px-2 py-0.5 bg-emerald-600 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
          Condition
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-emerald-600 !border-2 !border-white" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-emerald-600 !border-2 !border-white" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-emerald-50/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <GitBranch size={14} />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Logic Split</span>
        </div>
        <button className="text-slate-300 hover:text-slate-600 transition-colors">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Evaluation Summary */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Match Mode:</span>
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
           {data.mode === 'any' ? 'Any Condition' : 'All Conditions'}
         </span>
      </div>

      {/* Conditions Groups */}
      <div className="p-3 space-y-2">
        {groups.map((group, idx) => (
          <div key={idx} className="relative group/item">
            <div className="w-full bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between transition-all hover:bg-white hover:border-emerald-200 cursor-pointer group-hover/item:shadow-sm">
               <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded bg-emerald-500 text-[8px] font-black text-white flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-[10px] font-bold text-slate-700 truncate capitalize">
                    {group.name || `Path ${idx + 1}`}
                  </p>
               </div>
               <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover/item:border-emerald-300 transition-all">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover/item:bg-emerald-500" />
               </div>
            </div>
            
            <Handle 
              type="source" 
              position={Position.Right} 
              id={`group-${idx}`}
              className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0"
            />
          </div>
        ))}

        {/* The "Otherwise" Branch (Always Present) */}
        <div className="relative group/item mt-4">
           <div className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between shadow-lg opacity-90 hover:opacity-100 transition-all cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                 <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                    <CheckCircle2 size={10} />
                 </div>
                 <p className="text-[10px] font-black text-white tracking-widest uppercase">Otherwise</p>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center shadow-sm">
                 <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
              </div>
           </div>
           
           <Handle 
             type="source" 
             position={Position.Right} 
             id="otherwise"
             className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0"
           />
        </div>
      </div>
    </div>
  );
}
