import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, TrendingUp, Users, MessageSquare, DollarSign, ChevronDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
    const [timeRange, setTimeRange] = useState('Last 7 Days');
    const [platform, setPlatform] = useState('All Platforms');
    
    // Sample data for 2D Charts
    const lineData = [
        { name: 'Mon', Messages: 4000, Users: 2400 },
        { name: 'Tue', Messages: 3000, Users: 1398 },
        { name: 'Wed', Messages: 2000, Users: 9800 },
        { name: 'Thu', Messages: 2780, Users: 3908 },
        { name: 'Fri', Messages: 1890, Users: 4800 },
        { name: 'Sat', Messages: 2390, Users: 3800 },
        { name: 'Sun', Messages: 3490, Users: 4300 },
    ];

    const barData = [
        { age: '18-24', count: 400 },
        { age: '25-34', count: 300 },
        { age: '35-44', count: 300 },
        { age: '45-54', count: 200 },
        { age: '55+', count: 100 },
    ];

    const pieData = [
        { name: 'WhatsApp', value: 400 },
        { name: 'Instagram', value: 300 },
        { name: 'Live Chat', value: 300 },
    ];
    const COLORS = ['#22c55e', '#e1306c', '#3b82f6'];

    const cards = [
        { title: 'Total Messages', value: '124.5K', icon: MessageSquare, trend: '+12.5%', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Active Users', value: '32.1K', icon: Users, trend: '+5.2%', trendUp: true, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Conversion Rate', value: '4.8%', icon: TrendingUp, trend: '-1.2%', trendUp: false, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Revenue Generated', value: '$45,231', icon: DollarSign, trend: '+8.4%', trendUp: true, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

    return (
        <div className="flex-1 bg-slate-50 overflow-y-auto p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Advanced Analytics</h1>
                        <p className="text-slate-500 mt-1">Deep dive into your performance metrics and activity.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Platform Filter */}
                        <div className="relative">
                            <select 
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer shadow-sm"
                            >
                                <option>All Platforms</option>
                                <option>WhatsApp</option>
                                <option>Instagram</option>
                                <option>Live Chat</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Date Range Filter */}
                        <div className="relative">
                            <select 
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-10 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer shadow-sm"
                            >
                                <option>Today</option>
                                <option>Yesterday</option>
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Month</option>
                            </select>
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        
                        {/* Generic Filter Button */}
                        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <Filter className="w-4 h-4" />
                            <span>More Filters</span>
                        </button>
                    </div>
                </div>

                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, index) => (
                        <motion.div 
                            key={index}
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${card.bg}`}>
                                    <card.icon className={`w-6 h-6 ${card.color}`} strokeWidth={2.5} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${card.trendUp ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                    {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                    {card.trend}
                                </div>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium mb-1">{card.title}</h3>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                            
                            {/* Decorative background gradient */}
                            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${card.bg}`} />
                        </motion.div>
                    ))}
                </div>

                {/* 2D Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Line Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages & Users Over Time</h2>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="Messages" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Users" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart (Histogram) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Age Distribution</h2>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Distribution</h2>
                        </div>
                        <div className="w-full h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
