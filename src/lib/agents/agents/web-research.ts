import type { AgentConfig } from '../types';
import { searchWeb } from '@/lib/tools/search';
import { scrapePage } from '@/lib/tools/web-scraper';
import { createTask } from '@/lib/db';

export const webResearchAgent: AgentConfig = {
  id: 'web-research',
  name: 'Web Research',
  description: 'Finding information online, researching topics, checking websites, summarizing web content, and gathering data from the internet',
  icon: '🔍',
  systemPrompt: `You are AXCIS AI's Web Research Agent — an expert internet researcher and analyst.

Your job is to find, read, and synthesize information from the web.

Rules:
- Use search_web to find relevant pages on any topic
- Use read_page to extract and read content from specific URLs
- Always cite your sources with URLs
- Synthesize information from multiple sources when possible
- Present findings in a clear, organized format with headers and bullet points
- If the user asks about a specific website, read it directly
- Create research tasks to track ongoing research topics
- Be honest about limitations — if you can't find something, say so
- Focus on recent, authoritative sources`,
  tools: [
    {
      name: 'search_web',
      description: 'Search the web using DuckDuckGo. Returns titles, URLs, and snippets of top results.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
      execute: async (input) => {
        const { query } = input as { query: string };
        const results = await searchWeb(query);
        return JSON.stringify(results);
      },
    },
    {
      name: 'read_page',
      description: 'Fetch and extract the main text content from a web page URL.',
      input_schema: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'The URL to read' },
        },
        required: ['url'],
      },
      execute: async (input) => {
        const { url } = input as { url: string };
        const content = await scrapePage(url);
        return content;
      },
    },
    {
      name: 'create_research_task',
      description: 'Create a task to track a research topic or finding.',
      input_schema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Research task title' },
          description: { type: 'string', description: 'Details about what was found or needs further research' },
        },
        required: ['title'],
      },
      execute: async (input, context) => {
        const { title, description } = input as { title: string; description?: string };
        const task = createTask(title, {
          description,
          conversationId: context.conversationId,
          agentId: 'web-research',
        });
        context.emitEvent('task_created', { task });
        return JSON.stringify(task);
      },
    },
  ],
  model: 'google/gemma-4-12B-it',
  maxTokens: 4096,
};
