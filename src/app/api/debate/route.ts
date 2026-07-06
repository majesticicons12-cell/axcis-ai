import { NextRequest } from 'next/server';
import { callMultipleModels } from '@/lib/hf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBATE_MODELS = [
  'google/gemma-4-12B-it',
  'SulphurAI/Sulphur-2-base',
];

const GROQ_DEBATE_MODELS = [
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
];

const SYNTHESIS_SYSTEM = 'You are a debate synthesizer. You are given multiple AI perspectives on a query. Your job is to synthesize the BEST answer by combining insights from all perspectives, resolving contradictions, and presenting a clear, thorough response.';

async function callGroq(messages: { role: string; content: string }[], model: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) throw new Error('GROQ_API_KEY not configured');

  const { default: Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model,
    messages: messages as any,
    max_tokens: 4096,
    temperature: 0.7,
    stream: false,
  });

  return completion.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const writeSSE = (event: string, data: Record<string, unknown>) => {
      writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)).catch(() => {});
    };

    (async () => {
      try {
        writeSSE('status', { message: 'Running debate across multiple AI models...' });

        const messages = [
          { role: 'system' as const, content: 'You are a thoughtful AI participating in a debate. Provide your best answer to the query, considering different angles. Be thorough but concise.' },
          { role: 'user' as const, content: query },
        ];

        writeSSE('status', { message: 'Querying models via Groq + HF...' });

        // Try Groq models first, then HF
        const results: { model: string; text: string }[] = [];

        // Try Groq models in parallel
        const groqAttempts = GROQ_DEBATE_MODELS.map(async (model) => {
          try {
            const text = await callGroq(messages as any, model);
            return { model, text };
          } catch {
            return null;
          }
        });

        const groqResults = (await Promise.allSettled(groqAttempts))
          .filter(r => r.status === 'fulfilled' && r.value !== null)
          .map(r => (r as PromiseFulfilledResult<{ model: string; text: string }>).value);

        results.push(...groqResults);

        // Try HF models
        if (results.length < 2) {
          try {
            const hfResults = await callMultipleModels(DEBATE_MODELS, messages as any, { maxTokens: 2048 });
            results.push(...hfResults);
          } catch {}
        }

        writeSSE('status', { message: `Got ${results.length} perspectives, synthesizing...` });

        for (const r of results) {
          writeSSE('perspective', { model: r.model, text: r.text });
        }

        if (results.length === 0) {
          writeSSE('error', { message: 'All models failed' });
          return;
        }

        if (results.length === 1) {
          writeSSE('synthesis', { text: results[0].text, model: results[0].model });
          return;
        }

        // Synthesize using Groq
        const synthesisPrompt = results.map((r, i) =>
          `## Perspective ${i + 1} (${r.model}):\n${r.text}`
        ).join('\n\n');

        try {
          const synthesisText = await callGroq(
            [
              { role: 'system', content: SYNTHESIS_SYSTEM },
              { role: 'user', content: `Query: ${query}\n\nPerspectives:\n${synthesisPrompt}\n\nSynthesize the best answer:` },
            ],
            'llama-3.3-70b-versatile'
          );
          writeSSE('synthesis', { text: synthesisText, model: 'llama-3.3-70b-versatile' });
        } catch {
          // Fallback synthesis from first perspective
          writeSSE('synthesis', { text: results[0].text, model: results[0].model });
        }
      } catch (err) {
        writeSSE('error', { message: err instanceof Error ? err.message : 'Debate failed' });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
