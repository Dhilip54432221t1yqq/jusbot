import { Handle, Position, useEdges } from "reactflow";

export default function StartNode({ id, selected }) {
  const edges = useEdges();
  const connected = edges.some(e => e.source === id && e.sourceHandle === "right");

  return (
    <div className="flex flex-col items-center w-[280px]">
      {/* Hidden target handle */}
      
      {/* Green Circle */}
      <div className={`w-[110px] h-[110px] bg-[#3de08d] rounded-full flex items-center justify-center mb-1 shadow-md border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        {/* Play Icon - stroke remains black as in image */}
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      </div>

      {/* Start Label - Now White */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Start</span>

      {/* White Pill Button */}
      <div className={`relative w-full bg-white rounded-full py-4 flex items-center justify-center shadow-md border-2 border-transparent transition-all ${selected ? 'border-[#3de08d]' : ''}`}>
        <span className="text-black text-[15px] font-semibold tracking-wide pr-4">Continue to Next Step</span>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={`!absolute !right-4 !top-1/2 !-translate-y-1/2 !w-6 !h-6 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none hover:!bg-black/10 transition-colors ${connected ? '!bg-black' : '!bg-transparent'}`}
        />
      </div>
    </div>
  );
}
