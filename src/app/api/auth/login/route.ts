import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json() as { pin: string };
    const requiredPin = process.env.AUTH_PIN;

    if (!requiredPin) {
      // No PIN set - auth disabled
      return NextResponse.json({ success: true, message: 'No authentication required' });
    }

    if (pin === requiredPin) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('axcis_auth', pin, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
