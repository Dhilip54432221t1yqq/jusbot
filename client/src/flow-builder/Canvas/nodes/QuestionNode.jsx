import React from 'react';
import { Handle, Position } from 'reactflow';
import { HelpCircle, ChevronRight, MoreVertical, MessageSquare } from 'lucide-react';

export default function QuestionNode({ data, selected }) {
  const isConfigured = !!data.question_text;
  const type = data.question_type || 'text';

  return (
    <div className={`
      w-[280px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all duration-300 overflow-hidden
      ${selected ? 'border-indigo-600 ring-4 ring-indigo-600/10' : 'border-slate-100 hover:border-slate-200'}
    `}>
      {/* Node Decorator */}
      <div className="absolute -top-3 left-4 flex gap-1">
        <div className="px-2 py-0.5 bg-indigo-600 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
          Question
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-indigo-600 !border-2 !border-white" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-indigo-600 !border-2 !border-white" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle size={14} />
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate w-32">
            Ask User
          </span>
        </div>
        <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={14} /></button>
      </div>

      <div className="p-4">
        {!isConfigured ? (
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl group hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors mb-2">
              <MessageSquare size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 text-center px-4 leading-tight">Click to setup question</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 relative">
               <p className="text-xs text-slate-700 font-bold leading-relaxed line-clamp-2 italic">
                 "{data.question_text}"
               </p>
            </div>
            <div className="flex items-center justify-between px-1">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capture Type:</span>
               <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">{type}</span>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Ports Support */}
      <div className="px-4 pb-4 space-y-2">
         {/* Success Port */}
         <div className="w-full h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4 group hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-all relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-emerald-400/20" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600">On Success</span>
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover:border-emerald-300 transition-all">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-emerald-500" />
            </div>
            <Handle type="source" position={Position.Right} id="success" className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0" />
         </div>

         {/* Invalid Intent/Retry Port */}
         <div className="w-full h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between px-4 group hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-all relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-amber-400/20" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-600">Fallback</span>
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover:border-amber-300 transition-all">
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-amber-500" />
            </div>
            <Handle type="source" position={Position.Right} id="fallback" className="!w-full !h-full !bg-transparent !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0" />
         </div>
      </div>
    </div>
  );
}
