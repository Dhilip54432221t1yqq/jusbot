import { Handle, Position, useEdges } from "reactflow";

export default function QuestionNode({ id, data, selected }) {
  const isConfigured = data.question_type || data.question_text;
  const edges = useEdges();
  const connected = edges.some(e => e.source === id && e.sourceHandle === "continue");

  return (
    <div className="relative flex flex-col items-center w-[300px]">
      
      {/* Circle Icon */}
      <div className={`relative w-[110px] h-[110px] bg-[#5eead4] rounded-full flex items-center justify-center mb-1 shadow-sm border-2 border-transparent transition-all ${selected ? 'border-black' : ''}`}>
        <Handle
          type="target"
          position={Position.Left}
          className="!absolute !left-0 !top-1/2 !-translate-y-1/2 !w-full !h-full !opacity-0 !border-none !bg-transparent !m-0 !transform-none"
          style={{ left: 0 }}
        />
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 4H5a2 2 0 0 0-2 2v14l5-4h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="16.5" x2="12.01" y2="16.5" strokeWidth="3" />
        </svg>
      </div>

      {/* Label */}
      <span className="text-[22px] text-white mb-2 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Question</span>

      {/* White Container */}
      <div className={`relative w-full bg-white rounded-[24px] p-3 flex flex-col shadow-md border-2 border-transparent transition-all ${selected ? 'border-[#5eead4]' : ''}`}>
        
        {/* Content Area */}
        {!isConfigured ? (
          <div className="bg-slate-50 rounded-[16px] py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="text-slate-800 text-[15px] font-medium mt-1">Click to add question</span>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[16px] p-5 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <p className="text-slate-800 text-[14px] whitespace-pre-wrap leading-relaxed">
              {data.question_text || `Collect ${data.question_type} input...`}
            </p>
          </div>
        )}

        {/* Continue to Next Step */}
        <div className="relative w-full flex items-center justify-center pt-4 pb-2">
          <span className="text-black text-[15px] font-medium tracking-wide pr-4">Continue to Next Step</span>
          <Handle
            type="source"
            position={Position.Right}
            id="continue"
            className={`!absolute !right-1 !top-1/2 !translate-y-[calc(-50%+4px)] !w-6 !h-6 !border-[2.5px] !border-black !rounded-full !m-0 !transform-none hover:!bg-black/10 transition-colors ${connected ? '!bg-black' : '!bg-transparent'}`}
          />
        </div>

      </div>
    </div>
  );
}
