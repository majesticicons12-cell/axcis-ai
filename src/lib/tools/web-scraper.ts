import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapePage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      maxRedirects: 3,
    });

    const $ = cheerio.load(response.data);

    // Remove non-content elements
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, [role="navigation"], [role="banner"], .nav, .footer, .header, .sidebar, .menu, .ad, .advertisement').remove();

    // Try to find main content
    let content = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '.post', '.entry', '#content', '#main'];

    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        content = el.text();
        break;
      }
    }

    // Fallback to body
    if (!content) {
      content = $('body').text();
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Truncate to ~4000 chars
    if (content.length > 4000) {
      content = content.substring(0, 4000) + '\n\n[Content truncated...]';
    }

    const title = $('title').text().trim();

    return `Title: ${title}\nURL: ${url}\n\n${content}`;
  } catch (err) {
    return `Error fetching ${url}: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}
