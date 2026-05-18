import type { AgentConfig } from './types';
import { createAxcisAgent } from './agents/jarvis';

let cachedAgent: AgentConfig | null = null;

function getAxcisAgent(): AgentConfig {
  if (!cachedAgent) {
    cachedAgent = createAxcisAgent();
  }
  return cachedAgent;
}

export function getAgent(id: string): AgentConfig | undefined {
  // Always return the unified AXCIS agent regardless of ID
  return getAxcisAgent();
}

export function getDefaultAgent(): AgentConfig {
  return getAxcisAgent();
}

export function getAllAgents(): AgentConfig[] {
  return [getAxcisAgent()];
}

export function getAgentDescriptions(): string {
  const agent = getAxcisAgent();
  return `- ${agent.id}: ${agent.description}`;
}
