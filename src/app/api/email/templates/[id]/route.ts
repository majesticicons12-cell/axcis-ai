import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = getEmailTemplate(id);
  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, subject, body: templateBody, variables } = body as {
    name?: string; subject?: string; body?: string; variables?: string[];
  };

  const template = updateEmailTemplate(id, {
    ...(name ? { name } : {}),
    ...(subject ? { subject } : {}),
    ...(templateBody ? { body: templateBody } : {}),
    ...(variables ? { variables } : {}),
  });

  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteEmailTemplate(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
