import React, { useState } from 'react';

export const ChatInterface = () => {
  const [input, setInput] = useState('');

  const handleAttach = () => alert("Attachment menu opening...");
  const handleVoice = () => alert("Voice recognition starting...");
  const handleSend = () => {
    if (input.trim()) {
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
        <img src="/jemmah-logo.png" alt="Jemmah" className="w-64 h-64 object-contain" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 z-10"></div>
      <div className="border-t pt-4 flex items-center gap-2 pb-6 px-4 z-10 bg-white">
        <button onClick={handleAttach} className="p-2 border rounded-full hover:bg-gray-100">📎</button>
        <input 
          className="flex-1 border rounded-lg p-3 bg-gray-50"
          placeholder="Message Jemmah..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleVoice} className="p-2 border rounded-full hover:bg-gray-100">🎤</button>
        <button onClick={handleSend} className="bg-black text-white px-4 py-2 rounded-lg font-medium">Send</button>
      </div>
    </div>
  );
};
