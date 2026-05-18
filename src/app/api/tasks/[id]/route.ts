import { NextRequest, NextResponse } from 'next/server';
import { updateTask, deleteTask } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, result } = body as { status?: string; result?: Record<string, unknown> };

  const task = updateTask(id, {
    ...(status ? { status: status as 'pending' | 'in_progress' | 'completed' | 'failed' } : {}),
    ...(result ? { result } : {}),
  });

  if (!task) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
