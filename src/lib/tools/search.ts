import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function extractUrl(redirectUrl: string): string {
  if (redirectUrl.includes('uddg=')) {
    try {
      const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
      return urlParams.get('uddg') || redirectUrl;
    } catch {
      return redirectUrl;
    }
  }
  return redirectUrl;
}

function parseResults(html: string, limit: number): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $('.result').each((i, el) => {
    if (i >= limit) return false;

    const titleEl = $(el).find('.result__title a');
    const snippetEl = $(el).find('.result__snippet');

    const title = titleEl.text().trim();
    const resultUrl = extractUrl(titleEl.attr('href') || '');
    const snippet = snippetEl.text().trim();

    if (title && resultUrl) {
      results.push({ title, url: resultUrl, snippet });
    }
  });

  return results;
}

function getNextPageUrl(html: string): string | null {
  const $ = cheerio.load(html);
  const nextLink = $('.result--more__btn a').attr('href');
  if (nextLink && nextLink.includes('q=')) {
    // It might be a relative path — ensure full URL
    if (nextLink.startsWith('/')) {
      return `https://html.duckduckgo.com${nextLink}`;
    }
    return nextLink;
  }
  return null;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    const html = await fetchPage(url);
    if (!html) {
      return [{ title: 'Search error', url: '', snippet: `Failed to search for: "${query}"` }];
    }

    const results = parseResults(html, 10);
    if (results.length === 0) {
      return [{ title: 'No results found', url: '', snippet: `No search results found for: "${query}"` }];
    }

    return results;
  } catch (err) {
    return [{
      title: 'Search error',
      url: '',
      snippet: `Failed to search: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }];
  }
}

export async function searchWebExtensive(query: string, maxResults: number = 50): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  try {
    const encodedQuery = encodeURIComponent(query);
    let currentUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    for (let page = 0; page < 5 && allResults.length < maxResults; page++) {
      const html = await fetchPage(currentUrl);
      if (!html) break;

      const pageResults = parseResults(html, maxResults - allResults.length);

      for (const r of pageResults) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }

      if (allResults.length >= maxResults) break;

      const nextUrl = getNextPageUrl(html);
      if (!nextUrl) break;
      currentUrl = nextUrl;
    }

    if (allResults.length === 0) {
      return [{ title: 'No results found', url: '', snippet: `No search results found for: "${query}"` }];
    }

    return allResults.slice(0, maxResults);
  } catch (err) {
    if (allResults.length === 0) {
      return [{
        title: 'Search error',
        url: '',
        snippet: `Failed to search: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }];
    }
    return allResults;
  }
}
