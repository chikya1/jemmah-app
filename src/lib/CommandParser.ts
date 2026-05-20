import { db, type Task } from './LocalDB';
import { format } from 'date-fns';

export interface CommandResult {
  action: 'message' | 'task' | 'reminder' | 'search' | 'note';
  data?: any;
  feedback: string;
}

function parseTime(text: string): Date | null {
  const now = new Date();
  let s = text.toLowerCase();
  s = s.replace(/\b(\d{4})\s*(am|pm)\b/g, (_: string, d: string, ap: string) => d.slice(0,2)+':'+d.slice(2)+ap);
  s = s.replace(/\b(\d{3})\s*(am|pm)\b/g, (_: string, d: string, ap: string) => '0'+d.slice(0,1)+':'+d.slice(1)+ap);
  s = s.replace(/(\d{1,2})\.(\d{2})\s*(am|pm)/g, '$1:$2$3');
  s = s.replace(/\b(\d{2})(\d{2})\s*hrs?\b/, '$1:$2');
  const m12 = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (m12) {
    let h = parseInt(m12[1]);
    const m = parseInt(m12[2]);
    const ap = m12[3];
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t;
  }
  const mw = s.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (mw) {
    let h = parseInt(mw[1]);
    const ap = mw[2];
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    const t = new Date();
    t.setHours(h, 0, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t;
  }
  const rm = s.match(/in\s+(\d+)\s+min/);
  if (rm) return new Date(now.getTime() + parseInt(rm[1]) * 60000);
  const rh = s.match(/in\s+(\d+)\s+hour/);
  if (rh) return new Date(now.getTime() + parseInt(rh[1]) * 3600000);
  // v2
  return null;
}

function extractTask(text: string): string {
  return text
    .replace(/hey jemmah[,.]?\s*/i, '')
    .replace(/remind me to\s*/i, '')
    .replace(/set a reminder (for|to|at)?\s*/i, '')
    .replace(/\b\d{4}\s*(am|pm)\b/gi, '')
    .replace(/\b\d{3}\s*(am|pm)\b/gi, '')
    .replace(/(\d{1,2})[.:]( \d{2})\s*(am|pm)?/gi, '')
    .replace(/\b\d{1,2}\s*(am|pm)\b/gi, '')
    .replace(/\b(at|by|before|around)\s*$/gi, '')
    .replace(/\b(today|tomorrow|tonight)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function parseCommand(text: string): Promise<CommandResult> {
  const input = text.toLowerCase().trim();
  const taskMatch = text.match(/(?:add task|new task):\s*(.+?)(?:\s+to\s+(personal|work))?$/i);
  if (taskMatch) {
    const title = taskMatch[1].trim();
    const category = (taskMatch[2]?.toLowerCase() || 'personal') as 'personal' | 'work';
    const newTask: Task = { title, description: '', category, status: 'todo', date: Date.now() };
    const id = await db.tasks.add(newTask);
    return { action: 'task', data: { ...newTask, id }, feedback: `Added "${title}" to your ${category} tasks.` };
  }
  if (input.includes('remind') || input.includes('reminder')) {
    const targetTime = parseTime(text);
    const task = extractTask(text);
    if (targetTime) {
      if (Notification.permission === 'granted') {
        const delay = targetTime.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(() => { new Notification('Jemmah Reminder', { body: task, icon: '/jemmah-logo.png' }); }, delay);
        }
      }
      return { action: 'reminder', data: { task, time: targetTime.getTime() }, feedback: `Got it. I\'ll remind you to "${task}" at ${format(targetTime, 'h:mm a, MMM d')}.` };
    }
    return { action: 'reminder', feedback: `Couldn\'t find a time. Try: "Remind me to call Rohan at 6:30pm"` };
  }
  if (input.startsWith('/search ')) {
    const query = input.replace('/search ', '').trim();
    return { action: 'search', data: query, feedback: `Searching for "${query}"...` };
  }
  if (input.startsWith('note:') || input.startsWith('note ')) {
    const note = text.replace(/^note:?\s*/i, '').trim();
    return { action: 'note', feedback: `Note saved: "${note}"` };
  }
  return { action: 'message', feedback: "Got it. I\'ve noted that down locally." };
}
