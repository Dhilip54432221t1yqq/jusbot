import React from 'react';
import { Send, ToggleRight, CheckCircle, Info } from 'lucide-react';

export default function PrivateReplyAutomation() {
  return (
    <div className="space-y-8">
      <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">Comment-to-DM Automation</h3>
          <p className="text-slate-300 text-sm max-w-lg">
            Automatically send a private message to anyone who comments on your posts. 
            Perfect for sending links, discount codes, or booking details.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-2">
              <ToggleRight className="text-green-400" size={16} />
              ACTIVE ON ALL POSTS
            </div>
          </div>
        </div>
        <Send className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 border border-slate-100 rounded-3xl space-y-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle size={18} className="text-pink-500" />
            Global DM Setting
          </h4>
          <p className="text-sm text-slate-400">This message will be sent privately to anyone who comments.</p>
          <textarea 
            className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-pink-500"
            placeholder="Hey! Thanks for your comment. Here is the link you requested: https://reflx.io/demo"
            defaultValue="Thanks for your interest! We've sent you a DM with more details. Let us know if you have any questions! 🚀"
          ></textarea>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200">
            Save Global Rule
          </button>
        </div>

        <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Info size={32} />
          </div>
          <h4 className="font-bold text-blue-900 mb-2">Pro Tip: Personalization</h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            Use tags like <strong>[username]</strong> or <strong>[post_title]</strong> to make your automated messages feel more authentic and personal.
          </p>
        </div>
      </div>
    </div>
  );
}
