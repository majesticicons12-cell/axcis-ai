import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HF_API_BASE = 'https://api-inference.huggingface.co/models';

const FREE_MODELS = [
  'Wan-AI/Wan2.1-T2V-14B',
  'ByteDance/AnimateDiff-Lightning',
];

export async function POST(request: NextRequest) {
  try {
    const { prompt, model: requestedModel } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const model = requestedModel && FREE_MODELS.includes(requestedModel) ? requestedModel : FREE_MODELS[0];
    const apiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;

    const headers: Record<string, string> = {};
    if (apiKey && !apiKey.startsWith('your-')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body: Record<string, unknown> = { inputs: prompt };

    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return Response.json({ error: `Video generation failed (${res.status}): ${err}` }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'video/mp4';
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
