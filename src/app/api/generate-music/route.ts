import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HF_API_BASE = 'https://api-inference.huggingface.co/models';

const MUSIC_MODELS = [
  'facebook/musicgen-small',
  'facebook/musicgen-medium',
];

export async function POST(request: NextRequest) {
  try {
    const { prompt, model: requestedModel, duration } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const model = requestedModel && MUSIC_MODELS.includes(requestedModel) ? requestedModel : MUSIC_MODELS[0];
    const apiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;

    const headers: Record<string, string> = {};
    if (apiKey && !apiKey.startsWith('your-')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body: Record<string, unknown> = { inputs: prompt };
    if (duration) {
      body.parameters = { duration: Math.min(Math.max(duration, 1), 30) };
    }

    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return Response.json({ error: `Music generation failed (${res.status}): ${err}` }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'audio/wav';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
