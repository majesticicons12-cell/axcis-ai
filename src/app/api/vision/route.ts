import { NextRequest } from 'next/server';
import { getHfHeaders } from '@/lib/hf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, media_type } = await request.json();

    if (!image) {
      return Response.json({ error: 'Image data is required' }, { status: 400 });
    }

    const headers = getHfHeaders();
    const model = 'Salesforce/blip-image-captioning-base';
    const textPrompt = prompt || 'Describe this image in detail. What do you see?';

    // BLIP takes image + optional text
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: { image: `data:${media_type || 'image/jpeg'};base64,${image}`, text: textPrompt },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      // Fallback: try a simpler captioning model
      const fallbackRes = await fetch('https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning', {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: `data:${media_type || 'image/jpeg'};base64,${image}` }),
        signal: AbortSignal.timeout(30000),
      });
      if (!fallbackRes.ok) {
        return Response.json({ error: `Image analysis failed: ${errText}` }, { status: 500 });
      }
      const fbData = await fallbackRes.json();
      const fbText = Array.isArray(fbData) ? fbData[0]?.generated_text || fbData[0] || '' : '';
      return Response.json({ description: fbText, model: 'nlpconnect/vit-gpt2-image-captioning' });
    }

    const data = await res.json();
    const description = Array.isArray(data)
      ? (data[0]?.generated_text || JSON.stringify(data[0]) || '')
      : (data.generated_text || '');

    return Response.json({ description, model });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
