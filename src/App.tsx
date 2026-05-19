import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import { parseCommand } from './lib/CommandParser';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Jemmah, your private personal assistant. How can I assist you with your operations today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const parsed = parseCommand(text);
      let replyText = "I'm processing that information for you.";
      
      if (parsed.type !== 'unknown') {
        replyText = parsed.confirmationMessage;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }, 600);
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] overflow-hidden font-sans antialiased text-[#F5F0EB]">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-14 md:hidden flex items-center px-4 bg-[#0d0d0d] border-b border-[#2a2a2a] justify-between w-full z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-xl text-[#9A8F8A] hover:text-[#F5F0EB] focus:outline-none"
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <span className="text-md font-semibold tracking-wide text-[#7B1F4B]">Jemmah</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto relative w-full h-full">
          {currentView === 'chat' && (
            <ChatInterface messages={messages} onSendMessage={handleSendMessage} />
          )}
          {currentView === 'tasks' && <TaskManager />}
          {currentView === 'notes' && (
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-4 text-[#7B1F4B]">Local Vault Notes</h2>
              <p className="text-[#9A8F8A] text-sm">Your secure encrypted operational data workspace module.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
