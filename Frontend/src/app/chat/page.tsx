'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Send, User, Bot, Loader2, Info, ChevronRight, FileText, Search, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: {
    docId: string;
    docName: string;
    snippet: string;
  }[];
}

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
}

export default function ChatPage() {
  const { token, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChats = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadChat = async (id: string) => {
    setCurrentChatId(id);
    try {
      const res = await axios.get(`http://localhost:5001/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchChats();
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { 
        role: 'user', 
        content: input, 
        timestamp: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5001/api/chat/ask', {
        query: input,
        chatId: currentChatId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: res.data.answer,
        timestamp: new Date().toISOString(),
        citations: res.data.citations
      };

      setMessages(prev => [...prev, aiMessage]);
      if (!currentChatId) {
        setCurrentChatId(res.data.chatId);
        fetchChats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-50 flex flex-col gap-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
          >
            <PlusCircle size={18} />
            New Analysis
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search history..." 
                className="w-full bg-gray-50 pl-10 pr-4 py-2 rounded-xl text-sm border border-transparent focus:border-blue-200 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {historyLoading ? (
            <div className="flex justify-center py-10 text-gray-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden",
                currentChatId === chat._id ? "bg-blue-50/80 border border-blue-100/50" : "hover:bg-gray-50 border border-transparent"
              )}
            >
              <h4 className={cn(
                "text-sm font-bold truncate pr-6",
                currentChatId === chat._id ? "text-blue-700" : "text-gray-700"
              )}>{chat.title}</h4>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-1">
                {new Date(chat.messages[0]?.timestamp || Date.now()).toLocaleDateString()}
              </p>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-gray-300">
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg text-white">
                <Bot size={20} />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-900 leading-none">Flash Intelligence</p>
                <p className="text-[10px] text-gray-500 font-medium">Powered by Gemini Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-gray-50/50 relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-8 flex flex-col custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <div className="p-6 bg-white shadow-xl shadow-gray-100/50 rounded-[40px] mb-6">
                <Bot size={48} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How can I help you?</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Select a conversation or start a new one to deep dive into your knowledge base.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
                {['Summarize my documents', 'Find key findings', 'Explain the technical specs', 'Compare results'].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50/50 transition-all text-xs font-bold text-gray-700 text-left">
                        {q}
                    </button>
                ))}
              </div>
            </div>
          ) : messages.map((m, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-4 max-w-4xl mx-auto w-full group animate-in fade-in slide-in-from-bottom-4 duration-500",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white",
                m.role === 'user' ? "bg-gray-800" : "bg-blue-600"
              )}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={cn(
                "flex flex-col gap-3",
                m.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-5 rounded-[24px] text-sm leading-relaxed",
                  m.role === 'user' ? "bg-white text-gray-900 border border-gray-100 shadow-xl shadow-gray-100/50 rounded-tr-none" : "bg-blue-600 text-white shadow-xl shadow-blue-100 rounded-tl-none"
                )}>
                  {m.content}
                </div>
                
                {m.citations && m.citations.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in duration-300">
                    {m.citations.map((c, j) => (
                      <div 
                        key={j} 
                        className="group/cit flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default"
                        title={c.snippet}
                      >
                        <FileText size={12} className="text-blue-500" />
                        Source {j + 1}
                        <div className="w-0 group-hover/cit:w-16 overflow-hidden transition-all whitespace-nowrap opacity-0 group-hover/cit:opacity-100 font-medium text-gray-400">
                            View context
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4 max-w-4xl mx-auto w-full animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 shrink-0" />
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                <div className="h-4 bg-gray-200 rounded-full w-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-gray-50 to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative group"
          >
            <input 
              type="text" 
              placeholder="Ask anything about your documents..." 
              className="w-full bg-white border border-gray-200 rounded-3xl pl-6 pr-14 py-5 shadow-2xl shadow-gray-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 text-sm font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all disabled:opacity-40 shadow-lg shadow-blue-200"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="max-w-4xl mx-auto text-center mt-3 flex items-center justify-center gap-1.5 opacity-40">
            <Info size={12} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Secure & Isolated Data Processing</p>
          </div>
        </div>
      </main>
    </div>
  );
}
