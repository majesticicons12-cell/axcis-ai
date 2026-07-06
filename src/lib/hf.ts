const HF_API_BASE = 'https://api-inference.huggingface.co';

function getApiKey(): string | null {
  const key = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
  return key && !key.startsWith('your-') ? key : null;
}

export function getHfHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = getApiKey();
  if (key) headers['Authorization'] = `Bearer ${key}`;
  return headers;
}

// Models we use — ordered by task priority
export const MODELS = {
  chat: ['google/gemma-4-12B-it', 'SulphurAI/Sulphur-2-base', 'Jackrong/Trace-Inverter-4B'],
  code: ['google/gemma-4-12B-it', 'SulphurAI/Sulphur-2-base'],
  creative: ['SulphurAI/Sulphur-2-base', 'google/gemma-4-12B-it'],
  debate: ['google/gemma-4-12B-it', 'SulphurAI/Sulphur-2-base', 'Jackrong/Trace-Inverter-4B'],
} as const;

export type TaskType = keyof typeof MODELS;

/**
 * Detect the task type from user message.
 */
export function detectTask(message: string): TaskType {
  const m = message.toLowerCase();
  if (m.includes('code') || m.includes('function') || m.includes('html') ||
      m.includes('css') || m.includes('javascript') || m.includes('program') ||
      m.includes('app') || m.includes('website') || m.includes('build')) {
    return 'code';
  }
  if (m.includes('story') || m.includes('poem') || m.includes('creative') ||
      m.includes('write') || m.includes('essay') || m.includes('script')) {
    return 'creative';
  }
  if (m.includes('debate') || m.includes('compare') || m.includes('pros and cons') ||
      m.includes('different perspectives')) {
    return 'debate';
  }
  return 'chat';
}

/**
 * Make a streaming or non-streaming chat completion call to a HF model.
 * Tries the chat completions API first, falls back to raw text generation.
 */
export async function callHfModel(
  model: string,
  messages: { role: string; content: string }[],
  options: { maxTokens?: number; temperature?: number; stream?: boolean } = {}
): Promise<{ text: string; model: string }> {
  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.7;
  const stream = options.stream ?? false;
  const headers = getHfHeaders();

  // Try chat completions API first
  const chatUrl = `${HF_API_BASE}/models/${model}/v1/chat/completions`;
  const body = JSON.stringify({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: false,
  });

  let res = await fetch(chatUrl, { method: 'POST', headers, body }).catch(() => null);

  // If chat completions fails, try raw text generation
  if (!res || !res.ok) {
    const rawUrl = `${HF_API_BASE}/models/${model}`;
    const prompt = messages.map(m => {
      if (m.role === 'system') return `System: ${m.content}`;
      if (m.role === 'user') return `User: ${m.content}`;
      if (m.role === 'assistant') return `Assistant: ${m.content}`;
      return m.content;
    }).join('\n') + '\nAssistant: ';

    const rawBody = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: maxTokens, temperature, do_sample: temperature > 0 },
    });

    res = await fetch(rawUrl, { method: 'POST', headers: { ...headers }, body: rawBody }).catch(() => null);
    if (!res || !res.ok) {
      const errText = res ? await res.text().catch(() => 'Unknown error') : 'Network error';
      throw new Error(`${model} failed (${res?.status || 'no response'}): ${errText}`);
    }

    const data = await res.json();
    let text = '';
    if (Array.isArray(data)) {
      text = data[0]?.generated_text || '';
      // Strip the input prompt from the output
      const promptEnd = text.lastIndexOf('Assistant: ');
      if (promptEnd !== -1) text = text.slice(promptEnd + 'Assistant: '.length);
    } else if (typeof data === 'object' && data !== null) {
      text = (data as Record<string, unknown>).generated_text as string || JSON.stringify(data);
    }
    return { text: text.trim(), model };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return { text, model };
}

/**
 * Call multiple models in parallel and return all results.
 */
export async function callMultipleModels(
  models: string[],
  messages: { role: string; content: string }[],
  options: { maxTokens?: number } = {}
): Promise<{ text: string; model: string }[]> {
  const results = await Promise.allSettled(
    models.map(m => callHfModel(m, messages, { ...options, stream: false }))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<{ text: string; model: string }> => r.status === 'fulfilled')
    .map(r => r.value);
}
