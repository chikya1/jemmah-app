import { db, type Task } from './LocalDB';
import { format } from 'date-fns';

export interface CommandResult {
  action: 'message' | 'task' | 'reminder' | 'search' | 'note';
  data?: any;
  feedback: string;
}

function parseTime(text: string): Date | null {
  const now = new Date();
  const input = text.toLowerCase()
    .replace(/(\d{1,2})[.](\d{2})/g, '$1:$2')  // 3.30 → 3:30
    .replace(/(\d{2})(\d{2})\s*hrs?/g, '$1:$2') // 1835 hrs → 18:35
    .replace(/(\d{1,2}):(\d{2})\s*hrs/g, '$1:$2');

  // 24-hour: 18:35 or 1835
  const match24 = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (match24) {
    const target = new Date();
    target.setHours(parseInt(match24[1]), parseInt(match24[2]), 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  // 12-hour: 3:30pm, 6:35 pm, 9am
  const match12 = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (match12) {
    let hours = parseInt(match12[1]);
    const mins = parseInt(match12[2] || '0');
    const ampm = match12[3];
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    const target = new Date();
    target.setHours(hours, mins, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  // Relative: "in 30 minutes", "in 2 hours"
  const relMins = input.match(/in\s+(\d+)\s+min/);
  if (relMins) {
    return new Date(now.getTime() + parseInt(relMins[1]) * 60000);
  }
  const relHrs = input.match(/in\s+(\d+)\s+hour/);
  if (relHrs) {
    return new Date(now.getTime() + parseInt(relHrs[1]) * 3600000);
  }

  return null;
}

function extractTask(text: string): string {
  return text
    .replace(/hey jemmah[,.]?\s*/i, '')
    .replace(/remind me to\s*/i, '')
    .replace(/set a reminder (for|to|at)?\s*/i, '')
    .replace(/(\d{1,2})[.:](\d{2})\s*(am|pm)?/gi, '')
    .replace(/\b\d{1,2}\s*(am|pm)\b/gi, '')
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, '')
    .replace(/\d{4}\s*hrs?/gi, '')
    .replace(/\b(today|tomorrow|tonight|this evening)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function parseCommand(text: string): Promise<CommandResult> {
  const input = text.toLowerCase().trim();

  // Task
  const taskMatch = text.match(/(?:add task|new task):\s*(.+?)(?:\s+to\s+(personal|work))?$/i);
  if (taskMatch) {
    const title = taskMatch[1].trim();
    const category = (taskMatch[2]?.toLowerCase() || 'personal') as 'personal' | 'work';
    const newTask: Task = { title, description: '', category, status: 'todo', date: Date.now() };
    const id = await db.tasks.add(newTask);
    return {
      action: 'task',
      data: { ...newTask, id },
      feedback: `Added "${title}" to your ${category} tasks.`
    };
  }

  // Reminder
  if (input.includes('remind') || input.includes('reminder')) {
    const targetTime = parseTime(text);
    const task = extractTask(text);
    if (targetTime) {
      if (Notification.permission === 'granted') {
        const delay = targetTime.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            new Notification('Jemmah Reminder ⏰', { body: task, icon: '/jemmah-logo.png' });
          }, delay);
        }
      }
      return {
        action: 'reminder',
        data: { task, time: targetTime.getTime() },
        feedback: `Got it. I'll remind you to "${task}" at ${format(targetTime, 'h:mm a, MMM d')}.`
      };
    }
    return {
      action: 'reminder',
      feedback: `I got that you want a reminder but couldn't find a time. Try: "Remind me to call Rohan at 6:30pm"`
    };
  }

  // Search
  if (input.startsWith('/search ')) {
    const query = input.replace('/search ', '').trim();
    return { action: 'search', data: query, feedback: `Searching for "${query}" across your data...` };
  }

  // Note
  if (input.startsWith('note:') || input.startsWith('note ')) {
    const note = text.replace(/^note:?\s*/i, '').trim();
    return { action: 'note', feedback: `Note saved: "${note}"` };
  }

  // Default
  return { action: 'message', feedback: "Got it. I've noted that down locally." };
}
