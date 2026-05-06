import React from 'react';
import { Handle, Position } from 'reactflow';
import { ExternalLink, MoreVertical, Link2 } from 'lucide-react';

export default function GoToNode({ data, selected }) {
  const targetStep = data.targetStep || 'None';

  return (
    <div className={`
      w-[220px] bg-slate-900 rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}
    `}>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-slate-900" />

      <div className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <ExternalLink size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Jump to</span>
            <p className="text-[11px] font-black text-white truncate px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
              {targetStep}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-40">
           <Link2 size={12} className="text-white" />
           <div className="h-4 w-px bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
