import { Handle, Position, useEdges } from "reactflow";

export default function ActionNode({ id, data, selected }) {
  const actions = data.actions || [];
  const edges = useEdges();
  
  const isConnected = (handleId) => edges.some(e => e.source === id && e.sourceHandle === handleId);

  return (
    <div className="relative flex flex-col items-center w-[300px]">
      
      {/* Circle Icon */}
      <div className={`relative w-[110px] h-[110px] bg-[#dfa632] rounded-full flex items-center justify-center mb-1 shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-full !h-full !opacity-0 !border-none !bg-transparent !m-0 !transform-none"
          style={{ left: 0 }}
        />
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-2px) translateY(2px)' }}>
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </div>

      {/* Label */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Action</span>

      {/* White Container */}
      <div className={`relative w-full bg-white rounded-[24px] p-3 flex flex-col shadow-sm border-2 border-transparent transition-all ${selected ? 'border-[#dfa632]' : ''}`}>

        {/* Content Area */}
        {actions.length === 0 ? (
          <div className="bg-[#fafafa] rounded-[16px] py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f1f5f9] transition-colors border border-transparent">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="text-black text-[15px] font-medium mt-1">Click to add action</span>
          </div>
        ) : (
          <div className="bg-[#fafafa] rounded-[16px] p-5 border border-transparent cursor-pointer hover:bg-[#f1f5f9] transition-colors">
            <div className="flex flex-col gap-2">
              {actions.map((action, idx) => {
                const handleId = `action-${idx}`;
                const connected = isConnected(handleId);
                return (
                  <div key={idx} className="relative w-full bg-white rounded-xl py-2.5 px-4 flex items-center justify-between border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span className="text-[13px] font-semibold text-black truncate max-w-[140px]">
                        {action.type === "set_variable" ? "Set Variable" : action.label}
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
        )}

        {/* Continue to Next Step */}
        <div className="relative w-full flex items-center justify-center pt-4 pb-2">
          <span className="text-black text-[15px] font-medium tracking-wide pr-4">Continue to Next Step</span>
          <Handle
            type="source"
            position={Position.Right}
            id="continue"
            className={`!absolute !right-1 !top-1/2 !translate-y-[calc(-50%+4px)] !w-6 !h-6 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none hover:!bg-black/10 transition-colors ${isConnected("continue") ? '!bg-black' : '!bg-transparent'}`}
          />
        </div>

      </div>
    </div>
  );
}
