import { NextResponse } from 'next/server';
import { addReply } from '@/lib/forum';

export async function POST(req: Request) {
  try {
    const { threadId, author, content } = await req.json();

    if (!threadId || !author || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newReply = addReply(threadId, { author, content });

    if (!newReply) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(newReply, { status: 201 });
  } catch (error) {
    console.error('Failed to create reply:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
