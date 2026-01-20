import { NextResponse } from 'next/server';
import { addThread } from '@/lib/forum';

export async function POST(req: Request) {
  try {
    const { title, author, content } = await req.json();

    if (!title || !author || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newThread = addThread({ title, author, content });

    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error('Failed to create thread:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
