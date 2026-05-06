import React from 'react';
import { ShoppingBag, Tag, CheckCircle2, AlertCircle, ShoppingCart, Plus } from 'lucide-react';

export default function ProductTagging() {
  const eligible = true;
  const products = [
    { id: 1, name: 'Premium Coffee Beans', price: '$24.99', stock: 124, image: 'https://via.placeholder.com/80' },
    { id: 2, name: 'Ceramic Pour Over', price: '$45.00', stock: 12, image: 'https://via.placeholder.com/81' },
  ];

  return (
    <div className="space-y-8">
      <div className={`p-8 rounded-3xl border ${eligible ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'} flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${eligible ? 'bg-green-500 text-white shadow-green-100' : 'bg-amber-500 text-white shadow-amber-100'}`}>
            <ShoppingBag size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Instagram Shopping Status</h3>
            <p className="text-sm font-medium opacity-80">
              {eligible ? 'Your account is eligible for product tagging.' : 'Check your eligibility in Instagram Settings.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl font-bold text-sm shadow-sm">
          {eligible ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {eligible ? 'ELIGIBLE' : 'PENDING'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Tag size={18} className="text-pink-500" />
              Product Catalog
            </h4>
            <button className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
              <Plus size={14} /> Sync Catalog
            </button>
          </div>
          
          <div className="grid gap-3">
            {products.map((p) => (
              <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={p.image} className="w-14 h-14 rounded-xl object-cover" alt="" />
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs font-bold text-slate-400">{p.price}</span>
                      <span className="text-xs font-bold text-slate-400">• {p.stock} in stock</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-slate-800 transition-all">
                  TAG IN POST
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-6 text-slate-400">
            <ShoppingCart size={32} />
          </div>
          <h4 className="font-bold text-slate-800 mb-2">Shopping Analytics</h4>
          <p className="text-sm text-slate-400 mb-6">
            See which products are driving the most clicks and sales from your posts.
          </p>
          <button className="text-xs font-bold text-pink-500 hover:underline">
            View Shopping Insights
          </button>
        </div>
      </div>
    </div>
  );
}
