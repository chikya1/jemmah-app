/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import FileVault from './components/FileVault';
import SearchOverlay from './components/SearchOverlay';
import { Search } from 'lucide-react';

type AppMode = 'chat' | 'tasks' | 'vault';

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('chat');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Request notifications permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (mode: AppMode, id?: string | number) => {
    setActiveMode(mode);
    if (mode === 'chat' && id) {
      setActiveThreadId(id.toString());
    }
    setIsSearchOpen(false);
  };

  const currentThreadId = activeThreadId || 'default-thread';

  return (
    <div className="flex h-screen w-full bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden">
      <Sidebar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        activeThreadId={activeThreadId}
        setActiveThreadId={setActiveThreadId}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 relative flex flex-col h-full">
        {/* Universal Search Trigger (Floating) */}
        {!isSearchOpen && (
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="absolute top-4 right-4 z-10 p-3 bg-white/80 backdrop-blur shadow-lg rounded-2xl border border-[#141414]/5 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group"
          >
            <div className="flex items-center gap-3">
              <Search size={18} />
              <span className="text-xs font-bold uppercase tracking-tight hidden md:inline">Quick Search</span>
              <kbd className="hidden md:inline-flex h-5 items-center px-1.5 rounded border border-current opacity-40 text-[10px]">⌘K</kbd>
            </div>
          </button>
        )}

        {activeMode === 'chat' && <ChatInterface threadId={currentThreadId} />}
        {activeMode === 'tasks' && <TaskManager />}
        {activeMode === 'vault' && <FileVault />}
      </main>

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={handleNavigate}
      />
    </div>
  );
}
