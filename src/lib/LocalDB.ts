import Dexie, { type Table } from 'dexie';

export interface Message {
  id?: number;
  threadId: string;
  timestamp: number;
  sender: 'user' | 'assistant';
  text: string;
  attachmentIds?: number[];
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  category: 'personal' | 'work';
  status: 'todo' | 'done';
  date: number;
  dueDate?: number;
  periodicity?: 'daily' | 'weekly' | 'monthly';
}

export interface VaultItem {
  id?: number;
  name: string;
  type: string; // 'image' | 'pdf' | 'text'
  dataUrlOrBlob: string | Blob;
  textContent?: string;
  timestamp: number;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
}

export class JemmahDB extends Dexie {
  messages!: Table<Message>;
  tasks!: Table<Task>;
  vault!: Table<VaultItem>;
  threads!: Table<Thread>;

  constructor() {
    super('JemmahDB');
    this.version(1).stores({
      messages: '++id, threadId, timestamp, sender',
      tasks: '++id, category, status, date, dueDate',
      vault: '++id, name, type, timestamp',
      threads: 'id, updatedAt'
    });
  }
}

export const db = new JemmahDB();
