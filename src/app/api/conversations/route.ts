import { NextRequest, NextResponse } from 'next/server';
import { listConversations, createConversation } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const conversations = listConversations(limit, offset);
  return NextResponse.json(conversations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, agentId } = body as { title?: string; agentId?: string };

  const conversation = createConversation(title || 'New Chat', agentId || null);
  return NextResponse.json(conversation, { status: 201 });
}
