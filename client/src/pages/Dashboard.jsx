import { useState, useEffect } from 'react';
import { Cloud, BarChart3, ChevronRight, Zap, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Dashboard() {
    const navigate = useNavigate();
    const { workspaceId } = useParams();

    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        conversations: 0,
        flows: 0,
        botUsers: 0,
        conversion: '0%'
    });

    const isConnected = localStorage.getItem(`reflx_whatsapp_connected_${workspaceId}`) === 'true';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch flows count
                const { count: flowsCount } = await supabase
                    .from('flows')
                    .select('*', { count: 'exact', head: true })
                    .eq('workspace_id', workspaceId);

                // Fetch conversations count
                const { count: convCount } = await supabase
                    .from('conversations')
                    .select('*', { count: 'exact', head: true })
                    .eq('workspace_id', workspaceId);

                // Fetch contacts (bot users) count
                const { count: contactsCount } = await supabase
                    .from('contacts')
                    .select('*', { count: 'exact', head: true })
                    .eq('workspace_id', workspaceId);

                const cCount = convCount || 0;
                const fCount = flowsCount || 0;
                const bCount = contactsCount || 0;

                setStats({
                    conversations: cCount,
                    flows: fCount,
                    botUsers: bCount,
                    conversion: fCount > 0 ? '12%' : '0%' // Mock conversion rate
                });
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (workspaceId) {
            fetchDashboardData();
        }
    }, [workspaceId, isConnected]);

    const quickStats = [
        { label: 'Total Conversations', value: stats.conversations.toString(), imageUrl: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Dashboard%20Icon%20TC.png' },
        { label: 'Active Flows', value: stats.flows.toString(), imageUrl: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Dashboard%20Icon%20AF.png' },
        { label: 'Total Bot Users', value: stats.botUsers.toString(), imageUrl: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Dashboard%20Icon%20AU.png' },
        { label: 'Conversion Rate', value: stats.conversion, imageUrl: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Dashboard%20Icon%20CR.png' }
    ];

    return (
        <div className="p-8">
            {/* Welcome Card */}
            {!isLoading && (
                <div className="rounded-2xl p-10 mb-8 text-white relative overflow-hidden flex items-center justify-between shadow-sm" style={{ background: 'linear-gradient(to bottom, #0b904c, #059144)', minHeight: '280px' }}>
                    {/* Background Pattern (Optional subtle glow) */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 max-w-xl">
                        <h3 className="text-[28px] font-bold mb-4 flex items-center gap-2 tracking-tight">
                            {isConnected ? '🚀 Ready to Build Something Amazing?' : '🚀 Get Started with Your Chatbot'}
                        </h3>
                        <p className="text-white/95 mb-8 text-[15px] leading-relaxed max-w-[480px]">
                            {isConnected ? (
                                'Start from scratch or choose from our ready-made chatbot templates to launch faster.'
                            ) : (
                                <>You're all set! Start building your first flow to automate conversations and engage<br />with your customers.</>
                            )}
                        </p>
                        <button
                            onClick={() => {
                                if (isConnected) {
                                    navigate(`/${workspaceId}/whatsapp/templates`);
                                } else {
                                    navigate(`/${workspaceId}/flows`);
                                }
                            }}
                            className="bg-white text-[#0b904c] font-bold text-[14px] px-6 py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1 w-fit shadow-sm"
                        >
                            {isConnected ? 'Browse Templates' : 'Create Your First Flow'}
                            <ChevronRight className="w-4 h-4 ml-1 stroke-[2.5]" />
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 h-full flex items-center justify-end pointer-events-none">
                        <img
                            src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Dashoard%20Robot.png"
                            alt="3D Robot"
                            className="h-full w-auto object-cover object-left"
                            style={{
                                maskImage: 'linear-gradient(to right, transparent 0%, black 15%)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%)'
                            }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {quickStats.map((stat) => {
                    return (
                        <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <img src={stat.imageUrl} alt={stat.label} className="w-full h-full object-contain" />
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
                            onClick={() => { navigate(`/${workspaceId}/whatsapp/flows`); }} // eslint-disable-line
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-semibold text-slate-700" style={{ letterSpacing: '-0.01em' }}>Build New Flow</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                        <button
                            onClick={() => { navigate(`/${workspaceId}/whatsapp-cloud`); }} // eslint-disable-line
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${isConnected ? 'bg-green-100 group-hover:bg-green-200' : 'bg-purple-100 group-hover:bg-purple-200'} rounded-lg flex items-center justify-center transition-colors`}>
                                    {isConnected ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Cloud className="w-5 h-5 text-purple-600" />}
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-700 block" style={{ letterSpacing: '-0.01em' }}>
                                        {isConnected ? 'Manage WhatsApp' : 'Connect WhatsApp'}
                                    </span>
                                    {isConnected && (
                                        <span className="text-xs text-green-600 font-medium">Connected</span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                        <button
                            onClick={() => { navigate(`/${workspaceId}/livechat`); }} // eslint-disable-line
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                    <BarChart3 className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="font-semibold text-slate-700" style={{ letterSpacing: '-0.01em' }}>View Live Chat</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-800 mb-6" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>Recent Activity</h4>
                    <div className="space-y-4">
                        {stats.conversations > 0 ? (
                            <div className="flex items-start gap-4 pb-4 border-b border-slate-50">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2.5"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-600 font-medium" style={{ letterSpacing: '-0.01em' }}>Activity Recorded</p>
                                    <p className="text-xs text-slate-400 mt-1">You have {stats.conversations} conversations.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4 pb-4 border-b border-slate-50">
                                <div className="w-2 h-2 bg-slate-200 rounded-full mt-2.5"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-600 font-medium" style={{ letterSpacing: '-0.01em' }}>No activity yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Start building flows to see activity</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
