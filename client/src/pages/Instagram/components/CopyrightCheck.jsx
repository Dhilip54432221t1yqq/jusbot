import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export default function CopyrightCheck() {
  const status = 'clean'; // 'clean', 'warning', 'violation'

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Copyright & Compliance</h3>
          <p className="text-sm text-slate-400">Pre-check your video content for copyright violations before publishing.</p>
        </div>
      </div>

      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-md mb-6 text-slate-300">
          <ShieldCheck size={40} />
        </div>
        <h4 className="font-bold text-slate-800 mb-2">No Content Scan Active</h4>
        <p className="text-sm text-slate-400 max-w-sm mb-8">
          Upload a video in the "Publish" tab to automatically trigger a copyright compliance scan.
        </p>
        <button className="bg-white border border-slate-200 text-slate-600 px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
          Select Video for Scan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-green-50 border border-green-100 rounded-2xl">
          <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <h5 className="font-bold text-green-900 text-sm mb-1">Clean Status</h5>
          <p className="text-xs text-green-700">Content safe for monetization and global reach.</p>
        </div>
        
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl opacity-50">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <h5 className="font-bold text-amber-900 text-sm mb-1">Muted in Regions</h5>
          <p className="text-xs text-amber-700">Content contains audio that may be muted in specific countries.</p>
        </div>

        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl opacity-50">
          <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert size={20} />
          </div>
          <h5 className="font-bold text-red-900 text-sm mb-1">Copyright Violation</h5>
          <p className="text-xs text-red-700">Blocked content. Publishing may lead to account restrictions.</p>
        </div>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
        <Info className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Note:</strong> Copyright checks are provided by Facebook's automated Rights Manager system. 
          While helpful, they do not guarantee that your content will never face a manual claim or takedown.
        </p>
      </div>
    </div>
  );
}
