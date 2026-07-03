import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, RefreshCw, Eye, XCircle } from 'lucide-react';
import config from '../../config';

export default function ProductSync() {
    const { workspaceId } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [syncing, setSyncing] = useState(null);

    useEffect(() => {
        fetchData();
    }, [workspaceId]);

    const fetchData = async () => {
        try {
            // Get settings to verify catalog is connected
            const sRes = await fetch(`${config.API_BASE}/whatsapp-catalog/settings?workspaceId=${workspaceId}`);
            if (sRes.ok) setSettings(await sRes.json());

            // Mock fetch ecommerce products and join with whatsapp_catalog_product_mappings
            // Since we don't have a real ecommerce DB here, we simulate it via the mappings table for now.
            const { data } = await supabase.from('whatsapp_catalog_product_mappings').select('*').eq('workspace_id', workspaceId);
            if (data) setProducts(data);
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSync = async (productId) => {
        setSyncing(productId);
        try {
            // Fetch internal product details. Using dummy data for demonstration.
            const productData = {
                sku: `SKU-${productId.substring(0,6)}`,
                name: 'Sample Product',
                description: 'A great product to sell on WhatsApp',
                price: 19.99,
                currency: 'USD',
                stock: 10
            };

            const res = await fetch(`${config.API_BASE}/whatsapp-catalog/products/${productId}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    catalogId: settings?.catalog_id,
                    productData
                })
            });
            if (res.ok) {
                fetchData(); // Refresh row
            } else {
                const result = await res.json();
                alert(`Sync failed: ${result.error}`);
            }
        } catch(e) {
            alert(e.message);
        } finally {
            setSyncing(null);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'synced': return <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-xs font-medium"><CheckCircle size={12}/> Synced</span>;
            case 'sync_failed': return <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-medium"><AlertTriangle size={12}/> Failed</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-medium"><XCircle size={12}/> Rejected</span>;
            default: return <span className="flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">Not Synced</span>;
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (!settings?.catalog_id) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <AlertTriangle className="text-yellow-500 mx-auto mb-4" size={32} />
                    <h3 className="text-lg font-bold text-slate-800">Catalog Not Connected</h3>
                    <p className="text-slate-500 mt-2">You need to connect a Meta Catalog in Commerce Settings before syncing products.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">Product Sync</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage which ecommerce products are available in your WhatsApp Catalog.</p>
                </div>
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm flex items-center gap-2">
                    <RefreshCw size={18} /> Bulk Sync All
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="px-6 py-4 font-medium">Product / SKU</th>
                                <th className="px-6 py-4 font-medium">Availability</th>
                                <th className="px-6 py-4 font-medium">WhatsApp Sync Status</th>
                                <th className="px-6 py-4 font-medium">Last Synced</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-16 text-slate-500">No products mapped yet. Import products from ecommerce.</td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{p.product_retailer_id}</div>
                                        <div className="text-xs text-slate-400 mt-1">ID: {p.internal_product_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${p.availability === 'in stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.availability}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(p.sync_status)}
                                        {p.rejection_reason && <div className="text-xs text-red-500 mt-1 max-w-xs">{p.rejection_reason}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {p.last_synced_at ? new Date(p.last_synced_at).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleSync(p.internal_product_id)}
                                            disabled={syncing === p.internal_product_id}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                                        >
                                            {syncing === p.internal_product_id ? 'Syncing...' : 'Sync Now'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
