import { NextRequest } from 'next/server';
import { callHfModel } from '@/lib/hf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_SYSTEM = 'You are an expert web developer. Generate a complete, production-ready single-page web application in a single HTML file. Include all CSS in <style> tags and all JavaScript in <script> tags. Make it visually stunning with modern design, gradients, smooth interactions, and responsive layout. Return ONLY the complete HTML code inside a ```html code block. Do NOT explain anything.';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const userMsg = `Build me a complete web application: ${prompt}. Include all HTML, CSS, and JavaScript in one file. Make it beautiful, modern, and functional.`;

    const result = await callHfModel('google/gemma-4-12B-it', [
      { role: 'system', content: CODE_SYSTEM },
      { role: 'user', content: userMsg },
    ], { maxTokens: 8192, temperature: 0.2, stream: false });

    // Extract code from markdown block
    let code = result.text;
    const codeMatch = code.match(/```html\n?([\s\S]*?)```/);
    if (codeMatch) {
      code = codeMatch[1].trim();
    } else {
      const anyCodeMatch = code.match(/```\n?([\s\S]*?)```/);
      if (anyCodeMatch) {
        code = anyCodeMatch[1].trim();
      }
    }

    // If code doesn't look like HTML, create a wrapper
    if (!code.includes('<html') && !code.includes('<!DOCTYPE')) {
      code = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${prompt.slice(0, 40)}</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:2rem;background:#000;color:#fff}</style></head><body>${code}</body></html>`;
    }

    return Response.json({ code, model: result.model });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
