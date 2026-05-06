import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play, Zap } from 'lucide-react';

export default function StartNode({ data, selected }) {
  return (
    <div className={`w-80 bg-primary rounded-3xl p-6 flex flex-col gap-6 group border transition-all ${selected ? 'border-white ring-2 ring-white/50' : 'border-primary-dim shadow-xl'}`}>
      <Handle type="target" position={Position.Left} className="!opacity-0 !pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
          </div>
          <div>
            <h3 className="text-sm font-bold font-headline text-white">{data.label || 'Trigger'}</h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Inbound Message</p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
        <p className="text-sm text-white leading-relaxed">Runs whenever a customer sends a message containing keywords like "Help" or "Pricing".</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-4 !h-4 !bg-white !border-0 !rounded-full !ring-4 !ring-primary !cursor-pointer z-10 right-[-14px]"
      />
    </div>
  );
}
