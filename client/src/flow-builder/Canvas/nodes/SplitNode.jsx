import React from 'react';
import { Handle, Position } from 'reactflow';
import { Shuffle, MoreVertical, Percentage } from 'lucide-react';

export default function SplitNode({ data, selected }) {
  const branches = data.branches || [
    { id: 'b1', label: 'Split A', weight: 50 },
    { id: 'b2', label: 'Split B', weight: 50 }
  ];

  return (
    <div className={`
      w-[260px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-pink-600 ring-4 ring-pink-600/10' : 'border-slate-100 hover:border-slate-200'}
    `}>
      <div className="absolute -top-3 left-4">
        <div className="px-2 py-0.5 bg-pink-600 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
          Traffic Split
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-pink-600 !border-2 !border-white" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-pink-50/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
            <Shuffle size={14} />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Experiment</span>
        </div>
        <button className="text-slate-300"><MoreVertical size={14} /></button>
      </div>

      <div className="p-3 space-y-2">
        {branches.map((branch, idx) => (
          <div key={branch.id} className="relative group/item">
            <div className="w-full bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between transition-all hover:bg-white hover:border-pink-200 cursor-pointer">
               <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-black text-slate-700 truncate">{branch.label}</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-pink-50 rounded border border-pink-100">
                     <Percentage size={8} className="text-pink-600" />
                     <span className="text-[9px] font-black text-pink-600">{branch.weight}%</span>
                  </div>
               </div>
               <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover/item:border-pink-300 transition-all">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover/item:bg-pink-500" />
               </div>
            </div>
            <Handle type="source" position={Position.Right} id={branch.id} className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
