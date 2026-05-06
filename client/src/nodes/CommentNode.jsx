import { MessageSquare } from "lucide-react";

// Comment node has no handles — it's purely decorative/documentation
export default function CommentNode({ data, selected }) {
  const bgColors = {
    yellow: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    red: "bg-red-50 border-red-200",
    purple: "bg-purple-50 border-purple-200",
  };
  const headerColors = {
    yellow: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
  };

  const color = data.color || "yellow";
  const bg = bgColors[color] || bgColors.yellow;
  const headerCls = headerColors[color] || headerColors.yellow;

  return (
    <div
      className={`w-64 rounded-2xl border-2 border-dashed transition-all shadow-sm ${bg} ${
        selected ? "ring-2 ring-amber-400/40" : ""
      }`}
    >
      {/* Title bar */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl ${headerCls}`}>
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wide truncate">
          {data.title || "Comment"}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
          {data.body || "Add a note here..."}
        </p>
      </div>
    </div>
  );
}
