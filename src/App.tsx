import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TaskManager from './components/TaskManager';

export default function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-white text-black font-sans">
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-64 border-r bg-gray-50`}>
        <Sidebar isOpen={true} setIsOpen={setIsSidebarOpen} currentView={currentView} setCurrentView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} />
      </div>
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="p-4 border-b flex justify-between items-center">
           <button className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
           <h1 className="text-xl font-bold">Ask Jemmah</h1>
        </header>
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none text-[200px] font-bold select-none">J</div>
        <div className="flex-1 overflow-auto">
          {currentView === 'chat' && <ChatInterface />}
          {currentView === 'tasks' && <TaskManager />}
        </div>
      </main>
    </div>
  );
}
