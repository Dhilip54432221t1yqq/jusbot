import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, Layout, Image as ImageIcon } from 'lucide-react';

export default function SendMessageNode({ data, selected }) {
  const nodeNumber = data.nodeNumber || 1;
  const isConfigured = !!data.text;

  if (!isConfigured) {
    return (
      <div className={`w-80 bg-primary rounded-3xl p-6 flex flex-col gap-6 group border transition-all ${selected ? 'border-white ring-2 ring-white/50' : 'border-primary-dim shadow-xl'}`}>
        <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-white !border-2 !border-primary !rounded-full !ring-4 !ring-white left-[-14px]" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md shadow-sm">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>chat_bubble</span>
            </div>
            <div>
              <h3 className="text-sm font-bold font-headline text-white">Send Message</h3>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Unconfigured</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white/50 rounded-full"></span>
            <span className="text-[10px] font-bold text-white/50">DRAFT</span>
          </div>
        </div>
        
        <div className="bg-white/10 p-6 rounded-2xl flex items-center justify-center border border-dashed border-white/30 backdrop-blur-sm">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Click to set up message</p>
        </div>

        <Handle type="source" position={Position.Right} id="continue" className="!w-4 !h-4 !bg-white !border-2 !border-primary !rounded-full !ring-4 !ring-white !cursor-pointer z-10 right-[-14px]" />
      </div>
    );
  }

  // Configured State
  return (
    <div className={`w-80 bg-primary rounded-3xl p-6 flex flex-col gap-6 group border transition-all ${selected ? 'border-white ring-2 ring-white/50' : 'border-primary-dim shadow-xl'}`}>
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-white !border-2 !border-primary !rounded-full !ring-4 !ring-white left-[-14px]" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>chat_bubble</span>
          </div>
          <div>
            <h3 className="text-sm font-bold font-headline text-white">Send Message</h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Step #{nodeNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"></span>
          <span className="text-[10px] font-bold text-white">ACTIVE</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white/10 p-4 rounded-2xl border border-white/5 relative backdrop-blur-sm">
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed line-clamp-3">{data.text || "No text content yet..."}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {data.hasImage && <div className="p-1 px-2 bg-white/20 border border-white/10 rounded-full text-[11px] font-medium text-white flex items-center gap-1"><ImageIcon size={12}/> Image</div>}
          {data.buttons?.length > 0 && <div className="p-1 px-2 bg-white/20 border border-white/10 rounded-full text-[11px] font-medium text-white flex items-center gap-1"><Layout size={12}/> {data.buttons.length} Buttons</div>}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Handle
          type="source"
          position={Position.Right}
          id="continue"
          className="!w-4 !h-4 !bg-white !border-2 !border-primary !rounded-full !ring-4 !ring-white !cursor-pointer z-10 bottom-8 right-[-14px] !absolute"
        />
      </div>
    </div>
  );
}
