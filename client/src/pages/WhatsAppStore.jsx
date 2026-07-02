import { useState } from "react";
import { ShoppingBag, Settings, MessageSquare, ShoppingCart, Banknote, Package, ChevronUp, ChevronDown, CheckCircle, ArrowRight, Pencil, BarChart2 } from "lucide-react";

const AbandonedCartTab = () => {
    const [flows, setFlows] = useState([
        { id: 1, name: "Abandoned Cart 1", defaultVal: 15, defaultUnit: "Minutes", enabled: false },
        { id: 2, name: "Abandoned Cart 2", defaultVal: 1, defaultUnit: "Hours", enabled: false },
        { id: 3, name: "Abandoned Cart 3", defaultVal: 1, defaultUnit: "Days", enabled: false },
    ]);

    const toggleStatus = (id) => {
        setFlows(flows.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    return (
        <div className="w-full h-full flex flex-col p-6">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Flow Name</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Duration</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="space-y-4">
                        {flows.map((flow) => (
                            <tr key={flow.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 px-6 text-[15px] text-slate-500 font-medium">{flow.name}</td>
                                <td className="py-6 px-6">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="60" 
                                            defaultValue={flow.defaultVal}
                                            className="w-16 h-9 px-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-shadow bg-white"
                                        />
                                        <select 
                                            defaultValue={flow.defaultUnit}
                                            className="h-9 px-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-shadow bg-white"
                                        >
                                            <option value="Minutes">Minutes</option>
                                            <option value="Hours">Hours</option>
                                            <option value="Days">Days</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="py-6 px-6">
                                    <button 
                                        onClick={() => toggleStatus(flow.id)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${flow.enabled ? 'bg-[#25D366]' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flow.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="py-6 px-6">
                                    <div className="flex items-center justify-end gap-4 text-slate-300">
                                        <button className="hover:text-slate-600 transition-colors" title="Edit Flow">
                                            <Pencil size={18} />
                                        </button>
                                        <button className="hover:text-slate-600 transition-colors" title="Analytics">
                                            <BarChart2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CODFlowTab = () => {
    const [flows, setFlows] = useState([
        { id: 1, name: "COD Order Confirmation", enabled: false },
        { id: 2, name: "COD Order Follow Up Status", enabled: false },
        { id: 3, name: "COD Order Confirm Status", enabled: false },
        { id: 4, name: "COD Order Cancel Status", enabled: false },
        { id: 5, name: "COD Payment Request", enabled: false },
        { id: 6, name: "COD Payment Reminder", enabled: false },
    ]);

    const toggleStatus = (id) => {
        setFlows(flows.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    return (
        <div className="w-full h-full flex flex-col p-6">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Flow Name</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="space-y-4">
                        {flows.map((flow) => (
                            <tr key={flow.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 px-6 text-[15px] text-slate-500 font-medium">{flow.name}</td>
                                <td className="py-6 px-6">
                                    <button 
                                        onClick={() => toggleStatus(flow.id)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${flow.enabled ? 'bg-[#25D366]' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flow.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="py-6 px-6">
                                    <div className="flex items-center justify-end gap-4 text-slate-300">
                                        <button className="hover:text-slate-600 transition-colors" title="Edit Flow">
                                            <Pencil size={18} />
                                        </button>
                                        <button className="hover:text-slate-600 transition-colors" title="Analytics">
                                            <BarChart2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OrderFlowTab = () => {
    const [flows, setFlows] = useState([
        { id: 1, name: "Order Confirmed", enabled: false },
        { id: 2, name: "Order Cancelled", enabled: false },
        { id: 3, name: "Order Fulfilled", enabled: false },
        { id: 4, name: "Reorder", enabled: false },
        { id: 5, name: "Order Feedback", enabled: false },
        { id: 6, name: "Order Delivered", enabled: false },
    ]);

    const toggleStatus = (id) => {
        setFlows(flows.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    return (
        <div className="w-full h-full flex flex-col p-6">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Flow Name</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                            <th className="py-4 px-6 text-sm font-medium text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="space-y-4">
                        {flows.map((flow) => (
                            <tr key={flow.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 px-6 text-[15px] text-slate-500 font-medium">{flow.name}</td>
                                <td className="py-6 px-6">
                                    <button 
                                        onClick={() => toggleStatus(flow.id)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${flow.enabled ? 'bg-[#25D366]' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flow.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="py-6 px-6">
                                    <div className="flex items-center justify-end gap-4 text-slate-300">
                                        <button className="hover:text-slate-600 transition-colors" title="Edit Flow">
                                            <Pencil size={18} />
                                        </button>
                                        <button className="hover:text-slate-600 transition-colors" title="Analytics">
                                            <BarChart2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StoreSetupTab = ({ integration, setIntegration }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white border-transparent">
            <div className="max-w-2xl w-full text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect Your Store</h2>
                <p className="text-slate-500 mb-10">Select your e-commerce platform to start sending automated WhatsApp notifications for orders and abandoned carts.</p>

                <div className="grid grid-cols-2 gap-6">
                    {/* Shopify Card */}
                    <div 
                        onClick={() => setIntegration('shopify')}
                        className={`bg-white border ${integration === 'shopify' ? 'border-[#95BF47] ring-1 ring-[#95BF47] shadow-md' : 'border-slate-200'} rounded-2xl p-8 hover:border-[#95BF47] hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center relative`}
                    >
                        {integration === 'shopify' && (
                            <div className="absolute top-6 right-6 text-[#95BF47]">
                                <CheckCircle size={20} />
                            </div>
                        )}
                        <div className="w-20 h-20 bg-[#95BF47]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden">
                            <img src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Shopify%20Logo.png" alt="Shopify" className="w-16 h-16 object-contain" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Shopify</h3>
                        <p className="text-sm text-slate-500 mb-6">Connect your Shopify store to sync products and automate cart recovery.</p>
                        <button className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${integration === 'shopify' ? 'bg-[#95BF47] text-white' : 'bg-slate-900 text-white group-hover:bg-[#95BF47]'}`}>
                            {integration === 'shopify' ? 'Connected' : 'Connect Shopify'} {integration !== 'shopify' && <ArrowRight size={16} />}
                        </button>
                    </div>

                    {/* WooCommerce Card */}
                    <div 
                        onClick={() => setIntegration('woocommerce')}
                        className={`bg-white border ${integration === 'woocommerce' ? 'border-[#96588a] ring-1 ring-[#96588a] shadow-md' : 'border-slate-200'} rounded-2xl p-8 hover:border-[#96588a] hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center relative`}
                    >
                        {integration === 'woocommerce' && (
                            <div className="absolute top-6 right-6 text-[#96588a]">
                                <CheckCircle size={20} />
                            </div>
                        )}
                        <div className="w-20 h-20 bg-[#96588a]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform overflow-hidden">
                            <img src="https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Woo%20commerce%20logo.png" alt="WooCommerce" className="w-16 h-16 object-contain" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">WooCommerce</h3>
                        <p className="text-sm text-slate-500 mb-6">Link your WooCommerce site to trigger order confirmations and updates.</p>
                        <button className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${integration === 'woocommerce' ? 'bg-[#96588a] text-white' : 'bg-slate-900 text-white group-hover:bg-[#96588a]'}`}>
                            {integration === 'woocommerce' ? 'Connected' : 'Connect WooCommerce'} {integration !== 'woocommerce' && <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShopifyCheckoutsTab = () => {
    const [selectedCheckout, setSelectedCheckout] = useState('shopify');

    const checkouts = [
        { id: 'shopify', name: 'Shopify Checkout', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Shopify%20Logo.png', color: '#95BF47', desc: 'The default Shopify checkout ensures smooth, secure payments for a seamless and trustworthy purchasing experience.' },
        { id: 'razorpay', name: 'Razorpay Magic Checkout', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Razor%20Pay%20Logo%20.png', color: '#3395FF', desc: 'Razorpay magic checkout is a 5X faster & 10X smarter checkout experience your customers deserve!' },
        { id: 'gokwik', name: 'Gokwik', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Go%20kwik%20Logo.png', color: '#FF5722', desc: 'Optimize your checkout experience and boost conversion rates with Gokwik.' },
        { id: 'shiprocket', name: 'Shiprocket Checkout', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Ship%20Rocket%20Checkout%20.png', color: '#7367F0', desc: 'Shiprocket Checkout formerly Fastrr offers fast checkout option with fewer clicks.' },
        { id: 'goswift', name: 'Go Swift', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Go%20Swift%20Logo.png', color: '#28C76F', desc: 'Go Swift is a checkout for smarter, better and cheaper business sales along with a great customer experience.' },
        { id: 'breeze', name: 'Breeze', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Breeze%20Logo.png', color: '#00CFE8', desc: 'Lightning fast checkout experience to maximize your revenue.' },
        { id: 'ecom360', name: 'Ecom360', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Ecom%20360%20Logo.png', color: '#EA5455', desc: 'A comprehensive checkout solution tailored for growing D2C brands.' },
        { id: 'simpl', name: 'Simpl', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Simpl%20Logo.png', color: '#00D1B2', desc: 'Enable 1-tap checkout and pay-later options for your customers.' },
        { id: 'shopflow', name: 'Shop Flow', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Shopflo.png', color: '#4F46E5', desc: 'Streamline your purchase flow and reduce cart abandonment.' },
        { id: 'flexype', name: 'Flexy Pe', logo: 'https://cjlngemrulrgmlhixjbs.supabase.co/storage/v1/object/public/brand-assets/Jusbot-Default%20Asset/Flexy%20Pe%20Logo.png', color: '#F59E0B', desc: 'Flexible payment options built to increase your checkout conversions.' },
    ];

    return (
        <div className="w-full h-full flex flex-col p-8 overflow-y-auto bg-slate-50">
            <div className="max-w-5xl w-full mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Shopify Checkouts</h2>
                    <p className="text-slate-500">Select your preferred checkout partner to handle payments seamlessly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {checkouts.map((checkout) => (
                        <div 
                            key={checkout.id}
                            onClick={() => setSelectedCheckout(checkout.id)}
                            className={`bg-white border ${selectedCheckout === checkout.id ? 'border-[#25D366] ring-1 ring-[#25D366]' : 'border-slate-200'} rounded-2xl p-6 hover:border-[#25D366] hover:shadow-lg transition-all cursor-pointer relative flex flex-col h-full`}
                        >
                            {/* Radio button */}
                            <div className="absolute top-6 right-6">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCheckout === checkout.id ? 'border-[#25D366]' : 'border-slate-300'}`}>
                                    {selectedCheckout === checkout.id && <div className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />}
                                </div>
                            </div>
                            
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 shrink-0 overflow-hidden bg-white border border-slate-100 shadow-sm">
                                <img 
                                    src={checkout.logo || `https://logo.clearbit.com/${checkout.domain}`} 
                                    alt={checkout.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div 
                                    className="hidden w-full h-full items-center justify-center text-white font-bold text-lg" 
                                    style={{ backgroundColor: checkout.color }}
                                >
                                    {checkout.name.charAt(0)}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-700 mb-2">{checkout.name}</h3>
                            <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">{checkout.desc}</p>
                            
                            <button className="text-sm font-semibold text-[#25D366] flex items-center gap-1 hover:gap-2 transition-all mt-auto w-max">
                                Know More <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function WhatsAppStore() {
    const [integration, setIntegration] = useState(null); // 'shopify' or 'woocommerce'
    const [activeTab, setActiveTab] = useState("store_setup");

    const SIDEBAR_GROUPS = [
        {
            title: "Setup",
            items: [
                { id: "store_setup", label: "Store Setup", icon: ShoppingBag },
                { id: "setup_messages", label: "Setup Messages", icon: MessageSquare },
                ...(integration === 'shopify' ? [{ id: "checkouts", label: "Shopify Checkouts", icon: Banknote }] : []),
            ]
        },
        {
            title: "Flows",
            items: [
                { id: "abandoned_cart", label: "Abandoned Cart Flow", icon: ShoppingCart },
                { id: "cod_flow", label: "COD Flow", icon: CheckCircle },
                { id: "order_flow", label: "Order Flow", icon: Package },
            ]
        }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shadow-sm">
                        <ShoppingBag fill="white" stroke="white" size={16} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 leading-tight">
                            {integration ? (integration === 'shopify' ? 'Shopify' : 'WooCommerce') : 'Store'} Integration
                        </h1>
                        <p className="text-xs text-slate-400 leading-tight">Manage your store connections and automated flows</p>
                    </div>
                </div>
                {integration && (
                    <button 
                        onClick={() => setIntegration(null)}
                        className="text-sm text-slate-500 hover:text-slate-800 font-semibold"
                    >
                        Switch Platform
                    </button>
                )}
            </header>

            {/* Body: Inner Sidebar + Content */}
            <div className="flex flex-1 min-h-0 bg-white">
                {/* Inner Sidebar */}
                <aside className="w-64 bg-white border-r border-slate-100 flex flex-col py-4 shrink-0 overflow-y-auto">
                    {SIDEBAR_GROUPS.map((group, groupIdx) => (
                        <div key={group.title} className={groupIdx > 0 ? "mt-6" : ""}>
                            <div className="flex items-center justify-between px-6 mb-2">
                                <h3 className="text-[15px] font-medium text-slate-800">{group.title}</h3>
                                <ChevronUp size={16} className="text-slate-400" />
                            </div>
                            <div className="flex flex-col px-3 space-y-0.5">
                                {group.items.map(item => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                                                isActive
                                                    ? "bg-[#edf7f4] text-[#0f5c4e]"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <Icon size={18} className={isActive ? "text-[#0f5c4e]" : "text-slate-800"} strokeWidth={isActive ? 2.5 : 2} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* Content area */}
                <div className="flex-1 flex overflow-hidden bg-slate-50 p-8">
                    <div className={`bg-white border border-slate-200 rounded-2xl w-full h-full flex ${['abandoned_cart', 'cod_flow', 'order_flow', 'checkouts'].includes(activeTab) ? 'flex-col overflow-hidden' : 'items-center justify-center'}`}>
                        {activeTab === 'store_setup' ? (
                            <StoreSetupTab integration={integration} setIntegration={setIntegration} />
                        ) : activeTab === 'checkouts' && integration === 'shopify' ? (
                            <ShopifyCheckoutsTab />
                        ) : activeTab === 'abandoned_cart' ? (
                            <AbandonedCartTab />
                        ) : activeTab === 'cod_flow' ? (
                            <CODFlowTab />
                        ) : activeTab === 'order_flow' ? (
                            <OrderFlowTab />
                        ) : (
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{activeTab.replace('_', ' ')}</h2>
                                <p className="text-slate-500">Configuration panel for {activeTab.replace('_', ' ')} will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
