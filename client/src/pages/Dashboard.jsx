import React from 'react';
import { MessageCircle, Cloud, BarChart3, ChevronRight, TrendingUp, Zap, Bot } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const { workspaceId } = useParams();

    const quickStats = [
        { label: 'Total Conversations', value: '0', icon: MessageCircle, color: 'bg-blue-500' },
        { label: 'Active Flows', value: '0', icon: Zap, color: 'bg-purple-500' },
        { label: 'Bot Responses', value: '0', icon: Bot, color: 'bg-green-500' },
        { label: 'Conversion Rate', value: '0%', icon: TrendingUp, color: 'bg-orange-500' }
    ];

    return (
        <div className="p-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 mb-8 text-white shadow-xl shadow-green-100 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>🚀 Get Started with Your Chatbot</h3>
                        <p className="text-green-50 mb-8 max-w-2xl text-base leading-relaxed opacity-90" style={{ letterSpacing: '-0.01em' }}>
                            You're all set! Start building your first flow to automate conversations and engage with your customers.
                        </p>
                        <button
                            onClick={() => { navigate(`/${workspaceId}/flows`); }} // eslint-disable-line
                            className="bg-white text-green-600 font-bold px-7 py-3.5 rounded-xl hover:shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2" style={{ letterSpacing: '-0.01em' }}>
                            Create Your First Flow
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="hidden lg:block relative">
                        <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
                            <Bot className="w-24 h-24 text-white drop-shadow-md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {quickStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.03em' }}>{stat.value}</p>
                            <p className="text-sm text-slate-500 font-medium" style={{ letterSpacing: '-0.01em' }}>{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-800 mb-6" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>Quick Actions</h4>
                    <div className="space-y-3">
                        <button
                            onClick={() => { navigate(`/${workspaceId}/flows`); }} // eslint-disable-line
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-semibold text-slate-700" style={{ letterSpacing: '-0.01em' }}>Build New Flow</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <Cloud className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-semibold text-slate-700" style={{ letterSpacing: '-0.01em' }}>Connect WhatsApp</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                    <BarChart3 className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="font-semibold text-slate-700" style={{ letterSpacing: '-0.01em' }}>View Analytics</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-800 mb-6" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>Recent Activity</h4>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 pb-4 border-b border-slate-50">
                            <div className="w-2 h-2 bg-slate-200 rounded-full mt-2.5"></div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-600 font-medium" style={{ letterSpacing: '-0.01em' }}>No activity yet</p>
                                <p className="text-xs text-slate-400 mt-1">Start building flows to see activity</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
