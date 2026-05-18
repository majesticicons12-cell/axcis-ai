import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { apiKey, pin } = await request.json() as { apiKey?: string; pin?: string };

    // On Vercel, we can't write .env files - just validate
    if (process.env.VERCEL) {
      return NextResponse.json({
        success: true,
        message: 'Configuration noted. Set environment variables in Vercel dashboard.',
      });
    }

    // Local mode - update .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const updateEnv = (content: string, key: string, value: string): string => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      }
      return content + (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
    };

    if (apiKey) {
      envContent = updateEnv(envContent, 'ANTHROPIC_API_KEY', apiKey);
    }
    if (pin) {
      envContent = updateEnv(envContent, 'AUTH_PIN', pin);
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');

    const response = NextResponse.json({ success: true });

    // If PIN was set, also set the auth cookie so user doesn't need to login immediately
    if (pin) {
      response.cookies.set('axcis_auth', pin, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
