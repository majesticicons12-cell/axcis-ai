import axios from 'axios';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// ─── Google Custom Search API ───────────────────────────────────────────────

async function searchGoogle(query: string, limit: number): Promise<SearchResult[] | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!apiKey || !cx || apiKey.startsWith('your-')) return null;

  try {
    const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: { key: apiKey, cx, q: query, num: Math.min(limit, 10) },
      timeout: 10000,
    });
    return (res.data.items || []).map((item: { title: string; link: string; snippet: string }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || '',
    }));
  } catch { return null; }
}

// ─── Brave Search API ──────────────────────────────────────────────────────

async function searchBrave(query: string, limit: number): Promise<SearchResult[] | null> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) return null;

  try {
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: { q: query, count: Math.min(limit, 20) },
      headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': apiKey },
      timeout: 10000,
    });
    return (res.data.web?.results || []).map((item: { title: string; url: string; description: string }) => ({
      title: item.title,
      url: item.url,
      snippet: item.description || '',
    }));
  } catch { return null; }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const google = await searchGoogle(query, 10);
  if (google) return google;

  const brave = await searchBrave(query, 10);
  if (brave) return brave;

  return [{
    title: 'Search not configured',
    url: '',
    snippet: 'No search API is configured. Set GOOGLE_API_KEY + GOOGLE_CX (Google CSE, free for 100 queries/day) or BRAVE_API_KEY (Brave Search, free 2000 queries/month) in your environment variables.',
  }];
}

export async function searchWebExtensive(query: string, maxResults: number = 30): Promise<SearchResult[]> {
  const google = await searchGoogle(query, Math.min(maxResults, 10));
  if (google) return google;

  const brave = await searchBrave(query, Math.min(maxResults, 20));
  if (brave) return brave;

  return [{
    title: 'Search not configured',
    url: '',
    snippet: 'No search API is configured. Set GOOGLE_API_KEY + GOOGLE_CX (Google CSE, free 100 queries/day) or BRAVE_API_KEY (Brave Search, free 2000 queries/month) in your environment variables.',
  }];
}
