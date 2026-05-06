import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Video, Calendar, Send, Loader2, CheckCircle2 } from 'lucide-react';

export default function ContentPublishing() {
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Publish Content</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
            Drafts (3)
          </button>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
            <Calendar size={14} />
            Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="aspect-[4/5] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 group hover:border-pink-300 hover:bg-pink-50/30 transition-all cursor-pointer">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 text-slate-400 group-hover:text-pink-500 transition-colors">
              <Upload size={32} />
            </div>
            <p className="font-bold text-slate-800 mb-1">Upload Photo or Video</p>
            <p className="text-xs text-slate-400">Drag and drop or click to browse</p>
            <p className="mt-6 text-[10px] text-slate-300 uppercase font-black tracking-widest">Supports: JPG, PNG, MP4</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
               <ImageIcon className="text-blue-500" size={20} />
               <span className="text-sm font-bold text-slate-700">Image Post</span>
            </div>
            <div className="flex-1 p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 opacity-50 cursor-not-allowed">
               <Video className="text-purple-500" size={20} />
               <span className="text-sm font-bold text-slate-700">Reels</span>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Caption</label>
            <textarea 
              className="w-full h-48 p-6 bg-slate-50 border-none rounded-3xl text-sm focus:ring-2 focus:ring-pink-500"
              placeholder="Write your caption here... Use #hashtags and @mentions"
            ></textarea>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
               <span className="text-sm font-bold text-slate-600">Location Tagging</span>
               <button className="text-xs font-bold text-blue-500 mr-2">+ Add</button>
             </div>
             <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
               <span className="text-sm font-bold text-slate-600">Advanced Settings</span>
               <MoreHorizontal size={18} className="text-slate-400" />
             </div>
          </div>

          <button 
            onClick={handlePublish}
            disabled={publishing}
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
              done 
                ? 'bg-green-500 text-white shadow-green-100' 
                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
            }`}
          >
            {publishing ? (
              <Loader2 className="animate-spin" />
            ) : done ? (
              <CheckCircle2 />
            ) : (
              <Send size={20} />
            )}
            <span>{publishing ? 'Publishing...' : done ? 'Published!' : 'Publish Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MoreHorizontal({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}
