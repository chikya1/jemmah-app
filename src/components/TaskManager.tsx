import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../lib/LocalDB';
import { CheckCircle2, Circle, Plus, Trash2, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TaskBoard() {
  const [filter, setFilter] = useState<'all' | 'personal' | 'work'>('all');
  const tasks = useLiveQuery(() => {
    let collection = db.tasks.orderBy('date').reverse();
    if (filter !== 'all') {
      return collection.filter(t => t.category === filter).toArray();
    }
    return collection.toArray();
  }, [filter]);

  const toggleTask = async (task: Task) => {
    await db.tasks.update(task.id!, { 
      status: task.status === 'todo' ? 'done' : 'todo' 
    });
  };

  const deleteTask = async (id: number) => {
    if (confirm('Delete this task?')) {
      await db.tasks.delete(id);
    }
  };

  return (
    <div className="p-8 h-full bg-[#E4E3E0] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Organizer</span>
            <h1 className="font-serif italic text-4xl mt-1">Daily Agenda</h1>
          </div>
          
          <div className="flex bg-white/50 p-1 rounded-xl border border-[#141414]/5">
            {(['all', 'personal', 'work'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all",
                  filter === f ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414]/40 hover:text-[#141414]"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#141414]/5">
          <div className="divide-y divide-[#141414]/5">
            <AnimatePresence initial={false}>
              {tasks?.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group flex items-center p-4 gap-4 hover:bg-[#f5f5f0] transition-colors"
                >
                  <button 
                    onClick={() => toggleTask(task)}
                    className="text-[#141414] shrink-0"
                  >
                    {task.status === 'done' 
                      ? <CheckCircle2 className="text-green-600" size={24} /> 
                      : <Circle size={24} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-sm font-medium truncate",
                      task.status === 'done' && "line-through opacity-40"
                    )}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-40">
                        <Tag size={10} /> {task.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-40">
                        <CalendarIcon size={10} /> {format(task.date, 'MMM d')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id!)}
                    className="p-2 opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!tasks || tasks.length === 0) && (
              <div className="p-12 text-center opacity-30 italic font-serif">
                Nothing on your list yet. Start by saying "add task: ..." in chat.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
