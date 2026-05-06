import React from 'react';
import { AtSign, Bell, CheckCircle, Zap } from 'lucide-react';

export default function MentionsListener() {
  const mentions = [
    { id: 1, user: 'alex_designer', text: 'Love what @reflx_chat is building! 🚀', time: '2h ago' },
    { id: 2, user: 'marketing_pro', text: 'Checking out the new @reflx_chat features for IG.', time: '5h ago' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Mentions Listener</h3>
          <p className="text-sm text-slate-400">Track and automatically respond when your account is @mentioned.</p>
        </div>
        <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Zap size={14} fill="currentColor" />
          LISTENING ACTIVE
        </div>
      </div>

      <div className="grid gap-4">
        {mentions.map((mention) => (
          <div key={mention.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between group hover:border-pink-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <AtSign size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800">@{mention.user}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{mention.time}</span>
                </div>
                <p className="text-sm text-slate-600">{mention.text}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-pink-500 hover:text-white transition-all shadow-sm">
              Reply
            </button>
          </div>
        ))}
      </div>

      <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-md mb-4 text-pink-500">
          <Bell size={32} />
        </div>
        <h4 className="font-bold text-slate-800 mb-2">Automate Mention Replies</h4>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Setting up an automated reply for mentions increases engagement by 40%.
        </p>
        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-slate-200">
          Configure Auto-Reply
        </button>
      </div>
    </div>
  );
}
