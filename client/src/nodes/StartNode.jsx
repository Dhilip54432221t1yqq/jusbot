import { Handle, Position } from "reactflow";
import { Zap } from "lucide-react";

export default function StartNode({ selected }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-green-100/80 overflow-visible ${
        selected
          ? "border-green-500 ring-2 ring-green-500/30"
          : "border-slate-200 hover:border-green-300"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0 !pointer-events-none" />

      {/* Header only — no body text */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-5 h-5 text-white fill-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Trigger
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              Inbound Message
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-4 !h-4 !bg-green-600 !border-2 !border-white !rounded-full !ring-2 !ring-green-200 right-[-10px]"
      />
    </div>
  );
}

