import axios from 'axios';

// ─── Hacker News Algolia API (no API key needed) ─────────────────────────────

export async function getHackerNewsStories(type: string = 'top', limit: number = 10): Promise<string> {
  try {
    let endpoint: string;
    switch (type.toLowerCase()) {
      case 'new':
        endpoint = 'search_by_date?tags=story&numericFilters=created_at_i>' + Math.floor(Date.now() / 1000 - 86400);
        break;
      case 'ask':
        endpoint = 'search?tags=ask_hn';
        break;
      case 'show':
        endpoint = 'search?tags=show_hn';
        break;
      case 'job':
        endpoint = 'search?tags=job';
        break;
      default:
        endpoint = 'search?tags=front_page';
    }
    const res = await axios.get(`https://hn.algolia.com/api/v1/${endpoint}`, {
      params: { hitsPerPage: Math.min(limit, 50) },
      timeout: 10000,
    });
    const hits = res.data?.hits || [];
    if (hits.length === 0) return `No Hacker News stories found for type "${type}".`;
    return JSON.stringify(hits.map((h: { title?: string; url?: string; objectID?: string; points?: number; author?: string; num_comments?: number; created_at?: string; _tags?: string[] }) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points,
      author: h.author,
      num_comments: h.num_comments,
      created_at: h.created_at,
      type: h._tags?.includes('ask_hn') ? 'Ask HN' : h._tags?.includes('show_hn') ? 'Show HN' : h._tags?.includes('job') ? 'Job' : 'Story',
    })));
  } catch (err) {
    return `Error fetching Hacker News stories: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function searchHackerNews(query: string, limit: number = 10): Promise<string> {
  try {
    const res = await axios.get('https://hn.algolia.com/api/v1/search', {
      params: { query, hitsPerPage: Math.min(limit, 50) },
      timeout: 10000,
    });
    const hits = res.data?.hits || [];
    if (hits.length === 0) return `No Hacker News results for "${query}".`;
    return JSON.stringify(hits.map((h: Record<string, unknown>) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points,
      author: h.author,
      num_comments: h.num_comments,
      created_at: h.created_at,
    })));
  } catch (err) {
    return `Error searching Hacker News: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Reddit JSON API (no API key needed for public data) ────────────────────

export async function getRedditTrending(subreddit: string = 'startups', limit: number = 10): Promise<string> {
  try {
    const sub = subreddit.replace(/^r\//, '').trim();
    const res = await axios.get(`https://www.reddit.com/r/${sub}/hot.json`, {
      params: { limit: Math.min(limit, 50) },
      headers: { 'User-Agent': 'axcis-ai-co-founder/1.0' },
      timeout: 10000,
    });
    const posts = res.data?.data?.children || [];
    if (posts.length === 0) return `No posts found in r/${sub}.`;
    return JSON.stringify(posts.map((p: { data: Record<string, unknown> }) => ({
      title: p.data.title,
      url: p.data.url,
      permalink: `https://www.reddit.com${p.data.permalink}`,
      score: p.data.score,
      num_comments: p.data.num_comments,
      author: p.data.author,
      created_utc: new Date((p.data.created_utc as number) * 1000).toISOString(),
      selftext: (p.data.selftext as string || '').substring(0, 300),
    })));
  } catch (err) {
    return `Error fetching Reddit posts: ${err instanceof Error ? err.message : 'Unknown error'}. Try r/startups, r/entrepreneur, r/SaaS, r/venturecapital.`;
  }
}

export async function searchReddit(query: string, limit: number = 10): Promise<string> {
  try {
    const res = await axios.get('https://www.reddit.com/search.json', {
      params: { q: query, limit: Math.min(limit, 50), sort: 'relevance' },
      headers: { 'User-Agent': 'axcis-ai-co-founder/1.0' },
      timeout: 10000,
    });
    const posts = res.data?.data?.children || [];
    if (posts.length === 0) return `No Reddit results for "${query}".`;
    return JSON.stringify(posts.map((p: { data: Record<string, unknown> }) => ({
      title: p.data.title,
      subreddit: p.data.subreddit,
      url: p.data.url,
      permalink: `https://www.reddit.com${p.data.permalink}`,
      score: p.data.score,
      num_comments: p.data.num_comments,
      author: p.data.author,
      selftext: (p.data.selftext as string || '').substring(0, 300),
    })));
  } catch (err) {
    return `Error searching Reddit: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── GitHub API (no API key needed for public data) ─────────────────────────

export async function getGitHubRepo(repo: string): Promise<string> {
  try {
    const r = repo.trim();
    const res = await axios.get(`https://api.github.com/repos/${r}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'axcis-ai' },
      timeout: 10000,
    });
    const d = res.data;
    return JSON.stringify({
      name: d.full_name,
      description: d.description,
      url: d.html_url,
      stars: d.stargazers_count,
      forks: d.forks_count,
      open_issues: d.open_issues_count,
      watchers: d.subscribers_count,
      language: d.language,
      topics: d.topics,
      license: d.license?.spdx_id,
      created: d.created_at,
      updated: d.updated_at,
      pushed: d.pushed_at,
      size_kb: d.size,
      default_branch: d.default_branch,
      owner: d.owner?.login,
      owner_type: d.owner?.type,
      has_wiki: d.has_wiki,
      has_pages: d.has_pages,
      has_discussions: d.has_discussions,
    });
  } catch (err) {
    return `Error fetching GitHub repo. Use format "owner/repo" (e.g., "facebook/react"). Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function searchGitHub(query: string, limit: number = 10): Promise<string> {
  try {
    const res = await axios.get('https://api.github.com/search/repositories', {
      params: { q: query, per_page: Math.min(limit, 50), sort: 'stars', order: 'desc' },
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'axcis-ai' },
      timeout: 10000,
    });
    const items = res.data?.items || [];
    if (items.length === 0) return `No GitHub repos found for "${query}".`;
    return JSON.stringify(items.map((i: Record<string, unknown>) => ({
      name: i.full_name,
      description: (i.description as string || '').substring(0, 300),
      url: i.html_url,
      stars: i.stargazers_count,
      forks: i.forks_count,
      language: i.language,
      topics: i.topics,
      license: (i.license as { spdx_id?: string })?.spdx_id,
      updated: i.updated_at,
    })));
  } catch (err) {
    return `Error searching GitHub: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Wikipedia API (no API key needed) ───────────────────────────────────────

export async function searchWikipedia(query: string, limit: number = 5): Promise<string> {
  try {
    const res = await axios.get('https://en.wikipedia.org/api/rest_v1/search/page', {
      params: { q: query, limit: Math.min(limit, 20) },
      timeout: 10000,
    });
    const pages = res.data?.pages || [];
    if (pages.length === 0) return `No Wikipedia results for "${query}".`;
    return JSON.stringify(pages.map((p: Record<string, unknown>) => ({
      title: p.title,
      description: p.description,
      extract: (p.extract as string || '').substring(0, 500),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title as string)}`,
    })));
  } catch (err) {
    return `Error searching Wikipedia: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getWikipediaSummary(topic: string): Promise<string> {
  try {
    const t = topic.trim();
    const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`, {
      timeout: 10000,
    });
    return JSON.stringify({
      title: res.data.title,
      description: res.data.description,
      extract: res.data.extract,
      url: res.data.content_urls?.desktop?.page,
      thumbnail: res.data.thumbnail?.source,
    });
  } catch (err) {
    return `Error fetching Wikipedia summary: ${err instanceof Error ? err.message : 'Unknown error'}. Try a simpler topic name.`;
  }
}

// ─── GNews API (free tier, 100 req/day) ──────────────────────────────────────

export async function getGNews(query?: string): Promise<string> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'GNews API key not configured. Set GNEWS_API_KEY. Free tier at https://gnews.io/';
  }
  try {
    const params: Record<string, string | number> = {
      apikey: apiKey,
      lang: 'en',
      max: 10,
    };
    if (query) params.q = query;
    const res = await axios.get(query ? 'https://gnews.io/api/v4/search' : 'https://gnews.io/api/v4/top-headlines', {
      params,
      timeout: 10000,
    });
    const articles = res.data?.articles || [];
    if (articles.length === 0) return `No news found${query ? ` for "${query}"` : ''}.`;
    return JSON.stringify(articles.map((a: { title?: string; description?: string; url?: string; source?: { name?: string } | string; publishedAt?: string; image?: string }) => ({
      title: a.title,
      description: (a.description || '').substring(0, 300),
      url: a.url,
      source: typeof a.source === 'object' ? a.source?.name : a.source,
      published: a.publishedAt,
      image: a.image,
    })));
  } catch (err) {
    return `Error fetching GNews: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Jobs API (no API key needed) ────────────────────────────────────────────

export async function searchJobs(query: string, location?: string): Promise<string> {
  try {
    const params: Record<string, string | number> = {
      query: `${query} startup`,
      page: 1,
      num_pages: 1,
    };
    if (location) params.location = location;
    const res = await axios.get('https://serpapi.com/search.json', {
      params: { ...params, engine: 'google_jobs', api_key: process.env.SERPAPI_KEY || '' },
      timeout: 10000,
    });
    if (res.data?.error === 'API key not configured') {
      return 'Jobs search needs SERPAPI_KEY. Set SERPAPI_KEY in env (free tier at https://serpapi.com/).';
    }
    const jobs = res.data?.jobs_results || res.data?.jobs || [];
    if (jobs.length === 0) return `No jobs found for "${query}".`;
    return JSON.stringify(jobs.slice(0, 10).map((j: { title?: string; company_name?: string; location?: string; description?: string; related_links?: Array<{ link?: string }>; share_link?: string; via?: string; detected_extensions?: unknown }) => ({
      title: j.title,
      company: j.company_name,
      location: j.location,
      description: (j.description || '').substring(0, 400),
      url: j.related_links?.[0]?.link || j.share_link,
      via: j.via,
      detected_extensions: j.detected_extensions,
    })));
  } catch {
    // Fallback: return helpful message
    return `To search jobs, configure SERPAPI_KEY (Google Jobs) or use the web search tool directly.`;
  }
}

// ─── SEC EDGAR (no API key, public data) ─────────────────────────────────────

export async function getSecFilings(ticker: string): Promise<string> {
  try {
    const t = ticker.toUpperCase().trim();
    const res = await axios.get(`https://data.sec.gov/submissions/CIK${t}.json`, {
      headers: { 'User-Agent': 'axcis-ai (axcis@example.com)' },
      timeout: 10000,
    });
    return JSON.stringify({
      name: res.data.name,
      ticker: t,
      sic_description: res.data.sicDescription,
      filings: (res.data.filings?.recent || []).slice(0, 10).map((f: Record<string, string>) => ({
        form: f.form,
        description: f.primaryDocument,
        date: f.filingDate,
        type: f.primaryDocDescription,
      })),
    });
  } catch {
    return `SEC EDGAR data could not be fetched. Use the ticker symbol (e.g., AAPL, MSFT) or search via web.`;
  }
}
