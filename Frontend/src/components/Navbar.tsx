'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FileText, MessageSquare, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <FileText size={20} />
          </div>
          DocIntel
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md transition-colors hover:bg-blue-50">
            Documents
          </Link>
          <Link href="/chat" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md transition-colors hover:bg-blue-50">
            AI Chat
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
          <User size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{user.name}</span>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
