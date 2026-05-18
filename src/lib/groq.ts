import Groq from 'groq-sdk';

let client: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
  if (!apiKey || apiKey.startsWith('your-')) return null;

  client = new Groq({ apiKey });
  return client;
}

export function isGroqAvailable(): boolean {
  const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
  return !!apiKey && !apiKey.startsWith('your-');
}
