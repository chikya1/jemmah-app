import { addDays, parse, isValid, format } from 'date-fns';
import { db, type Task } from './LocalDB';

export interface CommandResult {
  action: 'message' | 'task' | 'reminder' | 'search' | 'note';
  data?: any;
  feedback: string;
}

export async function parseCommand(text: string): Promise<CommandResult> {
  const input = text.toLowerCase().trim();

  // 1. Task Parser: "add task: [title] to [category]"
  const taskRegex = /(?:add task|new task):\s*(.+?)(?:\s+to\s+(personal|work))?$/i;
  const taskMatch = text.match(taskRegex);
  if (taskMatch) {
    const title = taskMatch[1].trim();
    const category = (taskMatch[2]?.toLowerCase() || 'personal') as 'personal' | 'work';
    
    const newTask: Task = {
      title,
      description: '',
      category,
      status: 'todo',
      date: Date.now(),
    };
    
    const id = await db.tasks.add(newTask);
    return {
      action: 'task',
      data: { ...newTask, id },
      feedback: `Added "${title}" to your ${category} tasks.`
    };
  }

  // 2. Reminder Parser: "remind me to [action] at [time] [day]"
  // Simplified for this demo: handles "at 3pm tomorrow" or "at 9pm"
  const reminderRegex = /remind me to\s+(.+?)\s+at\s+(\d+)(am|pm)?(?:\s+(tomorrow|today))?/i;
  const reminderMatch = text.match(reminderRegex);
  if (reminderMatch) {
    const action = reminderMatch[1].trim();
    let hour = parseInt(reminderMatch[2]);
    const ampm = reminderMatch[3]?.toLowerCase();
    const day = reminderMatch[4]?.toLowerCase() || 'today';

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    const targetDate = new Date();
    if (day === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetDate.setHours(hour, 0, 0, 0);

    // Schedule notification if permitted
    if (Notification.permission === 'granted') {
      const delay = targetDate.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          new Notification('Jemmah Reminder', {
            body: action,
            icon: '/favicon.ico'
          });
        }, delay);
      }
    }

    return {
      action: 'reminder',
      data: { action, time: targetDate.getTime() },
      feedback: `Got it. I'll remind you to "${action}" at ${format(targetDate, 'h:mm a MMM d')}.`
    };
  }

  // 3. Search: "/search [query]"
  if (input.startsWith('/search ')) {
    const query = input.replace('/search ', '').trim();
    return {
      action: 'search',
      data: query,
      feedback: `Searching for "${query}" across your data...`
    };
  }

  // 4. Default: Conversational Note
  return {
    action: 'message',
    feedback: "I've noted that down for you locally."
  };
}
