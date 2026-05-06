import React, { useState } from 'react';
import { MessageSquare, Plus, Save, Trash2, Zap } from 'lucide-react';

export default function CommentAutomation() {
  const [rules, setRules] = useState([
    { id: 1, keyword: 'price', response: 'Check your DMs for pricing details!', active: true },
    { id: 2, keyword: 'info', response: 'Sending more info your way!', active: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Comment Auto-Reply</h3>
          <p className="text-sm text-slate-400">Automatically reply to comments based on keywords.</p>
        </div>
        <button className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-100 hover:bg-pink-600 transition-all">
          <Plus size={18} />
          Add New Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">If comment contains</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-sm font-bold">"{rule.keyword}"</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Then reply</span>
                  <p className="text-sm text-slate-600 font-medium">"{rule.response}"</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <Save size={18} />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
              <div className="ml-2 h-6 w-[2px] bg-slate-100"></div>
              <div className={`w-12 h-6 rounded-full relative transition-colors ${rule.active ? 'bg-green-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${rule.active ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
