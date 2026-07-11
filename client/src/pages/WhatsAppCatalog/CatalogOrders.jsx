import React, { useState, useEffect } from 'react';
import { supabase } from '../../db';
import { useParams } from 'react-router-dom';
import { ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import config from '../../config';

export default function CatalogOrders() {
    const { workspaceId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, [workspaceId]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${config.API_BASE}/whatsapp-catalog/orders?workspaceId=${workspaceId}`);
            if (res.ok) setOrders(await res.json());
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed': return <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-xs font-medium"><CheckCircle size={12}/> Completed</span>;
            case 'pending': return <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded text-xs font-medium"><Clock size={12}/> Pending</span>;
            default: return <span className="flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">{status}</span>;
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">Catalog Orders</h2>
                    <p className="text-sm text-slate-500 mt-1">View shopping cart orders submitted through WhatsApp.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="px-6 py-4 font-medium">Order ID</th>
                                <th className="px-6 py-4 font-medium">Customer Phone</th>
                                <th className="px-6 py-4 font-medium">Items</th>
                                <th className="px-6 py-4 font-medium">Total</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-16">
                                        <ShoppingBag size={32} className="mx-auto text-slate-300 mb-3" />
                                        <h3 className="text-lg font-medium text-slate-700">No orders yet</h3>
                                        <p className="text-slate-500 mt-1">When customers submit carts on WhatsApp, they will appear here.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                            {order.whatsapp_order_id || order.id.substring(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {order.phone_number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {order.items_json ? JSON.parse(order.items_json).length : 0} items
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {order.currency} {order.subtotal}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
