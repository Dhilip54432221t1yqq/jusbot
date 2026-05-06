import { Handle, Position } from "reactflow";
import { Zap } from "lucide-react";

export default function ActionNode({ data, selected }) {
  const actions = data.actions || [];

  return (
    <div
      className={`w-80 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-orange-100/60 overflow-visible ${
        selected
          ? "border-orange-400 ring-2 ring-orange-400/30"
          : "border-slate-200 hover:border-orange-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-orange-500 !border-2 !border-white !rounded-full !ring-2 !ring-orange-200 left-[-10px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-5 h-5 text-white fill-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Action
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              {actions.length > 0 ? `${actions.length} Action${actions.length > 1 ? "s" : ""}` : "Flow Action"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {actions.length > 0 ? (
            <>
              <span className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">ACTIVE</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">DRAFT</span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {actions.length === 0 ? (
          <div className="bg-orange-50 border border-dashed border-orange-200 p-5 rounded-xl flex items-center justify-center">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider text-center">
              Click to configure actions
            </p>
          </div>
        ) : (
          actions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-200 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-orange-700 fill-orange-700" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-orange-800 truncate">
                  {action.type === "set_variable" ? "Set Variable" : action.label}
                </p>
                {action.type === "set_variable" && (
                  <p className="text-[10px] font-medium text-orange-600 truncate mt-0.5">
                    {action.variable} → {action.value}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 pb-4 flex justify-end">
        <Handle
          type="source"
          position={Position.Right}
          id="continue"
          className="!w-4 !h-4 !bg-orange-500 !border-2 !border-white !rounded-full !ring-2 !ring-orange-200 right-[-10px] !relative"
        />
      </div>
    </div>
  );
}
