import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Send, Smartphone } from 'lucide-react';
import { useParams } from 'react-router-dom';
import config from '../../config';

export default function ProductMessages() {
    const { workspaceId } = useParams();
    const [products, setProducts] = useState([]);
    const [settings, setSettings] = useState(null);
    
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [sending, setSending] = useState(false);
    
    useEffect(() => {
        fetchData();
    }, [workspaceId]);

    const fetchData = async () => {
        try {
            const sRes = await fetch(`${config.API_BASE}/whatsapp-catalog/settings?workspaceId=${workspaceId}`);
            if (sRes.ok) setSettings(await sRes.json());

            const { data } = await supabase.from('whatsapp_catalog_product_mappings').select('*').eq('workspace_id', workspaceId).eq('sync_status', 'synced');
            if (data) setProducts(data);
        } catch(e) { console.error(e); }
    };

    const handleSend = async () => {
        if (!phoneNumber || !selectedProduct) return alert('Phone number and product are required.');
        setSending(true);
        try {
            const productMapping = products.find(p => p.id === selectedProduct);
            
            const res = await fetch(`${config.API_BASE}/whatsapp-catalog/messages/single-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    to: phoneNumber,
                    catalogId: settings?.catalog_id,
                    productRetailerId: productMapping.product_retailer_id
                })
            });

            if (res.ok) {
                alert('Product message sent successfully!');
                setPhoneNumber('');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch(e) {
            alert(e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto flex gap-8">
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-lg">Send Product Message</h3>
                        <p className="text-sm text-slate-500 mt-1">Send a synced catalog item directly to a customer's WhatsApp.</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Phone Number</label>
                            <input 
                                type="text" 
                                value={phoneNumber} 
                                onChange={e => setPhoneNumber(e.target.value)}
                                placeholder="+1234567890"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Product</label>
                            <select 
                                value={selectedProduct} 
                                onChange={e => setSelectedProduct(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="">-- Choose a synced product --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.product_retailer_id} ({p.availability})</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleSend}
                                disabled={sending || !selectedProduct || !phoneNumber}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Send size={18} /> {sending ? 'Sending...' : 'Send Single Product'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="w-[320px] shrink-0 border-[8px] border-slate-800 rounded-[3rem] h-[600px] bg-slate-50 relative overflow-hidden flex flex-col shadow-2xl">
                    <div className="absolute top-0 w-full h-6 bg-slate-800 rounded-b-2xl z-10 flex justify-center">
                        <div className="w-16 h-4 bg-slate-900 rounded-full mt-1"></div>
                    </div>
                    <div className="bg-[#075e54] text-white p-4 pt-8 flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">Your Business</div>
                            <div className="text-[10px] text-white/80">Active now</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-4 bg-[#e5ddd5] overflow-y-auto space-y-4">
                        <div className="bg-white rounded-lg p-1 shadow-sm max-w-[85%] self-start rounded-tl-none">
                            <div className="bg-slate-200 w-full h-32 rounded flex items-center justify-center">
                                <span className="text-slate-400 text-xs font-semibold uppercase">Product Image</span>
                            </div>
                            <div className="p-2 pb-1">
                                <div className="font-bold text-slate-800 text-sm">Product Name</div>
                                <div className="text-slate-500 text-xs mt-1">Check out this amazing product from our catalog.</div>
                                <div className="text-slate-800 font-bold text-sm mt-2">$19.99</div>
                            </div>
                            <div className="border-t border-slate-100 mt-2 p-2 text-center text-blue-500 text-sm font-semibold">
                                View Product
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
