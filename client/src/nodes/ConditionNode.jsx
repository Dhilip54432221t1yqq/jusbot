import { Handle, Position, useEdges } from "reactflow";
import { GitBranch } from "lucide-react";

export default function ConditionNode({ id, data, selected }) {
  const groups = data.groups || [{ label: "Group 1" }, { label: "Otherwise" }];
  const edges = useEdges();
  
  const isConnected = (handleId) => edges.some(e => e.source === id && e.sourceHandle === handleId);

  return (
    <div className="relative flex flex-col items-center w-[300px]">
      
      {/* Circle Icon */}
      <div className={`relative w-[110px] h-[110px] bg-[#22c55e] rounded-full flex items-center justify-center mb-1 shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-full !h-full !opacity-0 !border-none !bg-transparent !m-0 !transform-none"
          style={{ left: 0 }}
        />
        <GitBranch className="w-12 h-12 text-black" strokeWidth={2} />
      </div>

      {/* Label */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Condition</span>

      {/* White Container */}
      <div className={`relative w-full bg-white rounded-[24px] p-3 flex flex-col shadow-sm border-2 border-transparent transition-all ${selected ? 'border-[#22c55e]' : ''}`}>
        <div className="bg-[#fafafa] rounded-[16px] p-5 border border-transparent">
          <div className="flex flex-col gap-2">
            {groups.map((group, i) => {
              const handleId = `group-${i}`;
              const connected = isConnected(handleId);
              const isOtherwise = i === groups.length - 1;
              return (
                <div key={i} className="relative w-full bg-white rounded-xl py-3 px-4 flex items-center justify-between border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isOtherwise ? 'bg-slate-300' : 'bg-[#22c55e]'}`} />
                    <span className="text-[13px] font-semibold text-black truncate max-w-[150px]">
                      {group.label || (isOtherwise ? "Otherwise" : `Group ${i + 1}`)}
                    </span>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={handleId}
                    className={`!absolute !-right-2.5 !top-1/2 !-translate-y-1/2 !w-5 !h-5 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none transition-colors ${connected ? '!bg-black' : '!bg-white'}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
