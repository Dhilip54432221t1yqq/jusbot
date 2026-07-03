import React from 'react';
import { Plus, Megaphone } from 'lucide-react';

export default function MarketingCampaigns() {
    return (
        <div className="p-8 h-full overflow-y-auto flex flex-col items-center justify-center">
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center shadow-sm max-w-lg w-full">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Megaphone size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Marketing Campaigns</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Create, schedule, and send bulk marketing campaigns to specific audience segments. 
                    Campaigns allow you to map dynamic variables from your CRM directly into your marketing templates.
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 mx-auto transition">
                    <Plus size={20} /> Create Campaign
                </button>
            </div>
        </div>
    );
}
