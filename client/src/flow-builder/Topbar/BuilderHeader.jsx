import React, { useState } from 'react';
import { 
  Save, Send, Play, ShieldCheck, History, 
  Search, Undo2, Redo2, FileOutput, FileInput,
  AlertCircle, CheckCircle2, ChevronDown, User,
  FileSearch, Activity
} from 'lucide-react';

export default function BuilderHeader({ flowId, workspaceId }) {
  const [status, setStatus] = useState('saved'); // saved | saving | dirty
  const [validationStatus, setValidationStatus] = useState('valid'); // valid | errors | warning

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-[50] shadow-sm">
      {/* Left: Metadata & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none group flex items-center gap-1.5 cursor-pointer">
              Marketing Welcome Flow
              <ChevronDown size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded leading-none">Published</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">v1.4.2 • Updated 2m ago</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-100" />

        <div className="flex items-center gap-1">
          <IconButton icon={<Undo2 size={16} />} title="Undo" disabled />
          <IconButton icon={<Redo2 size={16} />} title="Redo" disabled />
        </div>
      </div>

      {/* Center: Search / Jump */}
      <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-64 group focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:bg-white focus-within:border-blue-200 transition-all">
        <FileSearch size={14} className="text-slate-300 group-focus-within:text-blue-500" />
        <input 
          placeholder="Jump to step..." 
          className="bg-transparent border-none outline-none text-xs ml-2 w-full font-medium placeholder:text-slate-300"
        />
        <span className="text-[9px] font-black text-slate-300 border border-slate-200 px-1 rounded bg-white">⌘K</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Validation Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 cursor-pointer hover:bg-white transition-all">
          <CheckCircle2 size={14} className="text-green-500" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Issues</span>
        </div>

        <div className="w-px h-6 bg-slate-100 mx-1" />

        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
           <History size={16} />
           <span className="text-xs font-bold">History</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
           <Play size={16} fill="currentColor" />
           <span className="text-xs font-bold">Simulate</span>
        </button>

        <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
           <Send size={16} />
           <span className="text-xs font-bold">Publish</span>
        </button>

        <div className="w-px h-6 bg-slate-100 mx-1" />
        
        <div className="flex -space-x-2">
           <div className="w-7 h-7 rounded-full border-2 border-white bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-slate-50">JD</div>
           <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-slate-50">AS</div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon, title, disabled }) {
  return (
    <button 
      disabled={disabled}
      className={`p-2 rounded-lg transition-all ${disabled ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}
      title={title}
    >
      {icon}
    </button>
  );
}
