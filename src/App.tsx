import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import FileVault from './components/FileVault';

export default function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const threadId = 'default-thread';
  const touchStartX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 60 && touchStartX.current < 40) setIsSidebarOpen(true);
    if (diff < -60) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-white text-[#0d0d0d] font-sans overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative z-40 h-full w-64 bg-[#0d0d0d] border-r border-[#2a2a2a] transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentView={currentView} setCurrentView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} />
      </div>
      {!isSidebarOpen && (
        <div
          className="fixed left-0 top-0 w-6 h-full z-50 md:hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}
      <main className="flex-1 h-full flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e5e5] bg-white shrink-0">
          <button className="md:hidden p-2 rounded-lg bg-[#f5f5f5] border border-[#e5e5e5] text-[#0d0d0d]" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
          <img src="/jemmah-logo.png" alt="Jemmah" className="w-7 h-7 object-contain" />
          <h1 className="text-base font-semibold text-[#0d0d0d]">Jemmah</h1>
        </header>
        <div className="flex-1 overflow-hidden">
          {currentView === 'chat' && <ChatInterface threadId={threadId} onNavigate={(view) => setCurrentView(view)} />}
          {currentView === 'tasks' && <TaskManager />}
          {currentView === 'vault' && <FileVault />}
        </div>
      </main>
    </div>
  );
}
