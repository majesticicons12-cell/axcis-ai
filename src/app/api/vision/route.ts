import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, media_type } = await request.json();

    if (!image) {
      return Response.json({ error: 'Image data is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 400 });
    }

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const mimeType = (media_type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'Describe this image in detail. What do you see?' },
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
        ],
      }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return Response.json({ description: text });
  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : 'Vision analysis failed',
    }, { status: 500 });
  }
}
