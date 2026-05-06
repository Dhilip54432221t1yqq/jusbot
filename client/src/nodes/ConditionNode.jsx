import { Handle, Position } from "reactflow";
import { GitBranch } from "lucide-react";

export default function ConditionNode({ data, selected }) {
  const groups = data.groups || [{ label: "Group 1" }, { label: "Otherwise" }];

  return (
    <div
      className={`w-80 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-green-100/60 overflow-visible ${
        selected
          ? "border-green-500 ring-2 ring-green-500/30"
          : "border-slate-200 hover:border-green-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-green-600 !border-2 !border-white !rounded-full !ring-2 !ring-green-200 left-[-10px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <GitBranch className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Condition
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              Branch Logic
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">IF</span>
        </div>
      </div>

      {/* Groups */}
      <div className="p-4 space-y-2 relative">
        {groups.map((group, i) => {
          const isOtherwise = i === groups.length - 1;
          return (
            <div
              key={i}
              className={`relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                isOtherwise
                  ? "bg-slate-50 border-slate-200 border-dashed"
                  : "bg-green-50 border-green-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOtherwise ? "bg-slate-300" : "bg-green-500"
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    isOtherwise ? "text-slate-500" : "text-green-700"
                  }`}
                >
                  {group.label || (isOtherwise ? "Otherwise" : `Group ${i + 1}`)}
                </span>
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`group-${i}`}
                style={{ top: "auto", right: "-12px", position: "absolute" }}
                className={`!w-3.5 !h-3.5 !rounded-full !border-2 !border-white !ring-2 ${
                  isOtherwise
                    ? "!bg-slate-400 !ring-slate-200"
                    : "!bg-green-500 !ring-green-200"
                }`}
              />
            </div>
          );
        })}

        {!data.groups && (
          <p className="text-[10px] text-slate-400 text-center py-2 font-medium">
            Click to configure conditions
          </p>
        )}
      </div>
    </div>
  );
}
