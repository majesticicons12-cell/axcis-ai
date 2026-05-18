import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requiredPin = process.env.AUTH_PIN;

  if (!requiredPin) {
    return NextResponse.json({ authenticated: true, authRequired: false });
  }

  const cookiePin = request.cookies.get('axcis_auth')?.value;
  const headerPin = request.headers.get('x-auth-token');

  const authenticated = cookiePin === requiredPin || headerPin === requiredPin;

  return NextResponse.json({ authenticated, authRequired: true });
}
