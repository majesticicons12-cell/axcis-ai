import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');

  const messages = getMessages(id, limit);
  return NextResponse.json(messages);
}
