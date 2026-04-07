'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Upload, File, Trash2, Loader2, CheckCircle, Clock, AlertCircle, Plus, LayoutGrid, List } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Document {
  _id: string;
  fileName: string;
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  metadata: {
    size: number;
    error?: string;
  };
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchDocs = async () => {
    if (!token) return;
    try {
      const res = await api.get('/docs');
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && !token) {
      router.push('/login');
      return;
    }
    fetchDocs();
    
    // Poll for status updates
    const interval = setInterval(() => {
      fetchDocs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token, user, router]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/docs/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(`${file.name} uploaded successfully!`);
      fetchDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/docs/${id}`);
      toast.success('Document deleted');
      setDocs(docs.filter(d => d._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Document Library</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage and process your documents for AI analysis</p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="hidden sm:flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-slate-100 text-blue-600 shadow-inner" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-slate-100 text-blue-600 shadow-inner" : "text-slate-400 hover:text-slate-600")}
            >
              <List size={18} />
            </button>
          </div>
          
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer active:scale-95 text-sm">
            <Plus size={18} />
            <span>Upload New</span>
            <input 
                type="file" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                accept=".pdf,.docx,.pptx"
            />
          </label>
        </div>
      </div>

      <motion.div 
        animate={dragActive ? { scale: 1.01 } : { scale: 1 }}
        className={cn(
          "relative group mb-12 border-2 border-dashed rounded-[32px] p-8 md:p-14 transition-all-custom flex flex-col items-center justify-center text-center overflow-hidden",
          dragActive ? "border-blue-500 bg-blue-50/50 shadow-2xl shadow-blue-100 ring-8 ring-blue-500/5" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50"
        )}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <motion.div 
          animate={dragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
          className="p-5 md:p-6 bg-blue-600 text-white rounded-3xl mb-6 shadow-xl shadow-blue-200"
        >
          <Upload size={32} strokeWidth={2.5} />
        </motion.div>
        <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">Drop your documents here</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto font-medium">
          Supports PDF, DOCX, and PPTX up to 50MB. Processed docs will be ready for chat instantly.
        </p>

        <AnimatePresence>
            {uploading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center z-10 p-6"
            >
                <div className="relative w-16 h-16 mb-4">
                    <Loader2 className="animate-spin text-blue-600 absolute inset-0" size={64} strokeWidth={2} />
                    <Upload className="absolute inset-4 text-blue-400 animate-bounce" size={32} strokeWidth={2.5} />
                </div>
                <p className="text-base font-extrabold text-slate-900 tracking-tight">Optimizing & Uploading...</p>
                <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Handled securely</p>
            </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} strokeWidth={2.5} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Library</p>
        </div>
      ) : (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            )}
        >
          {docs.map((doc) => (
            <motion.div 
                key={doc._id} 
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className={cn(
                    "bg-white border border-slate-200 rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-slate-200/60 group relative overflow-hidden",
                    viewMode === 'list' && "flex items-center gap-4 py-4"
                )}
            >
              <div className={cn(
                "flex items-start justify-between mb-4",
                viewMode === 'list' && "mb-0 shrink-0"
              )}>
                <div className={cn(
                  "p-3 rounded-2xl shadow-sm",
                  doc.fileType.includes('pdf') ? "bg-rose-50 text-rose-600" : 
                  doc.fileType.includes('word') ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                )}>
                  <File size={28} strokeWidth={2.5} />
                </div>
                <button 
                  onClick={() => handleDelete(doc._id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all md:opacity-0 group-hover:opacity-100 absolute top-4 right-4"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-900 truncate mb-1 text-sm md:text-base pr-8" title={doc.fileName}>{doc.fileName}</h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-4">
                    {format(new Date(doc.createdAt), 'MMM dd • p')}
                </p>
              </div>
              
              <div className={cn(
                "flex items-center justify-between pt-4 border-t border-slate-50",
                viewMode === 'list' && "hidden sm:flex border-t-0 p-0 ml-auto gap-10"
              )}>
                <div className="flex items-center gap-2">
                  {doc.status === 'completed' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle size={12} strokeWidth={3} />
                      Ready
                    </div>
                  ) : doc.status === 'processing' ? (
                    <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                      <Loader2 size={12} className="animate-spin" />
                      Index
                    </div>
                  ) : doc.status === 'error' ? (
                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-extrabold uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg">
                      <AlertCircle size={12} />
                      Fail
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                      <Clock size={12} />
                      Wait
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                  {(doc.metadata.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </motion.div>
          ))}
          
          <AnimatePresence>
            {docs.length === 0 && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center flex flex-col items-center gap-4"
                >
                    <div className="p-8 bg-slate-100 rounded-[40px] text-slate-300">
                        <File size={64} strokeWidth={1} />
                    </div>
                    <div>
                        <p className="text-slate-900 font-extrabold text-lg">Your library is empty</p>
                        <p className="text-slate-400 text-sm mt-1">Start by uploading your first document</p>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
