import { Handle, Position } from "reactflow";
import { Mail } from "lucide-react";

export default function SendEmailNode({ data, selected }) {
  return (
    <div
      className={`w-80 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-blue-100/60 overflow-visible ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-blue-600 !border-2 !border-white !rounded-full !ring-2 !ring-blue-200 left-[-10px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Mail className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Send Email
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              Email Node
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {data.to ? (
            <>
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-[10px] font-bold text-white/80">CONFIGURED</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
              <span className="text-[10px] font-bold text-white/50">DRAFT</span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {data.to ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider w-10 flex-shrink-0">To</span>
              <span className="text-xs text-blue-700 font-semibold truncate">{data.to}</span>
            </div>
            {data.subject && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10 flex-shrink-0 mt-0.5">Sub</span>
                <span className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">{data.subject}</span>
              </div>
            )}
          </>
        ) : (
          <div className="bg-blue-50 border border-dashed border-blue-200 p-5 rounded-xl flex items-center justify-center">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Click to configure email</p>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="continue"
        className="!w-4 !h-4 !bg-blue-600 !border-2 !border-white !rounded-full !ring-2 !ring-blue-200 right-[-10px]"
      />
    </div>
  );
}
