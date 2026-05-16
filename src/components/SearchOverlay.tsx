import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search as SearchIcon, X, MessageSquare, CheckSquare, Shield, ChevronRight } from 'lucide-react';
import { db, type Message, type Task, type VaultItem } from '../lib/LocalDB';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (mode: 'chat' | 'tasks' | 'vault', id?: string | number) => void;
}

export default function SearchOverlay({ isOpen, onClose, onNavigate }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  
  const results = useLiveQuery(async () => {
    if (query.length < 2) return null;
    const q = query.toLowerCase();

    const messages = await db.messages.filter(m => m.text.toLowerCase().includes(q)).limit(5).toArray();
    const tasks = await db.tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)).limit(5).toArray();
    const vault = await db.vault.filter(v => v.name.toLowerCase().includes(q)).limit(5).toArray();

    return { messages, tasks, vault };
  }, [query]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Handled by App
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleDown);
    return () => window.removeEventListener('keydown', handleDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#141414]/20 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-50 border border-[#141414]/10"
      >
        <div className="p-4 flex items-center gap-4 border-b border-[#141414]/5">
          <SearchIcon size={24} className="text-[#141414]/30" />
          <input
            autoFocus
            type="text"
            placeholder="Search messages, tasks, and files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder:text-[#141414]/20"
          />
          <kbd className="hidden md:flex h-6 items-center px-2 rounded-md bg-[#141414]/5 text-[10px] font-bold text-[#141414]/40 border border-[#141414]/10">ESC</kbd>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh] p-4 space-y-8">
          {results ? (
            <>
              {results.messages.length > 0 && (
                <div>
                  <SectionHeader icon={MessageSquare} label="Messages" />
                  <div className="space-y-1">
                    {results.messages.map(m => (
                      <ResultItem 
                        key={m.id} 
                        title={m.text} 
                        sub={format(m.timestamp, 'PP')} 
                        onClick={() => onNavigate('chat', m.threadId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <SectionHeader icon={CheckSquare} label="Tasks" />
                  <div className="space-y-1">
                    {results.tasks.map(t => (
                      <ResultItem 
                        key={t.id} 
                        title={t.title} 
                        sub={t.category} 
                        onClick={() => onNavigate('tasks', t.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.vault.length > 0 && (
                <div>
                  <SectionHeader icon={Shield} label="Files" />
                  <div className="space-y-1">
                    {results.vault.map(v => (
                      <ResultItem 
                        key={v.id} 
                        title={v.name} 
                        sub={v.type} 
                        onClick={() => onNavigate('vault', v.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!results.messages.length && !results.tasks.length && !results.vault.length && (
                <div className="py-12 text-center text-sm opacity-40">No results found for "{query}"</div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-sm opacity-40 italic">Type at least 2 characters to search...</div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function SectionHeader({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 mb-2 text-[10px] uppercase font-bold tracking-widest text-[#141414]/30">
      <Icon size={12} />
      <span>{label}</span>
    </div>
  );
}

function ResultItem({ title, sub, onClick }: { title: string, sub: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left p-3 rounded-2xl hover:bg-[#141414]/5 transition-all group flex items-center justify-between"
    >
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-[10px] opacity-40 font-bold uppercase mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-[#141414]/0 group-hover:text-[#141414]/20 transition-all" />
    </button>
  );
}
