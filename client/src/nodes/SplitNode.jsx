import { Handle, Position, useEdges } from "reactflow";

export default function SplitNode({ id, data, selected }) {
  const branches = data.branches || [
    { label: "Branch A", percent: 50 },
    { label: "Branch B", percent: 50 },
  ];
  const edges = useEdges();

  const isConnected = (handleId) => edges.some(e => e.source === id && e.sourceHandle === handleId);

  return (
    <div className="relative flex flex-col items-center w-[300px]">
      
      {/* Circle Icon */}
      <div className={`relative w-[110px] h-[110px] bg-[#ec4899] rounded-full flex items-center justify-center mb-1 shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-full !h-full !opacity-0 !border-none !bg-transparent !m-0 !transform-none"
          style={{ left: 0 }}
        />
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3h5v5"/>
          <path d="M4 20L21 3"/>
          <path d="M21 16v5h-5"/>
          <path d="M15 15l6 6"/>
          <path d="M4 4l5 5"/>
        </svg>
      </div>

      {/* Label */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Split</span>

      {/* White Container */}
      <div className={`relative w-full bg-white rounded-[24px] p-3 flex flex-col shadow-sm border-2 border-transparent transition-all ${selected ? 'border-[#ec4899]' : ''}`}>
        <div className="bg-[#fafafa] rounded-[16px] p-5 border border-transparent">
          <div className="flex flex-col gap-2">
            {branches.map((branch, i) => {
              const handleId = `branch-${i}`;
              const connected = isConnected(handleId);
              return (
                <div key={i} className="relative w-full bg-white rounded-xl py-3 px-4 flex items-center justify-between border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#ec4899]" />
                    <span className="text-[13px] font-semibold text-black truncate max-w-[120px]">
                      {branch.label || `Branch ${i + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <span className="text-[12px] font-bold text-[#ec4899]">
                      {branch.percent || 0}%
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

          {/* Total bar */}
          <div className="pt-4">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ec4899] rounded-full transition-all"
                style={{
                  width: `${branches.reduce((sum, b) => sum + (b.percent || 0), 0)}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 text-right font-medium">
              Total: {branches.reduce((sum, b) => sum + (b.percent || 0), 0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
