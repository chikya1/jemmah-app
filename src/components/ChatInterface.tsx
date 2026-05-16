import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, File, Shield } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Message, type VaultItem } from '../lib/LocalDB';
import { parseCommand } from '../lib/CommandParser';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  threadId: string;
}

export default function ChatInterface({ threadId }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const messages = useLiveQuery(
    () => db.messages.where('threadId').equals(threadId).sortBy('timestamp'),
    [threadId]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);

    // 1. Save uploaded files to Vault
    const attachmentIds: number[] = [];
    for (const file of currentAttachments) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const vaultId = await db.vault.add({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'text',
        dataUrlOrBlob: base64,
        timestamp: Date.now()
      });
      attachmentIds.push(vaultId as number);
    }

    // 2. Save User Message
    await db.messages.add({
      threadId,
      timestamp: Date.now(),
      sender: 'user',
      text: currentInput,
      attachmentIds
    });

    // Update thread timestamp/ensure it exists
    const thread = await db.threads.get(threadId);
    if (!thread) {
      await db.threads.add({
        id: threadId,
        title: currentInput.slice(0, 30) || 'New Conversation',
        updatedAt: Date.now()
      });
    } else {
      await db.threads.update(threadId, { updatedAt: Date.now() });
    }

    // 3. Process with Local Parser
    const response = await parseCommand(currentInput);

    // 4. Save Assistant Reply
    await db.messages.add({
      threadId,
      timestamp: Date.now() + 10,
      sender: 'assistant',
      text: response.feedback,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0] overflow-hidden">
      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full"
      >
        <AnimatePresence initial={false}>
          {messages?.map((msg) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={cn(
                "flex flex-col",
                msg.sender === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                msg.sender === 'user' 
                  ? "bg-[#141414] text-[#E4E3E0]" 
                  : "bg-white text-[#141414] border border-[#141414]/5"
              )}>
                {msg.text && (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
                
                {msg.attachmentIds && msg.attachmentIds.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <AttachmentsList ids={msg.attachmentIds} />
                  </div>
                )}
              </div>
              <span className="text-[10px] opacity-40 mt-1 px-1 uppercase font-bold tracking-wider">
                {format(msg.timestamp, 'h:mm a')}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {(!messages || messages.length === 0) && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
            <Shield size={48} />
            <div>
              <h2 className="font-serif italic text-xl">Secure Jemmah Portal</h2>
              <p className="text-sm">Everything you share here stays on this device.</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#141414]/10 bg-white">
        <div className="max-w-4xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#141414]/5 px-2 py-1 rounded-md text-xs">
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                    <X size={14} className="hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 bg-[#f5f5f0] rounded-2xl p-2 focus-within:ring-2 ring-[#141414]/10 transition-all">
            <label className="p-2 cursor-pointer hover:bg-[#141414]/5 rounded-xl transition-colors shrink-0">
              <Paperclip size={20} className="text-[#141414]/60" />
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message Jemmah..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-sm max-h-32 placeholder:text-[#141414]/40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className="p-2 bg-[#141414] text-[#E4E3E0] rounded-xl hover:opacity-90 disabled:opacity-30 transition-all shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2 text-[#141414]/40 font-bold uppercase tracking-tight">
            Encrypted with IndexedDB • No Cloud Access
          </p>
        </div>
      </div>
    </div>
  );
}

function AttachmentsList({ ids }: { ids: number[] }) {
  const items = useLiveQuery(() => db.vault.bulkGet(ids), [ids]);

  if (!items) return null;

  return (
    <>
      {items.map((item, idx) => {
        if (!item) return null;
        const isImage = item.type === 'image';
        return (
          <div 
            key={idx} 
            className="rounded-lg overflow-hidden border border-[#141414]/10 bg-[#f5f5f0]/50 group relative"
          >
            {isImage ? (
              <img 
                src={item.dataUrlOrBlob as string} 
                alt={item.name} 
                className="w-full h-24 object-cover" 
              />
            ) : (
              <div className="w-full h-24 flex flex-col items-center justify-center p-2">
                {item.type === 'pdf' ? <FileText size={20} /> : <File size={20} />}
                <span className="text-[10px] mt-1 truncate w-full text-center px-1">{item.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
