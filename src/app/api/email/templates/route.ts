import { NextRequest, NextResponse } from 'next/server';
import { listEmailTemplates, createEmailTemplate } from '@/lib/db';

export async function GET() {
  const templates = listEmailTemplates();
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, subject, body: templateBody, variables } = body as {
    name: string; subject: string; body: string; variables?: string[];
  };

  if (!name || !subject || !templateBody) {
    return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 });
  }

  const template = createEmailTemplate(name, subject, templateBody, variables || []);
  return NextResponse.json(template, { status: 201 });
}
