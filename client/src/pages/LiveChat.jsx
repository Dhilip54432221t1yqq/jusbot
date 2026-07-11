import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Search, User, MoreVertical, CheckCheck, Instagram,
  Send, Paperclip, Smile, Tag, Info, MessageSquare, Plus, X
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import config from '../config';

const API_BASE_URL = `${config.API_URL}/api/livechat`;
const SOCKET_URL = config.API_URL;

const getChannelStyles = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('instagram')) return { icon: Instagram, color: 'bg-pink-100 text-pink-600', badge: 'bg-pink-50 text-pink-600', label: 'Instagram' };
  if (t.includes('whatsapp')) return { icon: MessageCircle, color: 'bg-green-100 text-green-600', badge: 'bg-green-50 text-green-600', label: 'WhatsApp Cloud' };
  if (t.includes('messenger')) return { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-600', label: 'Messenger' };
  return { icon: MessageCircle, color: 'bg-slate-100 text-slate-600', badge: 'bg-slate-50 text-slate-600', label: type || 'Chat' };
};

export default function LiveChat() {
  const { workspaceId } = useParams();
  const { authFetch } = useAuth();
  
  /** @type {[any[], React.Dispatch<React.SetStateAction<any[]>>]} */
  const [conversations, setConversations] = useState([]);
  /** @type {[any, React.Dispatch<React.SetStateAction<any>>]} */
  const [activeConversation, setActiveConversation] = useState(null);
  /** @type {[any[], React.Dispatch<React.SetStateAction<any[]>>]} */
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [channelFilter, setChannelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [searchContact, setSearchContact] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  /** @type {import('react').MutableRefObject<any>} */
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  // Use a ref to track active conversation inside socket callbacks (avoids stale closure)
  const activeConversationRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      loadConversations();
    }
  }, [workspaceId, filter, channelFilter]);

  // Initialize socket ONCE on mount — don't recreate on conversation change
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      console.log('[LiveChat] Socket connected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.warn('[LiveChat] Socket connection error:', err.message);
    });

    socketRef.current.on('new_message', (message) => {
      // Use ref so we always have the latest active conversation
      if (activeConversationRef.current && message.conversation_id === activeConversationRef.current.id) {
        setMessages(prev => [...prev, message]);
      }
      loadConversations();
    });

    socketRef.current.on('inbox_update', (data) => {
      if (data.workspaceId === workspaceId) {
        loadConversations();
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [workspaceId]); // Only workspaceId — NOT activeConversation

  useEffect(() => {
    if (activeConversation) {
      activeConversationRef.current = activeConversation;
      loadMessages(activeConversation.id);
      socketRef.current?.emit('join_conversation', activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const apiChannel = channelFilter === 'whatsapp' ? 'whatsapp_cloud' : channelFilter;
      const response = await authFetch(`${API_BASE_URL}/${workspaceId}/conversations?status=${filter}&channel=${apiChannel}`);
      const data = await response.json();
      setConversations(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setIsLoading(false);
    }
  };

  const loadMessages = async (id) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/conversations/${id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes?.data?.user?.id;
      
      if (!userId) {
        alert("You must be logged in to send messages.");
        return;
      }

      const messagePayload = {
        sender_type: 'agent',
        sender_id: userId,
        content: newMessage,
        message_type: 'text'
      };

      const response = await authFetch(`${API_BASE_URL}/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify(messagePayload)
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert("Failed to send message. Please check if the server is running.");
    }
  };

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await authFetch(`${config.API_URL}/api/contacts?workspace_id=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setContactsList(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingContacts(false);
  };

  const startNewChat = async (contact) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/${workspaceId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({ 
          contactId: contact.id, 
          channelType: contact.channel === 'whatsapp' ? 'whatsapp_cloud' : (contact.channel || 'whatsapp_cloud')
        })
      });
      if (res.ok) {
        const conv = await res.json();
        setActiveConversation(conv);
        setShowNewChatModal(false);
        loadConversations();
      } else {
        const errorData = await res.json();
        alert("Failed to start chat: " + (errorData.error || "Unknown error"));
        console.error("Backend error:", errorData);
      }
    } catch (e) {
      console.error("Network error:", e);
      alert("Failed to start chat: Network or server error");
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Inbox Panel (Left) */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Inbox</h2>
            <button 
              onClick={() => { setShowNewChatModal(true); loadContacts(); }}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['open', 'pending', 'resolved'].map((s) => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  filter === s 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Channel Filter Cards */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {['whatsapp', 'instagram', 'facebook'].map((channel) => {
              let isActive = channelFilter === channel;
              let bgClass = 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50';
              if (isActive) {
                if (channel === 'whatsapp') bgClass = 'bg-green-50 border-green-200 text-green-700';
                if (channel === 'instagram') bgClass = 'bg-pink-50 border-pink-200 text-pink-700';
                if (channel === 'facebook') bgClass = 'bg-blue-50 border-blue-200 text-blue-700';
              }
              return (
                <button 
                  key={channel}
                  onClick={() => setChannelFilter(isActive ? 'all' : channel)}
                  className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors border shadow-sm ${bgClass}`}
                >
                  {channel === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
                  {channel === 'instagram' && <Instagram className="w-5 h-5" />}
                  {channel === 'facebook' && <MessageSquare className="w-5 h-5" />}
                  <span className="capitalize">{channel}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-slate-400 text-sm italic">Loading...</div>
          ) : !Array.isArray(conversations) || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 p-6 text-center">
              <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button 
                key={conv?.id}
                onClick={() => setActiveConversation(conv)}
                className={`w-full p-4 flex gap-3 border-b border-slate-50 transition-colors text-left ${
                  activeConversation?.id === conv?.id ? 'bg-green-50 border-l-4 border-l-green-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 overflow-hidden relative">
                  {conv?.contacts?.avatar_url ? (
                    <img src={conv.contacts.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-bold">
                      {conv?.contacts?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 truncate text-sm">{conv?.contacts?.name || 'Unknown'}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{conv?.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1">{conv?.last_message || ''}</p>
                  <div className="flex gap-2">
                    {(() => {
                      const style = getChannelStyles(conv?.channel_type);
                      const Icon = style.icon;
                      return (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter flex items-center gap-1 ${style.badge}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {style.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Panel (Center) */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                  {activeConversation?.contacts?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{activeConversation?.contacts?.name || 'Contact'}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-500 font-medium">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <User   className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(Array.isArray(messages) ? messages : []).map((msg, i) => {
                const isAgent = msg.sender_type === 'agent' || msg.sender_type === 'bot';
                return (
                  <div key={msg.id || i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm relative ${
                        isAgent ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.content}
                        {msg.attachments?.map((att, idx) => (
                          <div key={idx} className="mt-2">
                            {att.type === 'image' ? (
                              <img src={att.url} alt="" className="rounded-lg max-w-full" />
                            ) : (
                              <div className="bg-slate-100 p-2 rounded flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-600 underline truncate">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isAgent && <CheckCheck className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col gap-2 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
                <textarea 
                  placeholder="Type your message here..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-2 resize-none h-20"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex justify-between items-center px-2 pb-1">
                  <div className="flex items-center gap-3 text-slate-400">
                    <button type="button" className="hover:text-slate-600 transition-colors"><Smile className="w-5 h-5" /></button>
                    <button type="button" className="hover:text-slate-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
                    <button type="button" className="hover:text-slate-600 transition-colors"><Tag className="w-5 h-5" /></button>
                  </div>
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md shadow-green-100"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200 mb-6">
              <MessageCircle className="w-12 h-12 text-green-500 opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">Select a conversation</h3>
            <p className="max-w-xs text-sm leading-relaxed">
              Choose a message from the list on the left to start chatting with your customers in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Details Panel (Right) */}
      {activeConversation && (
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-300">
          <div className="p-6 flex flex-col items-center text-center border-b border-slate-100">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl mb-4 flex items-center justify-center text-2xl font-bold text-slate-600 shadow-inner">
              {activeConversation?.contacts?.name?.charAt(0) || '?'}
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">{activeConversation?.contacts?.name || 'Contact'}</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">{activeConversation?.contacts?.email || 'No email provided'}</p>
            <div className="flex gap-2 w-full">
              <button className="flex-1 bg-slate-50 hover:bg-slate-100 py-2 rounded-xl text-xs font-bold text-slate-600 transition-colors border border-slate-200/50">Details</button>
              <button className="flex-1 bg-slate-800 hover:bg-slate-900 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-lg shadow-slate-200">Actions</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</h4>
                <Info className="w-4 h-4 text-slate-300" />
              </div>
              <ul className="space-y-4">
                <li className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Phone</span>
                  <span className="text-sm font-medium text-slate-700">{activeConversation?.contacts?.phone || 'N/A'}</span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Channel</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const style = getChannelStyles(activeConversation?.channel_type);
                      const Icon = style.icon;
                      return (
                        <>
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${style.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {style.label} {activeConversation?.channel_type === 'instagram' ? `(@${activeConversation?.metadata?.instagram_username || 'instagram'})` : ''}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tags</h4>
                <button className="text-green-600 hover:text-green-700 font-bold text-[10px] uppercase">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">New User</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">Support</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Start New Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search contacts by name or phone..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoadingContacts ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading contacts...</div>
              ) : (
                contactsList
                  .filter(c => 
                    (c.name || '').toLowerCase().includes(searchContact.toLowerCase()) || 
                    (c.phone || '').includes(searchContact)
                  )
                  .map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => startNewChat(c)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                        {c.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{c.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{c.phone || c.email || 'No contact info'}</div>
                      </div>
                      <div className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold uppercase">
                        {c.channel || 'chat'}
                      </div>
                    </button>
                  ))
              )}
              {!isLoadingContacts && contactsList.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">No contacts found in this workspace.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
