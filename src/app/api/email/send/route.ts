import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/tools/email-sender';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { to, subject, body: emailBody, cc, bcc } = body as {
    to: string; subject: string; body: string; cc?: string; bcc?: string;
  };

  if (!to || !subject || !emailBody) {
    return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 });
  }

  const result = await sendEmail({ to, subject, body: emailBody, cc, bcc });
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
