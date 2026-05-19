import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#F5F0EB]">
      {/* Scrollable Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-2xl rounded-2xl px-4 py-3 text-sm md:text-base ${
                msg.sender === 'user'
                  ? 'bg-[#7B1F4B] text-[#F5F0EB]'
                  : 'bg-[#0d0d0d] border border-[#2a2a2a] text-[#E5DFD9]'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
              <div className="text-[10px] text-[#9A8F8A] mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Input Interface Dock */}
      <div className="p-4 bg-[#0d0d0d] border-t border-[#2a2a2a]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command or assistant request..."
            className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#F5F0EB] placeholder-[#5A524E] focus:outline-none focus:border-[#7B1F4B]"
          />
          <button
            type="submit"
            className="bg-[#7B1F4B] hover:bg-[#922b5d] text-[#F5F0EB] px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
