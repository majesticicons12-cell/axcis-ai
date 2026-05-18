import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Please add your API key to the .env.local file.'
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}
