export default function TopToolbar() {
  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Draft WhatsApp Flow</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs animate-pulse">
          Draft
        </span>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-slate-100">Preview</button>
        <button className="px-3 py-1 rounded bg-slate-100">Save</button>
        <button className="px-3 py-1 rounded bg-green-500 text-white">Publish</button>
      </div>
    </div>
  );
}
