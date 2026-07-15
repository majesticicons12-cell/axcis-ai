import type { AgentConfig, AgentTool, ToolContext } from './types';
import type { Message } from '@/types';

const MAX_CONTEXT_TOKENS = 128000;
const CHARS_PER_TOKEN = 4;
const MAX_TOOL_CALLS = 10;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function trimToTokenBudget<T extends { role: string }>(
  messages: T[],
  getContent: (m: T) => string,
  systemText: string,
  maxTokens: number = MAX_CONTEXT_TOKENS
): T[] {
  let sysTokens = estimateTokens(systemText);
  const msgTokens = messages.map(m => estimateTokens(getContent(m)));
  const total = sysTokens + msgTokens.reduce((a, b) => a + b, 0);
  if (total <= maxTokens) return messages;
  const keep = new Set<number>();
  let accum = sysTokens;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'system') { keep.add(i); continue; }
    if (accum + msgTokens[i] <= maxTokens) { accum += msgTokens[i]; keep.add(i); }
  }
  const result = messages.filter((_, i) => keep.has(i));
  const firstIdx = result.findIndex(m => m.role !== 'system');
  if (firstIdx >= 0 && result[firstIdx].role !== 'user') result.splice(firstIdx, 1);
  return result;
}

function msgContent(m: { role: string; content: string }): string {
  return typeof m.content === 'string' ? m.content : '';
}

function toGroqTool(tool: AgentTool): Record<string, unknown> {
  return {
    type: 'function',
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  };
}

