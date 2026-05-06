import { Handle, Position } from "reactflow";
import { HelpCircle } from "lucide-react";

export default function QuestionNode({ data, selected }) {
  const TYPE_LABELS = {
    text: "Free Text",
    number: "Number",
    email: "Email",
    phone: "Phone",
    date: "Date",
    datetime: "Date & Time",
    choice: "Choice / Buttons",
    location: "Location",
    rich_media: "Media Upload",
    silent: "Silent Input",
  };

  return (
    <div
      className={`w-80 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-blue-100/60 overflow-visible ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-blue-600 !border-2 !border-white !rounded-full !ring-2 !ring-blue-200 left-[-10px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <HelpCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Question
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              {data.question_type ? TYPE_LABELS[data.question_type] || data.question_type : "User Input"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {data.question_type ? (
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
      <div className="p-4">
        {data.question_type ? (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
              {data.question_text || `Collect ${data.question_type} input...`}
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-dashed border-blue-200 p-5 rounded-xl flex items-center justify-center">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Click to set up question
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex justify-end">
        <Handle
          type="source"
          position={Position.Right}
          id="continue"
          className="!w-4 !h-4 !bg-blue-600 !border-2 !border-white !rounded-full !ring-2 !ring-blue-200 right-[-10px] !relative"
        />
      </div>
    </div>
  );
}
