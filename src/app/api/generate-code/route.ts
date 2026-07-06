import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HF_API_BASE = 'https://api-inference.huggingface.co/models';

const CODE_MODELS = [
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'codestral/Mamba-Codestral-7B',
  'bigcode/starcoder2-15b',
];

export async function POST(request: NextRequest) {
  try {
    const { prompt, model: requestedModel } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const model = requestedModel && CODE_MODELS.includes(requestedModel) ? requestedModel : CODE_MODELS[0];
    const apiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey && !apiKey.startsWith('your-')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const systemMsg = 'You are an expert web developer. Generate complete, production-ready HTML/CSS/JS code. Return ONLY the code inside a single markdown code block. Include all HTML, CSS (in <style> tags), and JavaScript (in <script> tags) in one file. Make it visually stunning with modern design.';

    const body = {
      inputs: `<|im_start|>system\n${systemMsg}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`,
      parameters: { max_new_tokens: 4096, temperature: 0.2, do_sample: true },
    };

    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      return Response.json({ error: `Code generation failed (${res.status}): ${err}` }, { status: res.status });
    }

    const data = await res.json();

    let generated = '';
    if (Array.isArray(data)) {
      generated = data[0]?.generated_text || '';
    } else if (data.generated_text) {
      generated = data.generated_text;
    }

    // Strip the input prompt from the output
    const promptEnd = generated.lastIndexOf('<|im_start|>assistant\n');
    if (promptEnd !== -1) {
      generated = generated.slice(promptEnd + '<|im_start|>assistant\n'.length);
    }

    // Also strip any leftover system/user text
    generated = generated.replace(/<\|im_start\|>(?:system|user)[\s\S]*?<\|im_end\|>/g, '').trim();

    return Response.json({ code: generated || 'No code generated' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