async function executeToolCall(tool: AgentTool, args: Record<string, unknown>, context: ToolContext): Promise<string> {
  try {
    return await tool.execute(args, context);
  } catch (err) {
    return `Error executing ${tool.name}: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

const TOOLING_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODELS = ['llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

async function runToolLoop(
  groq: { chat: { completions: { create: (params: Record<string, unknown>) => Promise<{ choices: Array<{ message: Record<string, unknown>; finish_reason: string }> }> } } },
  model: string,
  messages: { role: string; content: string; tool_calls?: unknown; tool_call_id?: string }[],
  toolMap: Map<string, AgentTool>,
  groqTools: Record<string, unknown>[],
  context: ToolContext,
  config: AgentConfig,
  emitEvent: (event: string, data: Record<string, unknown>) => void
): Promise<string | null> {
  const msgHistory = [...messages];
  let toolCallCount = 0;

  while (toolCallCount < MAX_TOOL_CALLS) {
    const params: Record<string, unknown> = {
      model,
      messages: msgHistory,
      max_tokens: config.maxTokens || 8192,
      temperature: 0.7,
      stream: false,
    };

    if (groqTools.length > 0) {
      params.tools = groqTools;
      params.tool_choice = 'auto';
    }

    const completion = await groq.chat.completions.create(params);
    const choice = completion.choices?.[0];
    if (!choice) break;

    const msg = choice.message as { content?: string | null; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> };

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      msgHistory.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls,
      });

      let allSucceeded = true;
      for (const tc of msg.tool_calls) {
        const tool = toolMap.get(tc.function.name);
        if (!tool) {
          msgHistory.push({ role: 'tool', tool_call_id: tc.id, content: `Error: Unknown tool "${tc.function.name}"` });
          allSucceeded = false;
          continue;
        }
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }
        emitEvent('tool_call', { tool: tc.function.name, args, toolCallId: tc.id });
        const result = await executeToolCall(tool, args, context);
        emitEvent('tool_result', { tool: tc.function.name, toolCallId: tc.id, resultLength: result.length });
        msgHistory.push({ role: 'tool', tool_call_id: tc.id, content: result });
      }
      toolCallCount++;
      if (!allSucceeded) return null;
    } else {
      return msg.content || '';
    }
  }
  return null;
}

async function runModels(
  groq: { chat: { completions: { create: (params: Record<string, unknown>) => Promise<{ choices: Array<{ message: Record<string, unknown>; finish_reason: string }> }> } } },
  models: string[],
  messages: { role: string; content: string }[],
  config: AgentConfig,
  emitEvent: (event: string, data: Record<string, unknown>) => void,
  toolMap: Map<string, AgentTool>,
  groqTools: Record<string, unknown>[],
  context: ToolContext
): Promise<{ text: string; model: string } | null> {
  for (const model of models) {
    try {
      emitEvent('provider', { name: 'groq', model });
      const params: Record<string, unknown> = {
        model,
        messages: messages as any,
        max_tokens: config.maxTokens || 8192,
        temperature: 0.7,
        stream: false,
      };
      if (groqTools.length > 0 && model === TOOLING_MODEL) {
        params.tools = groqTools;
        params.tool_choice = 'auto';
      }

      if (groqTools.length > 0 && model === TOOLING_MODEL) {
        const result = await runToolLoop(groq, model, messages as any, toolMap, groqTools, context, config, emitEvent);
        if (result !== null) return { text: result, model };
      } else {
        const completion = await groq.chat.completions.create(params);
        const content = (completion.choices?.[0]?.message as { content?: string })?.content || '';
        if (content) return { text: content, model };
      }
    } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error';
    const detail = err instanceof Error && err.cause ? String(err.cause) : '';
    const status = err instanceof Error && 'status' in err ? (err as any).status : undefined;
    console.error(`Groq ${model} failed:`, { reason, detail, status, model });
    emitEvent('provider_fallback', { from: `groq/${model}`, reason, detail, status });
  }
  }
  return null;
}

export async function executeAgent(
  config: AgentConfig,
  messages: Message[],
  userMessage: string,
  emitEvent: (event: string, data: Record<string, unknown>) => void,
  conversationId: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    const msg = 'GROQ_API_KEY not configured — add it to Vercel Environment Variables';
    console.error(msg);
    emitEvent('error', { message: msg });
    throw new Error(msg);
  }

  const { default: Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey }) as unknown as { chat: { completions: { create: (params: Record<string, unknown>) => Promise<{ choices: Array<{ message: Record<string, unknown>; finish_reason: string }> }> } } };

  const toolMap = new Map<string, AgentTool>();
  for (const tool of config.tools) toolMap.set(tool.name, tool);

  const groqTools = config.tools.map(toGroqTool);
  const context: ToolContext = { conversationId, emitEvent };

  let baseMessages = [
    { role: 'system', content: config.systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];
  baseMessages = trimToTokenBudget(baseMessages as any, msgContent, '');

  // Try with tools on TOOLING_MODEL first
  const toolResult = await runModels(groq, [TOOLING_MODEL], baseMessages, config, emitEvent, toolMap, groqTools, context);

  if (toolResult) {
    emitEvent('token', { text: toolResult.text });
    emitEvent('model_used', { model: toolResult.model, provider: 'groq' });
    return toolResult.text;
  }

  // Fallback: try all models WITHOUT tools
  emitEvent('tool_call', { tool: '_fallback', args: { reason: 'Tool model failed, falling back to non-tool models' }, toolCallId: 'fallback' });
  const plainResult = await runModels(groq, [TOOLING_MODEL, ...FALLBACK_MODELS], baseMessages, config, emitEvent, new Map(), [], context);

  if (plainResult) {
    emitEvent('token', { text: plainResult.text });
    emitEvent('model_used', { model: plainResult.model, provider: 'groq' });
    return plainResult.text;
  }

  // Final fallback: Hugging Face
  emitEvent('provider', { name: 'huggingface', model: 'fallback' });
  try {
    const { detectTask, callHfModel, MODELS } = await import('@/lib/hf');
    const taskType = detectTask(userMessage);
    const modelList = MODELS[taskType] || MODELS.chat;
    for (const model of modelList) {
      try {
        const result = await callHfModel(model, baseMessages as any, { maxTokens: config.maxTokens, temperature: 0.7, stream: false });
        if (result.text) {
          emitEvent('token', { text: result.text });
          emitEvent('model_used', { model: result.model, provider: 'huggingface' });
          return result.text;
        }
      } catch (hfErr) {
        const reason = hfErr instanceof Error ? hfErr.message : 'Unknown error';
        const detail = hfErr instanceof Error && hfErr.cause ? String(hfErr.cause) : '';
        const status = hfErr instanceof Error && 'status' in hfErr ? (hfErr as any).status : undefined;
        console.error(`HF ${model} failed:`, { reason, detail, status, model });
        emitEvent('provider_fallback', { from: `hf/${model}`, reason, detail, status });
      }
    }
  } catch (hfErr) {
    const reason = hfErr instanceof Error ? hfErr.message : 'Unknown error';
    const detail = hfErr instanceof Error && hfErr.cause ? String(hfErr.cause) : '';
    const status = hfErr instanceof Error && 'status' in hfErr ? (hfErr as any).status : undefined;
    console.error('HF fallback failed entirely:', { reason, detail, status });
    emitEvent('provider_fallback', { from: 'huggingface', reason, detail, status });
  }

  throw new Error('All models failed — check Vercel logs for GROQ_API_KEY / HF_API_KEY');
}
