import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import { parseCommand } from './lib/CommandParser';

export default function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [messages, setMessages] = useState([{
    id: '1',
    text: "Jemmah system active.",
    sender: 'bot' as const,
    timestamp: new Date()
  }]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSendMessage = (text: string) => {
    const userMsg = { id: Date.now().toString(), text, sender: 'user' as const, timestamp: new Date() };
    const parsed = parseCommand(text);
    
    if (parsed.type === 'reminder' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Jemmah Reminder', { body: parsed.confirmationMessage });
    }

    setMessages(prev => [...prev, userMsg, {
      id: (Date.now() + 1).toString(),
      text: parsed.confirmationMessage || "I've noted that for you.",
      sender: 'bot' as const,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-[#F5F0EB]">
      <Sidebar isOpen={true} setIsOpen={() => {}} currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-hidden">
        {currentView === 'chat' && <ChatInterface messages={messages} onSendMessage={handleSendMessage} />}
        {currentView === 'tasks' && <TaskManager />}
      </main>
    </div>
  );
}
