import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../lib/LocalDB';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { CheckSquare, Square, Calendar, Flag, Trash2, Plus } from 'lucide-react';

export default function TaskManager() {
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'done'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'personal' | 'work' | ''>('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low' | ''>('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');

  const allTasks = useLiveQuery(() => db.tasks.orderBy('date').reverse().toArray(), []);

  const filtered = allTasks?.filter(t => {
    if (filter === 'done') return t.status === 'done';
    if (t.status === 'done') return false;
    if (filter === 'today') return t.dueDate ? isToday(new Date(t.dueDate)) : false;
    if (filter === 'overdue') return t.dueDate ? isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) : false;
    return true;
  });

  const toggleTask = async (task: Task) => {
    await db.tasks.update(task.id!, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const deleteTask = async (id: number) => {
    await db.tasks.delete(id);
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    let dueDate: number | undefined;
    if (newDueDate) {
      const dateStr = newDueTime ? `${newDueDate}T${newDueTime}` : `${newDueDate}T09:00`;
      dueDate = new Date(dateStr).getTime();
      if (Notification.permission === 'granted' && dueDate > Date.now()) {
        const delay = dueDate - Date.now();
        setTimeout(() => {
          new Notification('Jemmah Task Due', { body: newTitle.trim(), icon: '/jemmah-logo.png' });
        }, delay);
      }
    }
    await db.tasks.add({
      title: newTitle.trim(),
      description: '',
      category: (newCategory || 'personal') as 'personal' | 'work',
      status: 'todo',
      date: Date.now(),
      dueDate,
    });
    setNewTitle('');
    setNewCategory('');
    setNewPriority('');
    setNewDueDate('');
    setNewDueTime('');
    setShowAdd(false);
  };

  const priorityColor = (p?: string) => {
    if (p === 'high') return 'text-red-400';
    if (p === 'medium') return 'text-yellow-400';
    return 'text-green-400';
  };

  const counts = {
    all: allTasks?.filter(t => t.status !== 'done').length || 0,
    today: allTasks?.filter(t => t.status !== 'done' && t.dueDate && isToday(new Date(t.dueDate))).length || 0,
    overdue: allTasks?.filter(t => t.status !== 'done' && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length || 0,
    done: allTasks?.filter(t => t.status === 'done').length || 0,
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#F5F0EB]">
      <div className="px-4 pt-4 pb-2 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7B1F4B] text-white text-sm font-medium"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'today', 'overdue', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === f
                  ? 'bg-[#7B1F4B] border-[#7B1F4B] text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#9A8F8A]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="mx-4 mt-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#F5F0EB] placeholder-[#9A8F8A] outline-none focus:border-[#7B1F4B]"
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#F5F0EB] outline-none"
            >
              <option value="">Category (optional)</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
            </select>
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as any)}
              className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#F5F0EB] outline-none"
            >
              <option value="">Priority (optional)</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#F5F0EB] outline-none"
            />
            <input
              type="time"
              value={newDueTime}
              onChange={e => setNewDueTime(e.target.value)}
              className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-[#F5F0EB] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addTask} className="flex-1 py-2 rounded-xl bg-[#7B1F4B] text-white text-sm font-medium">
              Save Task
            </button>
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#9A8F8A] text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filtered?.length === 0 && (
          <div className="text-center text-[#9A8F8A] text-sm py-16 opacity-50">
            {filter === 'done' ? 'No completed tasks yet.' : 'No tasks here. Add one above.'}
          </div>
        )}
        {filtered?.map(task => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
              task.status === 'done'
                ? 'bg-[#0d0d0d] border-[#1a1a1a] opacity-50'
                : 'bg-[#1a1a1a] border-[#2a2a2a]'
            }`}
          >
            <button
              onClick={() => toggleTask(task)}
              className="shrink-0 mt-0.5 text-[#7B1F4B]"
            >
              {task.status === 'done'
                ? <CheckSquare size={20} />
                : <Square size={20} className="text-[#9A8F8A]" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-[#9A8F8A]' : 'text-[#F5F0EB]'}`}>
                {task.title}
              </p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {task.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#9A8F8A]">
                    {task.category}
                  </span>
                )}
                {task.dueDate && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    isPast(new Date(task.dueDate)) && task.status !== 'done'
                      ? 'bg-red-900/20 border-red-800 text-red-400'
                      : 'bg-[#0d0d0d] border-[#2a2a2a] text-[#9A8F8A]'
                  }`}>
                    <Calendar size={8} />
                    {format(new Date(task.dueDate), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteTask(task.id!)}
              className="shrink-0 p-1 text-[#9A8F8A] hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
