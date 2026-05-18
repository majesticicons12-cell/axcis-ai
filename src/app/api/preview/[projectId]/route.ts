import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const IS_VERCEL = !!process.env.VERCEL;
const PROJECTS_DIR = IS_VERCEL ? path.join('/tmp', 'data', 'projects') : path.join(process.cwd(), 'data', 'projects');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('file') || 'index.html';

  // Sanitize to prevent directory traversal
  const safePath = filePath.replace(/\.\./g, '').replace(/^\//, '');
  const fullPath = path.join(PROJECTS_DIR, projectId, safePath);

  // Ensure the path is within the projects directory
  if (!fullPath.startsWith(PROJECTS_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const content = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    },
  });
}
