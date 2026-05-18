export interface Conversation {
  id: string;
  title: string;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Task {
  id: string;
  conversationId: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId: string | null;
  result: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedProject {
  id: string;
  conversationId: string | null;
  name: string;
  description: string | null;
  path: string;
  createdAt: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  agentId?: string;
}

export interface StreamEvent {
  event: string;
  data: Record<string, unknown>;
}
