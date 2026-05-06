import React from 'react';
import { Handle, Position } from 'reactflow';
import { Mail, MoreVertical, Paperclip, Clock } from 'lucide-react';

export default function EmailNode({ data, selected }) {
  return (
    <div className={`
      w-[280px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-sky-500 ring-4 ring-sky-500/10' : 'border-slate-100 hover:border-slate-200'}
    `}>
      <div className="absolute -top-3 left-4">
        <div className="px-2 py-0.5 bg-sky-500 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
          Email
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-sky-500 !border-2 !border-white" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-sky-50/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <Mail size={14} />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">External Mail</span>
        </div>
        <button className="text-slate-300"><MoreVertical size={14} /></button>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sub:</span>
              <p className="text-[10px] font-bold text-slate-600 truncate">{data.subject || 'Your order summary'}</p>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">To:</span>
              <p className="text-[10px] font-bold text-blue-500 truncate">{data.to || '{{user_email}}'}</p>
           </div>
        </div>
        
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-1.5">
              <Paperclip size={12} className="text-slate-300" />
              <span className="text-[9px] font-bold text-slate-400">Attachments: 0</span>
           </div>
           <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-300" />
              <span className="text-[9px] font-bold text-slate-400">Immediate</span>
           </div>
        </div>
      </div>

      <div className="px-4 pb-4">
         <div className="w-full h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4 group hover:bg-sky-50 hover:border-sky-200 cursor-pointer transition-all relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-sky-400/20" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-sky-600">Next Step</span>
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover:border-sky-300 transition-all">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-sky-500" />
            </div>
            <Handle type="source" position={Position.Right} id="continue" className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0" />
         </div>
      </div>
    </div>
  );
}
