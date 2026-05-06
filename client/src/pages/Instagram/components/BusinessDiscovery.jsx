import React, { useState } from 'react';
import { Search, Loader2, Users, Image as ImageIcon, ExternalLink, Globe } from 'lucide-react';

export default function BusinessDiscovery() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    // Mock result for now
    setTimeout(() => {
      setResult({
        username: username,
        followers_count: 154200,
        media_count: 842,
        name: 'Tech Insider',
        profile_picture_url: 'https://via.placeholder.com/150'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Business Discovery</h3>
        <p className="text-sm text-slate-400 mb-6">Analyze other Instagram accounts by their username.</p>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Instagram username (e.g. apple)"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={!username || loading}
            className="bg-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-pink-100 hover:bg-pink-600 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
          </button>
        </div>
      </div>

      {result && (
        <div className="p-8 border border-slate-100 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <img src={result.profile_picture_url} className="w-20 h-20 rounded-full" alt="" />
              <div>
                <h4 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  @{result.username}
                  <CheckCircle size={16} className="text-blue-500" />
                </h4>
                <p className="text-slate-500 font-medium">{result.name}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">
              View on Instagram <ExternalLink size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <Users size={20} className="mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-slate-400 font-bold mb-1 uppercase tracking-tighter">Followers</p>
              <p className="text-xl font-black text-slate-800">{result.followers_count.toLocaleString()}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <ImageIcon size={20} className="mx-auto mb-2 text-purple-500" />
              <p className="text-sm text-slate-400 font-bold mb-1 uppercase tracking-tighter">Posts</p>
              <p className="text-xl font-black text-slate-800">{result.media_count.toLocaleString()}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <Globe size={20} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm text-slate-400 font-bold mb-1 uppercase tracking-tighter">Engagement</p>
              <p className="text-xl font-black text-slate-800">4.2%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
