'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Send, User, Bot, Loader2, Info, ChevronRight, FileText, Search, PlusCircle, Menu, X, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Markdown from '@/components/chat/Markdown';

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
  selectedDocIds?: string[];
}

interface Document {
    _id: string;
    fileName: string;
    chunkCount: number;
    status: string;
}

export default function ChatPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New States for Document Selection
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const CHUNK_THRESHOLD = 50;
  const currentTotalChunks = availableDocs
    .filter(d => selectedDocIds.includes(d._id))
    .reduce((sum, d) => sum + (d.chunkCount || 0), 0);

  const getSourceDocs = (citations?: Message['citations']) => {
    if (!citations) return [];
    const uniqueNames = Array.from(new Set(citations.map(c => c.docName)));
    return uniqueNames;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchChats = async () => {
    if (!token) return;
    try {
      const res = await api.get('/chat');
      setChats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchDocs = async () => {
    if (!token) return;
    setDocsLoading(true);
    try {
        const res = await api.get('/docs');
        setAvailableDocs(res.data.filter((d: any) => d.status === 'completed'));
    } catch (err) {
        console.error(err);
    } finally {
        setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
        fetchChats();
        fetchDocs();
    }
  }, [token]);

  const loadChat = async (id: string) => {
    setCurrentChatId(id);
    setIsSidebarOpen(false); // Close on mobile after selection
    try {
      const res = await api.get(`/chat/${id}`);
      setMessages(res.data.messages);
      setSelectedDocIds(res.data.selectedDocIds || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user && !token) {
      router.push('/login');
      return;
    }
  }, [token, user, router]);

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
      const res = await api.post('/chat/ask', {
        query: input,
        chatId: currentChatId,
        selectedDocIds
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
    setSelectedDocIds([]);
    setIsSidebarOpen(false);
    toast.success('Started new analysis session');
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChatToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/chat/${chatToDelete}`);
      setChats(prev => prev.filter(c => c._id !== chatToDelete));
      if (currentChatId === chatToDelete) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast.success('Analysis session deleted');
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete chat');
    } finally {
      setIsDeleting(false);
      setChatToDelete(null);
    }
  };

  if (!mounted || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 relative">
      {/* Sidebar Toggle (Mobile only) */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-24 left-4 z-40 p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 active:scale-90 transition-transform"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar / Drawer */}
      <AnimatePresence>
        {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
          <>
            {/* Overlay for mobile */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsSidebarOpen(false)}
               className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45]"
            />
            
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed md:relative w-80 h-full border-r border-slate-200 bg-white flex flex-col shrink-0 z-[50] shadow-2xl md:shadow-none"
            >
                <div className="p-6 border-b border-slate-50 flex flex-col gap-5">
                    <div className="md:hidden flex items-center justify-between mb-2">
                        <span className="font-extrabold text-slate-900">Analysis History</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                            <X size={20} />
                        </button>
                    </div>
                    <button 
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-bold transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
                    >
                        <PlusCircle size={20} strokeWidth={2.5} />
                        New Analysis
                    </button>
                    <div className="relative">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search discussions..." 
                            className="w-full bg-slate-100/50 pl-11 pr-4 py-3 rounded-2xl text-sm border-2 border-transparent focus:border-blue-200 focus:bg-white outline-none transition-all-custom font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {/* Chat History List */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Recent chats</span>
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-300">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : chats.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                            <div className="py-6 text-center opacity-40">
                                <p className="text-[10px] font-bold uppercase tracking-tighter">
                                    {searchQuery ? "No matching sessions" : "No past chats"}
                                </p>
                            </div>
                        ) : chats
                            .filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((chat) => (
                            <motion.button
                                key={chat._id}
                                whileHover={{ x: 4 }}
                                onClick={() => loadChat(chat._id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-2xl transition-all group relative overflow-hidden",
                                    currentChatId === chat._id ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "hover:bg-slate-50 border border-transparent text-slate-700"
                                )}
                            >
                                <h4 className={cn(
                                    "text-sm font-bold truncate pr-10",
                                    currentChatId === chat._id ? "text-white" : "text-slate-900 group-hover:text-blue-600 transition-colors"
                                )}>{chat.title}</h4>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button 
                                        onClick={(e) => deleteChat(e, chat._id)}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500",
                                            currentChatId === chat._id ? "text-white/60 hover:bg-white/20 hover:text-white" : "text-slate-400"
                                        )}
                                    >
                                        <Trash2 size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Document Selection Workspace */}
                    <div className="pt-4 border-t border-slate-50">
                        <div className="flex flex-col gap-1 px-2 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context Workspace</span>
                                <div className="text-[9px] font-black text-blue-600 bg-blue-50 py-0.5 rounded-md">
                                    {selectedDocIds.length} / {availableDocs.length} Docs
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-bold text-slate-400">Chunk Usage</span>
                                <span className={cn(
                                    "text-[9px] font-black",
                                    currentTotalChunks >= CHUNK_THRESHOLD ? "text-red-500" : "text-slate-500"
                                )}>
                                    {currentTotalChunks} / {CHUNK_THRESHOLD} Chunks
                                </span>
                            </div>
                            {/* Progress bar for chunks */}
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((currentTotalChunks / CHUNK_THRESHOLD) * 100, 100)}%` }}
                                    className={cn(
                                        "h-full transition-all",
                                        currentTotalChunks >= CHUNK_THRESHOLD ? "bg-red-500" : "bg-blue-500"
                                    )}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {docsLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" size={16} /></div>
                            ) : availableDocs.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic px-2">No processed docs found</p>
                            ) : availableDocs.map(doc => (
                                <div 
                                    key={doc._id} 
                                    onClick={() => {
                                        if (selectedDocIds.includes(doc._id)) {
                                            setSelectedDocIds(prev => prev.filter(id => id !== doc._id));
                                        } else {
                                            const docChunks = doc.chunkCount || 0;
                                            if (currentTotalChunks + docChunks > CHUNK_THRESHOLD) {
                                                toast.error(`Selection limit exceeded. Adding "${doc.fileName}" (${docChunks} chunks) would take you to ${currentTotalChunks + docChunks}/${CHUNK_THRESHOLD} chunks. Please remove another document first.`);
                                                return;
                                            }
                                            setSelectedDocIds(prev => [...prev, doc._id]);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer",
                                        selectedDocIds.includes(doc._id) 
                                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                                            : "bg-white border-transparent text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0",
                                        selectedDocIds.includes(doc._id) ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                                    )}>
                                        {selectedDocIds.includes(doc._id) && <PlusCircle size={10} className="text-white rotate-45" />}
                                    </div>
                                    <span className="text-[11px] font-bold truncate flex-1">{doc.fileName}</span>
                                    <span className="text-[9px] font-black opacity-40">{doc.chunkCount || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-5 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-3.5 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-100">
                            <Bot size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 leading-none tracking-tight">Intelligence v3</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Flash Core</p>
                        </div>
                    </div>
                </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-10 flex flex-col custom-scrollbar"
        >
          {messages.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center px-4"
            >
              <div className="p-8 bg-white shadow-2xl shadow-slate-200/50 rounded-[50px] mb-8 relative">
                <Bot size={56} className="text-blue-600" strokeWidth={1.5} />
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 bg-blue-100/50 rounded-[50px] -z-10 blur-2xl" 
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Start an Intelligent session</h2>
              <p className="text-sm md:text-base text-slate-500 mt-2 max-w-sm font-medium leading-relaxed">
                Connect with your document knowledge base for contextual insights and synthesis.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 w-full max-w-lg">
                {[
                    { q: 'Summarize key points', c: 'blue' },
                    { q: 'Find specific findings', c: 'indigo' },
                    { q: 'Technical deep dive', c: 'slate' },
                    { q: 'Compare multiple docs', c: 'emerald' }
                ].map(item => (
                    <motion.button 
                        key={item.q} 
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setInput(item.q)} 
                        className="p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-50/50 transition-all text-sm font-extrabold text-slate-800 text-left flex items-center justify-between"
                    >
                        <span>{item.q}</span>
                        <ChevronRight size={16} className="text-blue-500" />
                    </motion.button>
                ))}
              </div>
            </motion.div>
          ) : messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto w-full group",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white",
                m.role === 'user' ? "bg-slate-800" : "bg-blue-600 shadow-blue-200"
              )}>
                {m.role === 'user' ? <User size={20} strokeWidth={2.5} /> : <Bot size={22} strokeWidth={2.5} />}
              </div>
              
              <div className={cn(
                "flex flex-col gap-3 min-w-0 flex-1",
                m.role === 'user' ? "items-end ml-10" : "items-start mr-10"
              )}>
                <div className={cn(
                  "p-5 rounded-[28px] text-sm md:text-[15px] leading-relaxed font-medium shadow-md",
                  m.role === 'user' ? "bg-white text-slate-900 border border-slate-100 rounded-tr-[4px]" : "bg-blue-600 text-white rounded-tl-[4px]"
                )}>
                  {m.role === 'assistant' ? (
                    <Markdown content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
                
                {m.citations && m.citations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        <Search size={10} />
                        Connected Sources
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {getSourceDocs(m.citations).map((docName, j) => (
                        <motion.div 
                            key={j} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * j }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm hover:border-blue-400 transition-all cursor-default"
                        >
                            <FileText size={12} className="text-blue-500" />
                            {docName}
                        </motion.div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          <AnimatePresence>
            {loading && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-4 max-w-4xl mx-auto w-full"
                >
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
                        <Bot size={22} className="animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-2.5 w-full max-w-xs">
                        <div className="h-4 bg-slate-200 rounded-full w-full animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded-full w-2/3 animate-pulse" />
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-50 to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative flex items-center gap-3"
          >
            <div className="relative flex-1 group">
                <input 
                    type="text" 
                    placeholder="Engage with your document knowledge base..." 
                    className="w-full bg-white border-2 border-slate-100 rounded-[32px] pl-6 pr-14 py-5 shadow-2xl shadow-slate-200/40 focus:border-blue-400 focus:ring-8 focus:ring-blue-100/50 outline-none transition-all-custom placeholder:text-slate-400 text-sm md:text-base font-bold text-slate-800"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                />
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all disabled:opacity-40 disabled:grayscale shadow-xl shadow-blue-200"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} strokeWidth={2.5} />}
                </motion.button>
            </div>
          </form>
          <div className="max-w-4xl mx-auto text-center mt-4 hidden sm:flex items-center justify-center gap-1.5 opacity-30">
            <Info size={12} strokeWidth={3} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Encrypted Knowledge Processing</p>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
                <div className="p-8 md:p-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 shadow-inner">
                        <Trash2 size={40} strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Delete Analysis?</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        This action is permanent and will remove all contextual history for this session. Are you absolutely certain?
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                        <button 
                            disabled={isDeleting}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isDeleting}
                            onClick={confirmDelete}
                            className="flex-1 py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                "Confirm Delete"
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
