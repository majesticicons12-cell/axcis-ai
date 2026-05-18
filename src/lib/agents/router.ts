import { getAnthropicClient } from '@/lib/anthropic';
import { getAgentDescriptions } from './registry';
import type { RoutingResult } from './types';

const ROUTER_SYSTEM_PROMPT = `You are a routing classifier for an AI assistant called AXCIS AI. Given the user's message, determine which specialized agent should handle it. Respond with JSON only, no other text.

Available agents:
{AGENT_DESCRIPTIONS}

Rules:
- If the message is about building websites, web apps, landing pages, HTML/CSS/JS, or SaaS products → "website-builder"
- If the message is about writing emails, cold outreach, email templates, or sending emails → "cold-email"
- If the message asks to find information online, research topics, check websites, or summarize web content → "web-research"
- For everything else (general questions, advice, brainstorming, coding help, business strategy) → "general"

Respond with exactly this JSON format:
{"agentId": "agent-id-here", "confidence": 0.0-1.0, "reasoning": "brief reason"}`;

export async function routeMessage(
  message: string,
  recentContext: string = ''
): Promise<RoutingResult> {
  try {
    const client = getAnthropicClient();
    const systemPrompt = ROUTER_SYSTEM_PROMPT.replace(
      '{AGENT_DESCRIPTIONS}',
      getAgentDescriptions()
    );

    const userContent = recentContext
      ? `Recent context:\n${recentContext}\n\nCurrent message: ${message}`
      : message;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text) as RoutingResult;

    if (parsed.confidence < 0.6) {
      return { agentId: 'general', confidence: 1.0, reasoning: 'Low confidence, defaulting to general' };
    }

    return parsed;
  } catch {
    return { agentId: 'general', confidence: 1.0, reasoning: 'Router error, defaulting to general' };
  }
}
