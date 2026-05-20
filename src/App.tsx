import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import FileVault from './components/FileVault';

export default function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const threadId = 'default-thread';

  return (
    <div className="flex h-screen w-screen bg-[#0d0d0d] text-[#F5F0EB] font-sans overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative z-40 h-full w-64 bg-[#0d0d0d] border-r border-[#2a2a2a] transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentView={currentView} setCurrentView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} />
      </div>
      <main className="flex-1 h-full flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#0d0d0d] shrink-0">
          <button className="md:hidden p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#F5F0EB]" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
          <img src="/jemmah-logo.png" alt="Jemmah" className="w-7 h-7 object-contain" />
          <h1 className="text-base font-semibold text-[#F5F0EB]">Jemmah</h1>
        </header>
        <div className="flex-1 overflow-hidden">
          {currentView === 'chat' && <ChatInterface threadId={threadId} />}
          {currentView === 'tasks' && <TaskManager />}
          {currentView === 'vault' && <FileVault />}
        </div>
      </main>
    </div>
  );
}
