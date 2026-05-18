import { NextRequest, NextResponse } from 'next/server';
import { scrapePage } from '@/lib/tools/web-scraper';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url } = body as { url: string };

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const content = await scrapePage(url);
  return NextResponse.json({ content });
}
