import { Handle, Position } from "reactflow";
import { MessageSquare } from "lucide-react";

export default function MessageNode({ data, selected }) {
  const isConfigured = data.message_configured;
  const nodeNumber = data.nodeNumber || 1;

  return (
    <div
      className={`w-80 bg-white rounded-2xl flex flex-col group border transition-all shadow-lg shadow-green-100/80 overflow-visible ${
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
            <MessageSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Send Message
            </h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
              {isConfigured ? `Message #${nodeNumber}` : "Unconfigured"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isConfigured ? (
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
      <div className="p-4 space-y-3">
        {isConfigured ? (
          <>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {data.text || "No text content yet..."}
              </p>
            </div>
            {(data.buttons || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(data.buttons || []).map((btn, i) => (
                  <div key={btn.id} className="relative">
                    <span className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-[11px] font-semibold text-green-700 pr-7 inline-block">
                      {btn.label || `Option ${i + 1}`}
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={btn.id}
                        className="!w-2.5 !h-2.5 !bg-green-500 !border-0 !rounded-full !absolute !right-1.5 !top-1/2 !-translate-y-1/2"
                      />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-green-50 border border-dashed border-green-200 p-5 rounded-xl flex items-center justify-center">
            <p className="text-xs font-bold text-green-500 uppercase tracking-wider">
              Click to set up message
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex justify-end">
        <Handle
          type="source"
          position={Position.Right}
          id="continue"
          className="!w-4 !h-4 !bg-green-600 !border-2 !border-white !rounded-full !ring-2 !ring-green-200 right-[-10px] !relative"
        />
      </div>
    </div>
  );
}
