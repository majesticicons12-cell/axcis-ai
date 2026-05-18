import { NextRequest } from 'next/server';

export function checkAuth(request: NextRequest): boolean {
  const requiredPin = process.env.AUTH_PIN;
  if (!requiredPin) return true; // No auth configured

  const headerPin = request.headers.get('x-auth-token');
  if (headerPin === requiredPin) return true;

  const cookiePin = request.cookies.get('axcis_auth')?.value;
  if (cookiePin === requiredPin) return true;

  return false;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
