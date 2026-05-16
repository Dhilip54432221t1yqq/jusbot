import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, ExternalLink, Play, Layers } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import config from '../../../config';

export default function MediaManagement({ workspaceId, igUserId }) {
  const { authFetch } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await authFetch(`${config.API_BASE}/instagram/media/${igUserId}`);
        const data = await res.json();
        setMedia(data);
      } catch (err) {
        console.error('Failed to fetch media', err);
      } finally {
        setLoading(false);
      }
    };
    if (igUserId) fetchMedia();
  }, [igUserId]);

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-40 bg-slate-100 rounded-2xl"></div>
    <div className="grid grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-slate-100 rounded-xl"></div>)}
    </div>
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="font-bold text-slate-800">Your Recent Posts</h3>
        <div className="flex gap-2">
          {['All', 'Image', 'Video', 'Carousel'].map(filter => (
            <button key={filter} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-pink-300 transition-all">
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {media.map((item) => (
          <div key={item.id} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="relative aspect-square">
              {item.media_type === 'VIDEO' ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <Play className="text-white fill-white" size={48} />
                  <video src={item.media_url} className="absolute inset-0 w-full h-full object-cover opacity-60" muted />
                </div>
              ) : (
                <img src={item.media_url} alt={item.caption} className="w-full h-full object-cover" />
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Heart size={20} fill="white" />
                  <span>{item.like_count}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-bold">
                  <MessageCircle size={20} fill="white" />
                  <span>{item.comments_count}</span>
                </div>
              </div>
              
              {item.media_type === 'CAROUSEL_ALBUM' && (
                <div className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg">
                  <Layers size={14} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem] mb-4 leading-relaxed italic">
                {item.caption || "No caption provided."}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
                <a 
                  href={item.permalink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-pink-500 hover:text-pink-600 transition-colors p-2 hover:bg-pink-50 rounded-lg"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
