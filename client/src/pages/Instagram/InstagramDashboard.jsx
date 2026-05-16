import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import { 
  Instagram, BarChart3, Image as ImageIcon, MessageSquare, Send, 
  Search, Hash, AtSign, Users, ShoppingBag, Upload, AlertTriangle,
  RefreshCw
} from 'lucide-react';
import LottieLoader from '../../components/LottieLoader';

// Sub-components (could be in separate files)
import AccountOverview from './components/AccountOverview';
import MediaManagement from './components/MediaManagement';
import CommentAutomation from './components/CommentAutomation';
import PrivateReplyAutomation from './components/PrivateReplyAutomation';
import BusinessDiscovery from './components/BusinessDiscovery';
import HashtagSearch from './components/HashtagSearch';
import MentionsListener from './components/MentionsListener';
import CollaborationInvites from './components/CollaborationInvites';
import InsightsDashboard from './components/InsightsDashboard';
import ProductTagging from './components/ProductTagging';
import ContentPublishing from './components/ContentPublishing';
import CopyrightCheck from './components/CopyrightCheck';


export default function InstagramDashboard() {
  const { workspaceId } = useParams();
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await authFetch(`${config.API_BASE}/instagram/overview/details/${workspaceId}`);
        const data = await res.json();
        setAccount(data);
      } catch (err) {
        console.error('Failed to fetch IG account', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [workspaceId]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'media', name: 'Media', icon: ImageIcon },
    { id: 'comments', name: 'Comments', icon: MessageSquare },
    { id: 'private_reply', name: 'Auto DM', icon: Send },
    { id: 'discovery', name: 'Discovery', icon: Search },
    { id: 'hashtag', name: 'Hashtags', icon: Hash },
    { id: 'mentions', name: 'Mentions', icon: AtSign },
    { id: 'collab', name: 'Collaboration', icon: Users },
    { id: 'insights', name: 'Analytics', icon: BarChart3 },
    { id: 'tagging', name: 'Shopping', icon: ShoppingBag },
    { id: 'publishing', name: 'Publish', icon: Upload },
    { id: 'copyright', name: 'Copyright', icon: AlertTriangle },
  ];

  if (loading) {
    return <LottieLoader size={250} message="Loading Instagram..." />;
  }

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Tab Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-100">
              <Instagram className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">IG Account</h2>
              <p className="text-xs text-slate-400">@{account?.username || 'user'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === tab.id 
                  ? 'bg-pink-50 text-pink-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-pink-500' : ''} />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Sora', sans-serif" }}>
              {tabs.find(t => t.id === activeTab)?.name}
            </h1>
            <p className="text-slate-400 text-sm">Manage and automate your Instagram presence</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={14} />
            Sync Data
          </button>
        </header>

        <main className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm min-h-[70vh]">
          {activeTab === 'overview' && <AccountOverview account={account} />}
          {activeTab === 'media' && <MediaManagement workspaceId={workspaceId} igUserId={account?.id} />}
          {activeTab === 'comments' && <CommentAutomation />}
          {activeTab === 'private_reply' && <PrivateReplyAutomation />}
          {activeTab === 'discovery' && <BusinessDiscovery />}
          {activeTab === 'hashtag' && <HashtagSearch />}
          {activeTab === 'mentions' && <MentionsListener />}
          {activeTab === 'collab' && <CollaborationInvites />}
          {activeTab === 'insights' && <InsightsDashboard />}
          {activeTab === 'tagging' && <ProductTagging />}
          {activeTab === 'publishing' && <ContentPublishing />}
          {activeTab === 'copyright' && <CopyrightCheck />}
        </main>
      </div>
    </div>
  );
}
