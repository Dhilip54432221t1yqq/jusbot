import { useState } from 'react';
import { 
    CreditCard, 
    Zap, 
    Receipt, 
    CheckCircle2, 
    ExternalLink, 
    Plus,
    Download,
    Calendar,
    ArrowRight
} from 'lucide-react';

export default function Billing() {
    const [activeTab, setActiveTab] = useState('subscription');

    const tabs = [
        { id: 'subscription', name: 'Subscription', icon: Zap },
        { id: 'payment', name: 'Payment Method', icon: CreditCard },
        { id: 'invoices', name: 'Invoices', icon: Receipt },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
                    <CreditCard className="w-7 h-7 text-green-500" />
                    Billing & Subscription
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage your workspace plan, payment methods, and billing history.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl w-fit mb-8 border border-slate-200/60">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${activeTab === tab.id 
                                ? 'bg-white text-green-600 shadow-sm ring-1 ring-slate-200/50' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'subscription' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Plan */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                    <Zap size={120} className="text-green-600" />
                                </div>
                                
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
                                                Active Plan
                                            </span>
                                            <h2 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>Pro Plan</h2>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-extrabold text-slate-800">$49<span className="text-sm font-medium text-slate-400">/mo</span></div>
                                            <p className="text-xs text-slate-500 font-medium">Billed monthly</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        {[
                                            'Unlimited Flows & Automations',
                                            'Up to 10,000 Contacts',
                                            'WhatsApp & Instagram Integration',
                                            'Priority Support 24/7',
                                            'Custom Domains',
                                            'Advanced Analytics'
                                        ].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-200 flex items-center gap-2">
                                            Upgrade Plan <ArrowRight size={16} />
                                        </button>
                                        <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition-all">
                                            Cancel Subscription
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Usage */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Usage this month</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span className="text-slate-600">Contacts</span>
                                            <span className="text-slate-400">2,450 / 10,000</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: '24.5%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span className="text-slate-600">Messages sent</span>
                                            <span className="text-slate-400">45,200 / Unlimited</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">Billing Cycle</h3>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Calendar className="text-blue-500 w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Next payment</p>
                                        <p className="text-sm font-bold text-slate-800">June 14, 2026</p>
                                    </div>
                                </div>
                                <button className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                    Change Cycle <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="max-w-3xl space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Saved Cards</h3>
                                <button className="text-green-600 hover:text-green-700 text-xs font-bold flex items-center gap-1 transition-colors">
                                    <Plus size={14} /> Add New Card
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="p-6 flex items-center justify-between bg-slate-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white text-[10px] font-bold">
                                            VISA
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">•••• •••• •••• 4242</p>
                                            <p className="text-xs text-slate-500">Expires 12/28</p>
                                        </div>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        Primary
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-amber-900 mb-1">Backup Payment Method</h3>
                                <p className="text-xs text-amber-700/80 leading-relaxed">
                                    Add a backup payment method to ensure your workspace remains active in case your primary card fails.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { date: 'May 14, 2026', amount: '$49.00', status: 'Paid' },
                                        { date: 'Apr 14, 2026', amount: '$49.00', status: 'Paid' },
                                        { date: 'Mar 14, 2026', amount: '$49.00', status: 'Paid' },
                                    ].map((inv, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{inv.date}</td>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-bold">{inv.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-200">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
