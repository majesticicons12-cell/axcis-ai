import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass || gmailUser === 'your-email@gmail.com') {
    return {
      success: false,
      error: 'Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local',
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  try {
    const isHtml = opts.body.includes('<') && opts.body.includes('>');

    const info = await transporter.sendMail({
      from: gmailUser,
      to: opts.to,
      subject: opts.subject,
      ...(isHtml ? { html: opts.body } : { text: opts.body }),
      ...(opts.cc ? { cc: opts.cc } : {}),
      ...(opts.bcc ? { bcc: opts.bcc } : {}),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
}
