'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FileText, LogOut, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted || !user) return null;

  const navLinks = [
    { href: "/dashboard", label: "Documents", icon: FileText },
    { href: "/chat", label: "AI Chat", icon: FileText }, // Should probably be MessageSquare but I'll keep FileText to match previous design or just change it
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-[60] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-10">
          <Link href="/dashboard" className="flex items-center gap-2 font-extrabold text-xl md:text-2xl text-blue-600 tracking-tight">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200"
            >
              <FileText size={22} strokeWidth={2.5} />
            </motion.div>
            <span className="hidden sm:inline">DocIntel</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 rounded-lg transition-all hover:bg-white hover:shadow-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-full border border-slate-200/50">
            <User size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700 tracking-wide uppercase truncate max-w-[100px]">{user.name}</span>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="hidden sm:flex p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </motion.button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] md:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[80] shadow-2xl p-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-extrabold text-blue-600 text-lg">Menu</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-8">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full p-4 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-bold transition-all text-sm"
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <User size={18} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 truncate">{user.name}</span>
                </div>
                <button 
                   onClick={logout}
                   className="flex items-center gap-3 w-full p-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all text-sm"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
