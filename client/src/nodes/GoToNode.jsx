import { Handle, Position } from "reactflow";

export default function GoToNode({ data, selected }) {
  return (
    <div className="relative flex flex-col items-center w-[300px]">
      
      {/* Circle Icon */}
      <div className={`relative w-[110px] h-[110px] bg-[#eaff3b] rounded-full flex items-center justify-center mb-1 shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-full !h-full !opacity-0 !border-none !bg-transparent !m-0 !transform-none"
          style={{ left: 0 }}
        />
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
          <path d="M12 8l4 4-4 4" />
        </svg>
      </div>

      {/* Label */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Go To</span>

      {/* Lime Container */}
      <div className={`relative w-full bg-[#eaff3b] rounded-[24px] p-3 flex flex-col shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>

        {/* Inner White Content Area */}
        <div className="bg-white rounded-[16px] p-5 flex flex-col items-center justify-center min-h-[90px] shadow-sm">
          {data.targetLabel ? (
            <div className="flex flex-col items-center text-center">
              <span className="text-[14px] font-bold text-black max-w-[200px] truncate">
                {data.targetLabel}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Invisible jump
              </p>
            </div>
          ) : (
            <span className="text-slate-400 text-[14px] font-medium">Select target step...</span>
          )}
        </div>

      </div>
    </div>
  );
}
