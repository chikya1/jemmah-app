import { db, type Task } from './LocalDB';
import { format } from 'date-fns';

export interface CommandResult {
  action: 'message' | 'task' | 'reminder' | 'search' | 'note';
  data?: any;
  feedback: string;
}

function normalizeTime(input: string): string {
  let s = input.toLowerCase();
  s = s.replace(/\b(\d{3,4})\s*(am|pm)\b/g, (_: string, digits: string, ampm: string) => {
    if (digits.length === 3) digits = '0' + digits;
    return digits.slice(0, 2) + ':' + digits.slice(2) + ampm;
  });
  s = s.replace(/(\d{1,2})\.(\d{2})\s*(am|pm)/g, '$1:$2$3');
  s = s.replace(/\b(\d{2})(\d{2})\s*hrs?\b/, '$1:$2');
  return s;
}

function parseTime(text: string): Date | null {
  const now = new Date();
  const s = normalizeTime(text);

  const match12 = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = parseInt(match12[2]);
    const ampm = match12[3];
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  const matchWhole = s.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (matchWhole) {
    let h = parseInt(matchWhole[1]);
    const ampm = matchWhole[2];
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    const target = new Date();
    target.setHours(h, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  const relMin = s.match(/in\s+(\d+)\s+min/);
  if (relMin) return new Date(now.getTime() + parseInt(relMin[1]) * 60000);
  const relHr = s.match(/in\s+(\d+)\s+hour/);
  if (relHr) return new Date(now.getTime() + parseInt(relHr[1]) * 3600000);

  return null;
}

function extractTask(text: string): string {
  return text
    .replace(/hey jemmah[,.]?\s*/i, '')
    .replace(/remind me to\s*/i, '')
    .replace(/set a reminder (for|to|at)?\s*/i, '')
    .replace(/\b\d{3,4}\s*(am|pm)\b/gi, '')
    .replace(/(\d{1,2})[.:](\d{2})\s*(am|pm)?/gi, '')
    .replace(/\b\d{1,2}\s*(am|pm)\b/gi, '')
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
          setTimeout(() => {
            new Notification('Jemmah Reminder', { body: task, icon: '/jemmah-logo.png' });
          }, delay);
        }
      }
      return {
        action: 'reminder',
        data: { task, time: targetTime.getTime() },
        feedback: `Got it. I'll remind you to "${task}" at ${format(targetTime, 'h:mm a, MMM d')}.`
      };
    }
    return { action: 'reminder', feedback: `Couldn't find a time. Try: "Remind me to call Rohan at 6:30pm"` };
  }

  if (input.startsWith('/search ')) {
    const query = input.replace('/search ', '').trim();
    return { action: 'search', data: query, feedback: `Searching for "${query}"...` };
  }

  if (input.startsWith('note:') || input.startsWith('note ')) {
    const note = text.replace(/^note:?\s*/i, '').trim();
    return { action: 'note', feedback: `Note saved: "${note}"` };
  }

  return { action: 'message', feedback: "Got it. I've noted that down locally." };
}
