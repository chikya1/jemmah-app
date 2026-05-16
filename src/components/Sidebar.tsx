import React from 'react';
import { MessageSquare, CheckSquare, Shield, Settings, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/LocalDB';
import { format } from 'date-fns';

interface SidebarProps {
  activeMode: 'chat' | 'tasks' | 'vault';
  setActiveMode: (mode: 'chat' | 'tasks' | 'vault') => void;
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeMode,
  setActiveMode,
  activeThreadId,
  setActiveThreadId,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const threads = useLiveQuery(() => db.threads.orderBy('updatedAt').reverse().toArray());

  const navItems = [
    { id: 'chat', label: 'Chat View', icon: MessageSquare },
    { id: 'tasks', label: 'Task Board', icon: CheckSquare },
    { id: 'vault', label: 'File Vault', icon: Shield },
  ] as const;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[#141414]/10 bg-[#E4E3E0] transition-all duration-300 ease-in-out h-screen",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-bottom border-[#141414]/5">
        {!isCollapsed && <span className="font-serif italic text-lg font-bold tracking-tight">Jemmah</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-[#141414]/5 rounded-md transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMode(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
              activeMode === item.id
                ? "bg-[#141414] text-[#E4E3E0] shadow-sm"
                : "text-[#141414]/60 hover:bg-[#141414]/5"
            )}
          >
            <item.icon size={20} />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}

        {!isCollapsed && activeMode === 'chat' && (
          <div className="mt-8">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Recent History</span>
              <button 
                onClick={() => setActiveThreadId(null)}
                className="p-1 hover:bg-[#141414]/5 rounded flex items-center gap-1 text-[10px] uppercase font-bold"
              >
                <Plus size={12} /> New
              </button>
            </div>
            <div className="space-y-1">
              {threads?.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all",
                    activeThreadId === thread.id
                      ? "bg-[#141414]/5 font-medium border-l-2 border-[#141414]"
                      : "text-[#141414]/60 hover:bg-[#141414]/5"
                  )}
                >
                  {thread.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#141414]/10 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-[#141414]/60 hover:text-[#141414] transition-colors text-sm">
          <Settings size={18} />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
