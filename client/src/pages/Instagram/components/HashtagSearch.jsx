import React, { useState } from 'react';
import { Hash, Search, Loader2, Heart, MessageCircle } from 'lucide-react';

export default function HashtagSearch() {
  const [hashtag, setHashtag] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    // Mock results
    setTimeout(() => {
      setResults([
        { id: '1', media_url: 'https://via.placeholder.com/300', likes: 1200, comments: 45 },
        { id: '2', media_url: 'https://via.placeholder.com/301', likes: 850, comments: 22 },
        { id: '3', media_url: 'https://via.placeholder.com/302', likes: 2100, comments: 110 },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Hashtag Search</h3>
        <p className="text-sm text-slate-400 mb-6">Discover top and recent media for any hashtag.</p>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
              placeholder="e.g. lifestyle, tech, photography"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={!hashtag || loading}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Explore'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {results.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
              <img src={item.media_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                  <Heart size={14} fill="white" />
                  <span>{item.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                  <MessageCircle size={14} fill="white" />
                  <span>{item.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
