import React from 'react';
import { Handle, Position } from 'reactflow';
import { LogOut, MoreVertical, ListTree } from 'lucide-react';

export default function FunctionOutputNode({ data, selected }) {
  const outputs = data.outputs || [
    { name: 'Success', type: 'boolean' },
    { name: 'Result', type: 'json' }
  ];

  return (
    <div className={`
      w-[260px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-purple-600 ring-4 ring-purple-600/10' : 'border-slate-100 hover:border-slate-200'}
    `}>
      <div className="absolute -top-3 left-4">
        <div className="px-2 py-0.5 bg-purple-600 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
          Return Output
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-purple-600 !border-2 !border-white" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-purple-600 !border-2 !border-white" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-purple-50/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <LogOut size={14} />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Return Values</span>
        </div>
        <button className="text-slate-300"><MoreVertical size={14} /></button>
      </div>

      <div className="p-3 space-y-2 pb-5">
         <div className="flex items-center gap-2 px-1 mb-1">
            <ListTree size={12} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Output Schema</span>
         </div>
        {outputs.map((out, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
             <span className="text-[10px] font-bold text-slate-700">{out.name}</span>
             <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-purple-100">
               {out.type}
             </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-purple-600 text-center">
         <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">End of Function</span>
      </div>
    </div>
  );
}
