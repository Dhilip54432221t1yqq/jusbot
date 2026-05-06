import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InstagramConnect() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/instagram/auth-url?workspaceId=${workspaceId}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Could not get authentication URL');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="p-12 text-center">
          <div className="bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-pink-100 animate-pulse">
            <Instagram className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Instagram for Business
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Connect your Instagram Business account to unlock powerful automation, analytics, and messaging tools.
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 justify-center">
              <AlertCircle size={20} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
            {[
              { title: 'Automation', desc: 'Auto-reply to comments and DMs based on keywords.' },
              { title: 'Insights', desc: 'Track reach, impressions, and engagement metrics.' },
              { title: 'Management', desc: 'Manage media, search hashtags, and discover businesses.' }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="text-green-500 mb-3" size={24} />
                <h3 className="font-bold text-slate-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-snug">{feature.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Facebook className="w-6 h-6" />
                <span>Connect via Facebook Login</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <p className="mt-6 text-sm text-slate-400">
            Requires an Instagram Business Account linked to a Facebook Page.
          </p>
        </div>
      </div>
    </div>
  );
}
