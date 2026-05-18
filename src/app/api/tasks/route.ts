import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const conversationId = searchParams.get('conversationId') || undefined;

  const tasks = listTasks({ status, conversationId });
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, agentId, conversationId } = body as {
    title: string; description?: string; agentId?: string; conversationId?: string;
  };

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const task = createTask(title, { description, agentId, conversationId });
  return NextResponse.json(task, { status: 201 });
}
