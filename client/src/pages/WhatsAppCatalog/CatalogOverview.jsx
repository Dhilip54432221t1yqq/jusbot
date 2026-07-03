import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Package, RefreshCw, MessageSquare } from 'lucide-react';
import config from '../../config';

export default function CatalogOverview() {
    const { workspaceId } = useParams();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [workspaceId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-catalog/settings?workspaceId=${workspaceId}`);
            if (res.ok) setSettings(await res.json());
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const isConnected = settings && settings.waba_id && settings.catalog_id;

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">WhatsApp Catalog Commerce</h2>
                    <p className="text-slate-600 mt-2">
                        Turn your WhatsApp Business Account into a storefront. Sync your ecommerce inventory, send interactive product messages, and receive cart orders directly in WhatsApp.
                    </p>
                </div>

                {!isConnected ? (
                    <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Connect your Meta Catalog</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            To start selling on WhatsApp, you need to connect your WABA and an existing Meta Commerce Catalog.
                        </p>
                        <Link to={`/${workspaceId}/whatsapp/catalog/settings`} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition inline-block">
                            Configure Settings
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Package size={20} /></div>
                                <h3 className="font-semibold text-slate-700">Synced Products</h3>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-800">142</div>
                                <Link to={`/${workspaceId}/whatsapp/catalog/products`} className="text-sm text-indigo-600 hover:underline mt-2 inline-block">Manage inventory →</Link>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center"><ShoppingBag size={20} /></div>
                                <h3 className="font-semibold text-slate-700">Catalog Orders</h3>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-800">28</div>
                                <Link to={`/${workspaceId}/whatsapp/catalog/orders`} className="text-sm text-green-600 hover:underline mt-2 inline-block">View orders →</Link>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><MessageSquare size={20} /></div>
                                <h3 className="font-semibold text-slate-700">Product Inquiries</h3>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-800">12</div>
                                <span className="text-sm text-slate-500 mt-2 inline-block">Pending replies</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><RefreshCw size={20} /></div>
                                <h3 className="font-semibold text-slate-700">Last Sync</h3>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-slate-800">{settings?.last_sync_at ? new Date(settings.last_sync_at).toLocaleDateString() : 'Never'}</div>
                                <Link to={`/${workspaceId}/whatsapp/catalog/settings`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">View settings →</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
