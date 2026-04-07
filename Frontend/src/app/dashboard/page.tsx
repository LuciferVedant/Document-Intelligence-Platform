'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Upload, File, Trash2, Loader2, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/docs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDocs();
    
    // Poll for status updates
    const interval = setInterval(() => {
      if (token) fetchDocs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('http://localhost:5001/api/docs/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5001/api/docs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
          <p className="text-gray-500 mt-1">Manage and process your documents for AI analysis</p>
        </div>
        <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer">
          <Plus size={20} />
          Upload New
          <input 
            type="file" 
            className="hidden" 
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            accept=".pdf,.docx,.pptx"
          />
        </label>
      </div>

      <div 
        className={cn(
          "relative group mb-12 border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center text-center",
          dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50/50"
        )}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
          <Upload size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Drag & Drop Documents</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
          Support for PDF, DOCX, and PPTX up to 50MB. Processed documents will be available for AI chat.
        </p>
        
        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10 transition-all">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
            <p className="text-sm font-bold text-gray-700">Uploading Document...</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div key={doc._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:shadow-gray-100 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  doc.fileType.includes('pdf') ? "bg-red-50 text-red-600" : 
                  doc.fileType.includes('word') ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                )}>
                  <File size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(doc._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all md:opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h4 className="font-bold text-gray-900 truncate mb-1" title={doc.fileName}>{doc.fileName}</h4>
              <p className="text-xs text-gray-400 mb-4">
                {format(new Date(doc.createdAt), 'MMM dd, yyyy • p')}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  {doc.status === 'completed' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle size={14} />
                      Ready
                    </div>
                  ) : doc.status === 'processing' ? (
                    <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
                      <Loader2 size={14} className="animate-spin" />
                      Processing
                    </div>
                  ) : doc.status === 'error' ? (
                    <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle size={14} />
                      Failed
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <Clock size={14} />
                      Pending
                    </div>
                  )}
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium uppercase">
                  {(doc.metadata.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          ))}
          
          {docs.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-400 italic">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
