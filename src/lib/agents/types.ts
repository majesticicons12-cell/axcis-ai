import type Anthropic from '@anthropic-ai/sdk';

export interface AgentTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  tools: AgentTool[];
  model: string;
  groqModel?: string;
  maxTokens: number;
}

export interface ToolContext {
  conversationId: string;
  emitEvent: (event: string, data: Record<string, unknown>) => void;
}

export interface RoutingResult {
  agentId: string;
  confidence: number;
  reasoning: string;
}

export type AnthropicTool = Anthropic.Messages.Tool;
