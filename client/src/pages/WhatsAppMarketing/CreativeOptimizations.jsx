import React from 'react';
import { Sparkles, Image, Type } from 'lucide-react';

export default function CreativeOptimizations() {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-purple-600" /> Creative Optimizations
                    </h2>
                    <p className="text-slate-600 mt-2">
                        Meta uses machine learning to automatically optimize your marketing message components (images, text, buttons) 
                        per recipient to maximize engagement. You can control these settings at the WABA or Template level.
                    </p>
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-4 font-medium">
                        Note: Some creative optimization features may be paused or unavailable depending on Meta's current rollout. 
                        Store and display Meta's actual response instead of assuming every feature is active.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
                            <Image className="text-blue-500" size={20} /> Image Enhancements
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Brightness and Contrast</span>
                                <select className="text-sm border border-slate-300 rounded px-2 py-1"><option>OPT_IN</option><option>OPT_OUT</option></select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Image Touchups</span>
                                <select className="text-sm border border-slate-300 rounded px-2 py-1"><option>OPT_IN</option><option>OPT_OUT</option></select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Image Animation</span>
                                <select className="text-sm border border-slate-300 rounded px-2 py-1"><option>OPT_IN</option><option>OPT_OUT</option></select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
                            <Type className="text-green-500" size={20} /> Text & Layout
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Text formatting optimization</span>
                                <select className="text-sm border border-slate-300 rounded px-2 py-1"><option>OPT_IN</option><option>OPT_OUT</option></select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Auto Promotion Tag</span>
                                <select className="text-sm border border-slate-300 rounded px-2 py-1"><option>OPT_IN</option><option>OPT_OUT</option></select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Text Extraction for Headline</span>
                                <select className="text-sm border border-slate-300 rounded px-2 py-1"><option>OPT_IN</option><option>OPT_OUT</option></select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-sm hover:bg-purple-700 transition">
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}
