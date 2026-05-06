import React from 'react';
import { Users, Image as ImageIcon, Heart, MessageCircle, TrendingUp } from 'lucide-react';

export default function AccountOverview({ account }) {
  if (!account) return <div>No account data</div>;

  const stats = [
    { label: 'Followers', value: account.followers_count?.toLocaleString() || '0', icon: Users, color: 'text-blue-500' },
    { label: 'Media Count', value: account.media_count?.toString() || '0', icon: ImageIcon, color: 'text-purple-500' },
    { label: 'Avg. Likes', value: '1.2k', icon: Heart, color: 'text-pink-500' },
    { label: 'Avg. Comments', value: '45', icon: MessageCircle, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Info */}
      <div className="flex items-center gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <img 
          src={account.profile_picture_url || 'https://via.placeholder.com/150'} 
          alt={account.username} 
          className="w-24 h-24 rounded-full border-4 border-white shadow-md"
        />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">@{account.username}</h2>
          <p className="text-slate-500 font-medium">{account.name}</p>
          <div className="flex gap-4 mt-3">
            <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">Business Account</span>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Connected</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Engagement Chart Placeholder */}
      <div className="p-8 border border-slate-100 rounded-3xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-pink-500" />
            Last 30 Days Engagement
          </h3>
          <select className="text-xs font-semibold bg-slate-50 border-none rounded-lg focus:ring-pink-500">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
          </select>
        </div>
        <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 italic border-2 border-dashed border-slate-200">
          Engagement chart data visualization (Chart.js/Recharts integration)
        </div>
      </div>
    </div>
  );
}
