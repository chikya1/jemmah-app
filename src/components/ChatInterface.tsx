import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Message } from '../lib/LocalDB';
import { parseCommand } from '../lib/CommandParser';
import { format } from 'date-fns';
import { Send, Paperclip, Mic, MicOff, X, FileText, File } from 'lucide-react';

interface ChatInterfaceProps {
  threadId: string;
}

const CHIPS = [
  { label: '⏰ Reminder', fill: 'Remind me to ' },
  { label: '✅ Task', fill: 'Add task: ' },
  { label: '📝 Note', fill: 'Note: ' },
  { label: '🔍 Search', fill: '/search ' },
];

export default function ChatInterface({ threadId }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const messages = useLiveQuery(
    () => db.messages.where('threadId').equals(threadId).sortBy('timestamp'),
    [threadId]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const performSearch = async (query: string) => {
    const q = query.toLowerCase();
    const isAll = q === '__all_notes__';

    // Handle task queries
    if (q === '__all_tasks__' || q === '__today_tasks__' || q === '__overdue_tasks__') {
      const allTasks = await db.tasks.toArray();
      const now = new Date();
      const tasks = q === '__all_tasks__'
        ? allTasks.filter(t => t.status !== 'done')
        : q === '__today_tasks__'
        ? allTasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString())
        : allTasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);

      if (tasks.length === 0) {
        await db.messages.add({ threadId, timestamp: Date.now() + 10, sender: 'assistant', text: 'No tasks found. Open Task Board to add some.' });
        return;
      }
      let taskText = `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''}:\n\n`;
      tasks.forEach(t => {
        const due = t.dueDate ? ` — due ${new Date(t.dueDate).toLocaleDateString()}` : '';
        const cat = t.category ? ` [${t.category}]` : '';
        taskText += `☐ ${t.title}${cat}${due}\n`;
      });
      taskText += '\nOpen Task Board to check off tasks.';
      await db.messages.add({ threadId, timestamp: Date.now() + 10, sender: 'assistant', text: taskText.trim() });
      return;
    }

    const allNotes = await db.notes.toArray();
    const notes = isAll
      ? allNotes.sort((a,b) => b.timestamp - a.timestamp)
      : allNotes.filter(n =>
          n.content.toLowerCase().includes(q) ||
          n.title.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((tag: string) => tag.includes(q)))
        );

    const messages: any[] = [];
    const total = notes.length;

    if (total === 0) {
      await db.messages.add({
        threadId,
        timestamp: Date.now() + 10,
        sender: 'assistant',
        text: `Nothing found for "${query}". Try different words.`
      });
      return;
    }

    // Build result text
    let resultText = `Found ${total} result${total > 1 ? 's' : ''} for "${isAll ? 'all notes' : query}":\n\n`;

    notes.forEach((n, i) => {
      const icon = n.type === 'url' ? '🔗' : n.type === 'credential' ? '🔒' : n.type === 'idea' ? '💡' : '📝';
      const content = n.isSensitive ? '••••• (tap to reveal in notes)' : n.content;
      resultText += `${icon} ${content}\n`;
      if (n.tags.length) resultText += `   Tags: ${n.tags.map(t => '#'+t).join(' ')}\n`;
      resultText += `   ${new Date(n.timestamp).toLocaleDateString()}\n\n`;
    });



    await db.messages.add({
      threadId,
      timestamp: Date.now() + 10,
      sender: 'assistant',
      text: resultText.trim()
    });
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    const currentInput = input.trim();
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);

    const attachmentIds: number[] = [];
    for (const file of currentAttachments) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
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

    // Parse command first
    const response = await parseCommand(currentInput);

    // Only save user message if not a search
    if (response.action !== 'search') {
      await db.messages.add({
        threadId,
        timestamp: Date.now(),
        sender: 'user',
        text: currentInput,
        attachmentIds
      });

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
    }

    if (response.action === 'search' && response.data) {
      await performSearch(response.data);
    } else {
      await db.messages.add({
        threadId,
        timestamp: Date.now() + 10,
        sender: 'assistant',
        text: response.feedback,
      });
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <img src="/jemmah-logo.png" alt="" className="w-48 h-48 object-contain opacity-[0.03]" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 z-10">
        {(!messages || messages.length === 0) && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
            <img src="/jemmah-logo.png" alt="Jemmah" className="w-20 h-20 object-contain mb-4" />
            <p className="text-[#F5F0EB] text-sm font-medium">Everything you share stays on this device.</p>
          </div>
        )}

        {messages?.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-[#7B1F4B] text-[#F5F0EB]'
                : 'bg-[#1a1a1a] text-[#F5F0EB] border-l-2 border-[#7B1F4B]'
            }`}>
              {msg.text && <p>{msg.text}</p>}
              {msg.attachmentIds && msg.attachmentIds.length > 0 && (
                <AttachmentsList ids={msg.attachmentIds} />
              )}
            </div>
            <span className="text-[10px] text-[#9A8F8A] mt-1 px-1 uppercase tracking-wider">
              {format(msg.timestamp, 'h:mm a')}
            </span>
          </div>
        ))}
      </div>

      <div className="z-20 bg-[#0d0d0d] border-t border-[#2a2a2a]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex gap-2 px-3 pt-3 pb-1 overflow-x-auto">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => setInput(chip.fill)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] text-[#7B1F4B] border border-[#2a2a2a] whitespace-nowrap font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded-lg text-xs text-[#F5F0EB]">
                <span className="truncate max-w-[80px]">{file.name}</span>
                <button onClick={() => removeAttachment(i)}>
                  <X size={12} className="text-[#9A8F8A] hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-3 pb-3 pt-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#9A8F8A] hover:text-[#F5F0EB] transition-colors"
          >
            <Paperclip size={18} />
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

          <textarea
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKey}
            placeholder="Message Jemmah..."
            className="flex-1 min-w-0 bg-[#1a1a1a] border border-[#2a2a2a] text-[#F5F0EB] placeholder-[#9A8F8A] rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:border-[#7B1F4B] transition-colors"
            style={{ maxHeight: '120px' }}
          />

          <button
            onClick={toggleVoice}
            className={`shrink-0 p-2.5 rounded-xl border transition-colors ${
              isListening
                ? 'bg-[#7B1F4B] border-[#7B1F4B] text-white animate-pulse'
                : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#9A8F8A] hover:text-[#F5F0EB]'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0}
            className="shrink-0 p-2.5 rounded-xl bg-[#7B1F4B] text-white disabled:opacity-30 hover:bg-[#A0335F] transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentsList({ ids }: { ids: number[] }) {
  const items = useLiveQuery(() => db.vault.bulkGet(ids), [ids]);
  if (!items) return null;
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {items.map((item, idx) => {
        if (!item) return null;
        return (
          <div key={idx} className="rounded-lg overflow-hidden border border-[#2a2a2a]">
            {item.type === 'image' ? (
              <img src={item.dataUrlOrBlob as string} alt={item.name} className="w-full h-20 object-cover" />
            ) : (
              <div className="w-full h-20 flex flex-col items-center justify-center bg-[#0d0d0d]">
                {item.type === 'pdf' ? <FileText size={20} className="text-[#7B1F4B]" /> : <File size={20} className="text-[#9A8F8A]" />}
                <span className="text-[10px] mt-1 text-[#9A8F8A] truncate px-2 w-full text-center">{item.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
