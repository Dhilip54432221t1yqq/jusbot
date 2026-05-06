import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Eye, Zap } from 'lucide-react';

const data = [
  { name: 'Mon', reach: 4000, impressions: 2400 },
  { name: 'Tue', reach: 3000, impressions: 1398 },
  { name: 'Wed', reach: 2000, impressions: 9800 },
  { name: 'Thu', reach: 2780, impressions: 3908 },
  { name: 'Fri', reach: 1890, impressions: 4800 },
  { name: 'Sat', reach: 2390, impressions: 3800 },
  { name: 'Sun', reach: 3490, impressions: 4300 },
];

export default function InsightsDashboard() {
  const metrics = [
    { label: 'Impressions', value: '124,500', growth: '+12%', icon: Eye, color: 'text-blue-500' },
    { label: 'Reach', value: '82,300', growth: '+8%', icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Profile Views', value: '4,100', growth: '+15%', icon: Users, color: 'text-pink-500' },
    { label: 'Engagement', value: '4.2%', growth: '+2%', icon: Zap, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-slate-50 ${m.color}`}>
                <m.icon size={20} />
              </div>
              <span className="text-xs font-bold text-green-500">{m.growth}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
            <p className="text-2xl font-black text-slate-800">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 border border-slate-100 rounded-3xl bg-white shadow-sm">
          <h4 className="font-bold text-slate-800 mb-8">Reach vs Impressions</h4>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="reach" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 border border-slate-100 rounded-3xl bg-white shadow-sm">
          <h4 className="font-bold text-slate-800 mb-8">Follower Growth</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="reach" stroke="#ec4899" strokeWidth={3} dot={{ stroke: '#ec4899', strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
