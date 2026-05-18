import { getAnthropicClient } from '@/lib/anthropic';
import { getGroqClient, isGroqAvailable } from '@/lib/groq';
import type { AgentConfig, ToolContext, AnthropicTool } from './types';
import type { Message } from '@/types';
import type Anthropic from '@anthropic-ai/sdk';
import type Groq from 'groq-sdk';

type AnthropicMessage = Anthropic.Messages.MessageParam;
type ContentBlock = Anthropic.Messages.ContentBlock;

type GroqMessageParam = Groq.Chat.Completions.ChatCompletionMessageParam;

// ─── Shared helpers ──────────────────────────────────────────────────────────

function convertToAnthropicMessages(messages: Message[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];
  for (const msg of messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      result.push({ role: msg.role, content: msg.content });
    }
  }
  return result;
}

function convertToGroqMessages(messages: Message[]): GroqMessageParam[] {
  const result: GroqMessageParam[] = [];
  for (const msg of messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      result.push({ role: msg.role, content: msg.content });
    }
  }
  return result;
}

function convertToolsForAnthropic(tools: AgentConfig['tools']): AnthropicTool[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as AnthropicTool['input_schema'],
  }));
}

function convertToolsForGroq(tools: AgentConfig['tools']): Groq.Chat.Completions.ChatCompletionTool[] {
  return tools.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema as Record<string, unknown>,
    },
  }));
}

// ─── Groq executor ───────────────────────────────────────────────────────────

async function executeWithGroq(
  config: AgentConfig,
  messages: Message[],
  userMessage: string,
  emitEvent: (event: string, data: Record<string, unknown>) => void,
  conversationId: string
): Promise<string> {
  const groq = getGroqClient()!;
  const model = config.groqModel || 'llama-3.3-70b-versatile';
  const tools = convertToolsForGroq(config.tools);
  const context: ToolContext = { conversationId, emitEvent };

  const currentMessages: GroqMessageParam[] = [
    { role: 'system', content: config.systemPrompt },
    ...convertToGroqMessages(messages),
    { role: 'user', content: userMessage },
  ];

  let fullResponse = '';

  for (let iteration = 0; iteration < 10; iteration++) {
    const stream = await groq.chat.completions.create({
      model,
      messages: currentMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      max_tokens: config.maxTokens,
      stream: true,
    });

    let currentText = '';
    const toolCalls = new Map<number, { id: string; name: string; arguments: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        currentText += delta.content;
        emitEvent('token', { text: delta.content });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCalls.get(tc.index);
          if (existing) {
            if (tc.function?.arguments) {
              existing.arguments += tc.function.arguments;
            }
          } else {
            toolCalls.set(tc.index, {
              id: tc.id || '',
              name: tc.function?.name || '',
              arguments: tc.function?.arguments || '',
            });
            if (tc.function?.name) {
              emitEvent('tool_start', { toolName: tc.function.name, toolId: tc.id || '' });
            }
          }
        }
      }
    }

    fullResponse += currentText;

    if (toolCalls.size === 0) break;

    // Add assistant message with tool calls to conversation
    const assistantToolCalls = Array.from(toolCalls.values()).map(tc => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.name, arguments: tc.arguments },
    }));

    currentMessages.push({
      role: 'assistant',
      content: currentText || null,
      tool_calls: assistantToolCalls,
    });

    // Execute each tool and add results
    for (const tc of assistantToolCalls) {
      const tool = config.tools.find(t => t.name === tc.function.name);
      let result: string;

      if (tool) {
        try {
          const input = JSON.parse(tc.function.arguments);
          result = await tool.execute(input, context);
          emitEvent('tool_result', { toolName: tc.function.name, result, success: true });
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          emitEvent('tool_result', { toolName: tc.function.name, result, success: false });
        }
      } else {
        result = `Error: Tool "${tc.function.name}" not found`;
        emitEvent('tool_result', { toolName: tc.function.name, result, success: false });
      }

      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  return fullResponse;
}

// ─── Anthropic executor ──────────────────────────────────────────────────────

async function executeWithAnthropic(
  config: AgentConfig,
  messages: Message[],
  userMessage: string,
  emitEvent: (event: string, data: Record<string, unknown>) => void,
  conversationId: string
): Promise<string> {
  const client = getAnthropicClient();
  const anthropicMessages = convertToAnthropicMessages(messages);
  anthropicMessages.push({ role: 'user', content: userMessage });

  const tools = convertToolsForAnthropic(config.tools);
  const context: ToolContext = { conversationId, emitEvent };

  let fullResponse = '';
  let currentMessages = [...anthropicMessages];

  for (let iteration = 0; iteration < 10; iteration++) {
    const requestParams: Anthropic.Messages.MessageCreateParams = {
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      messages: currentMessages,
      ...(tools.length > 0 ? { tools } : {}),
    };

    const stream = await client.messages.stream(requestParams);

    let currentText = '';
    const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    let hasToolUse = false;

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta && delta.text) {
          currentText += delta.text;
          emitEvent('token', { text: delta.text });
        }
      } else if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          hasToolUse = true;
          emitEvent('tool_start', { toolName: block.name, toolId: block.id });
        }
      }
    }

    const finalMessage = await stream.finalMessage();

    for (const block of finalMessage.content) {
      if (block.type === 'tool_use') {
        toolUseBlocks.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    fullResponse += currentText;

    if (!hasToolUse || toolUseBlocks.length === 0) break;

    const assistantContent: ContentBlock[] = finalMessage.content;
    currentMessages.push({ role: 'assistant', content: assistantContent as Anthropic.Messages.ContentBlockParam[] });

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const toolBlock of toolUseBlocks) {
      const tool = config.tools.find(t => t.name === toolBlock.name);
      let result: string;

      if (tool) {
        try {
          result = await tool.execute(toolBlock.input, context);
          emitEvent('tool_result', { toolName: toolBlock.name, result, success: true });
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          emitEvent('tool_result', { toolName: toolBlock.name, result, success: false });
        }
      } else {
        result = `Error: Tool "${toolBlock.name}" not found`;
        emitEvent('tool_result', { toolName: toolBlock.name, result, success: false });
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: result,
      });
    }

    currentMessages.push({ role: 'user', content: toolResults });
  }

  return fullResponse;
}

// ─── Main executor — Groq first, Anthropic fallback ──────────────────────────

export async function executeAgent(
  config: AgentConfig,
  messages: Message[],
  userMessage: string,
  emitEvent: (event: string, data: Record<string, unknown>) => void,
  conversationId: string
): Promise<string> {
  // Try Groq first if available
  if (isGroqAvailable()) {
    try {
      emitEvent('provider', { name: 'groq', model: config.groqModel || 'llama-3.3-70b-versatile' });
      return await executeWithGroq(config, messages, userMessage, emitEvent, conversationId);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      console.error('Groq failed, falling back to Anthropic:', reason);
      emitEvent('provider_fallback', { from: 'groq', to: 'anthropic', reason });
    }
  }

  // Fall back to Anthropic
  emitEvent('provider', { name: 'anthropic', model: config.model });
  return await executeWithAnthropic(config, messages, userMessage, emitEvent, conversationId);
}
