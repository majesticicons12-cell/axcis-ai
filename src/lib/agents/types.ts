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
  maxTokens: number;
}

export interface ToolContext {
  conversationId: string;
  emitEvent: (event: string, data: Record<string, unknown>) => void;
}
