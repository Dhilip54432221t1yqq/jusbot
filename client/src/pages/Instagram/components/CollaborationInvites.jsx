import React from 'react';
import { Users, Handshake, Check, X, Info } from 'lucide-react';

export default function CollaborationInvites() {
  const invites = [
    { id: 1, from: 'influencer_joy', followers: '45k', category: 'Lifestyle', date: 'Mar 24' },
    { id: 2, from: 'creative_studio', followers: '12k', category: 'Digital Art', date: 'Mar 22' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Collaboration Invites</h3>
        <p className="text-sm text-slate-400">Manage and accept collaboration requests from other creators.</p>
      </div>

      {invites.length > 0 ? (
        <div className="grid gap-4">
          {invites.map((invite) => (
            <div key={invite.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Handshake size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">@{invite.from}</span>
                    <span className="text-xs font-medium text-slate-400">• {invite.followers} followers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">{invite.category}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">{invite.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm">
                  <Check size={20} />
                </button>
                <button className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Users className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-slate-400 font-medium tracking-tight">No pending collaboration invites</p>
        </div>
      )}

      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
        <Info className="text-amber-500 shrink-0" size={20} />
        <div>
          <h5 className="font-bold text-amber-900 text-sm mb-1">About Collaborations</h5>
          <p className="text-xs text-amber-700 leading-relaxed">
            Collaborative posts appear on both profiles and share engagement (likes & comments). 
            Accepting an invite allows the post to be featured on your grid as well.
          </p>
        </div>
      </div>
    </div>
  );
}
