import { addMinutes, addHours, startOfTomorrow } from 'date-fns';

export interface ParsedCommand {
  type: 'reminder' | 'task' | 'note' | 'search' | 'unknown';
  payload: any;
  confirmationMessage: string;
}

export function parseCommand(input: string): ParsedCommand {
  const cleanInput = input.trim();
  const lowerInput = cleanInput.toLowerCase();

  if (lowerInput.startsWith('remind me to ') || lowerInput.startsWith('remind me ')) {
    const prefixMatch = cleanInput.match(/^remind me (?:to )?/i);
    const textToParse = cleanInput.substring(prefixMatch ? prefixMatch[0].length : 0);

    let targetTime = new Date();
    let messageText = textToParse;
    
    // Normalize string: handles '948 pm' -> '9:48 pm' and spaces
    let normalizedText = textToParse.replace(/(\d{1,2})(\d{2})\s*(am|pm)/i, '$1:$2 $3');
    normalizedText = normalizedText.replace(/(\d+)\.(\d+)/g, '$1:$2');

    let baseDate = new Date();
    let isEveningOrTonight = false;

    if (/tomorrow/i.test(normalizedText)) {
      baseDate = startOfTomorrow();
      normalizedText = normalizedText.replace(/tomorrow/i, '').trim();
    } else if (/today/i.test(normalizedText)) {
      normalizedText = normalizedText.replace(/today/i, '').trim();
    }
    
    if (/tonight/i.test(normalizedText) || /this evening/i.test(normalizedText)) {
      isEveningOrTonight = true;
      normalizedText = normalizedText.replace(/tonight|this evening/i, '').trim();
    }

    // Strict regex catching time representations
    const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
    const timeMatch = normalizedText.match(timeRegex);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      let minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toLowerCase();

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      targetTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
      messageText = normalizedText.replace(timeMatch[0], '').trim();
    } else if (isEveningOrTonight) {
      targetTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 20, 0, 0, 0);
      messageText = normalizedText;
    }

    if (targetTime < new Date() && !/tomorrow/i.test(input)) {
      targetTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000);
    }

    messageText = messageText.replace(/^(to|at|for)\s+/i, '').trim();

    const formattedTime = targetTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const dayLabel = targetTime.getDate() === new Date().getDate() ? 'today' : 'tomorrow';

    return {
      type: 'reminder',
      payload: { text: messageText, time: targetTime },
      confirmationMessage: `I'll remind you to "${messageText}" at ${formattedTime} ${dayLabel}.`
    };
  }

  if (lowerInput.startsWith('add task:') || lowerInput.startsWith('task:')) {
    const taskText = cleanInput.replace(/^(add task:|task:)/i, '').trim();
    return { type: 'task', payload: { title: taskText }, confirmationMessage: `Successfully added task: "${taskText}"` };
  }

  if (lowerInput.startsWith('note:')) {
    const noteText = cleanInput.replace(/^note:/i, '').trim();
    return { type: 'note', payload: { content: noteText }, confirmationMessage: `Saved to local notes.` };
  }

  if (lowerInput.startsWith('/search ')) {
    const queryText = cleanInput.substring(8).trim();
    return { type: 'search', payload: { query: queryText }, confirmationMessage: `Searching local index for "${queryText}"...` };
  }

  return { type: 'unknown', payload: { text: cleanInput }, confirmationMessage: '' };
}
