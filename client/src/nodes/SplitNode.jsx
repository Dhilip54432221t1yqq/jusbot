import { Handle, Position } from "reactflow";
import { Shuffle } from "lucide-react";

export default function SplitNode({ data, selected }) {
  const branches = data.branches || [
    { label: "Branch A", percent: 50 },
    { label: "Branch B", percent: 50 },
  ];

  return (
    <div
      className={`w-80 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-pink-100/60 overflow-visible ${
        selected
          ? "border-pink-400 ring-2 ring-pink-400/30"
          : "border-slate-200 hover:border-pink-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-pink-500 !border-2 !border-white !rounded-full !ring-2 !ring-pink-200 left-[-10px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Shuffle className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Split
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              A/B Testing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
            {branches.length} paths
          </span>
        </div>
      </div>

      {/* Branches */}
      <div className="p-4 space-y-2 relative">
        {branches.map((branch, i) => (
          <div
            key={i}
            className="relative flex items-center justify-between px-4 py-3 rounded-xl border bg-pink-50 border-pink-100 transition-all"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-pink-700 truncate">
                {branch.label || `Branch ${i + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-black text-pink-600">
                {branch.percent || 0}%
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`branch-${i}`}
                style={{ top: "auto", right: "-12px", position: "absolute" }}
                className="!w-3.5 !h-3.5 !bg-pink-400 !rounded-full !border-2 !border-white !ring-2 !ring-pink-200"
              />
            </div>
          </div>
        ))}

        {/* Total bar */}
        <div className="pt-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all"
              style={{
                width: `${branches.reduce((sum, b) => sum + (b.percent || 0), 0)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right">
            Total: {branches.reduce((sum, b) => sum + (b.percent || 0), 0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
