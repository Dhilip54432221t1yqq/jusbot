import { Handle, Position } from "reactflow";
import { CornerDownRight } from "lucide-react";

export default function GoToNode({ data, selected }) {
  return (
    <div
      className={`w-64 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-cyan-100/60 overflow-visible ${
        selected
          ? "border-cyan-500 ring-2 ring-cyan-500/30"
          : "border-slate-200 hover:border-cyan-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-cyan-600 !border-2 !border-white !rounded-full !ring-2 !ring-cyan-200 left-[-10px]"
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 rounded-t-2xl">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <CornerDownRight className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Go To
          </h3>
          <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
            Jump to Step
          </p>
        </div>
      </div>

      {/* Target */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-3 py-3 bg-cyan-50 rounded-xl border border-cyan-100">
          <CornerDownRight className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-cyan-700 truncate">
            {data.targetLabel || "Select target step..."}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
          No connector drawn — invisible jump
        </p>
      </div>
    </div>
  );
}
