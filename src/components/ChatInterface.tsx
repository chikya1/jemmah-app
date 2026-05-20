import React, { useState } from 'react';

export const ChatInterface = () => {
  const [input, setInput] = useState('');
  return (
    <div className="flex flex-col h-full bg-white p-4">
      <div className="flex-1 overflow-y-auto space-y-4"></div>
      <div className="border-t pt-4 flex items-center gap-2 pb-6">
        <button className="p-2 border rounded-full hover:bg-gray-100">📎</button>
        <input 
          className="flex-1 border rounded-lg p-3 bg-gray-50"
          placeholder="Message Jemmah..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="p-2 border rounded-full hover:bg-gray-100">🎤</button>
        <button className="bg-black text-white px-4 py-2 rounded-lg font-medium">Send</button>
      </div>
    </div>
  );
};
