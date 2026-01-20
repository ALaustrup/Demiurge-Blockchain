import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'forum.json');

interface Reply {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface Thread {
  id: string;
  title: string;
  author: string;
  date: string;
  content: string;
  replies: Reply[];
}

interface ForumData {
  threads: Thread[];
}

function readData(): ForumData {
  const jsonData = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(jsonData);
}

function writeData(data: ForumData) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(dataFilePath, jsonData, 'utf-8');
}

export function getThreads(): Thread[] {
  const data = readData();
  return data.threads.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getThreadById(id: string): Thread | undefined {
  const data = readData();
  return data.threads.find(t => t.id === id);
}

export function addThread(thread: Omit<Thread, 'id' | 'date' | 'replies'>): Thread {
  const data = readData();
  const newThread: Thread = {
    ...thread,
    id: (data.threads.length + 1).toString(), // Simple ID generation
    date: new Date().toISOString(),
    replies: [],
  };
  data.threads.push(newThread);
  writeData(data);
  return newThread;
}

export function addReply(threadId: string, reply: Omit<Reply, 'id' | 'date'>): Reply | null {
    const data = readData();
    const thread = data.threads.find(t => t.id === threadId);
    if (!thread) {
        return null;
    }

    const newReply: Reply = {
        ...reply,
        id: `${threadId}-${thread.replies.length + 1}`, // Simple ID generation
        date: new Date().toISOString(),
    };

    thread.replies.push(newReply);
    writeData(data);
    return newReply;
}
