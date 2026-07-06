import type { AgentConfig } from '../types';
import { searchWeb, searchWebExtensive } from '@/lib/tools/search';
import { scrapePage } from '@/lib/tools/web-scraper';
import {
  getCryptoPrice,
  getTrendingCryptos,
  getCryptoMarketData,
  getStockQuote,
  getStockOverview,
  getExchangeRate,
  getExchangeRateHistory,
  getBusinessNews,
  getBinancePrice,
  getEodData,
} from '@/lib/tools/market-intel';
import {
  getCompanyLogo,
  lookupCompanyByDomain,
  searchPatents,
  searchDomainInfo,
  getIndustryData,
  searchCompanyRegistry,
  validateVatNumber,
} from '@/lib/tools/company-intel';
import {
  getHackerNewsStories,
  searchHackerNews,
  getRedditTrending,
  searchReddit,
  getGitHubRepo,
  searchGitHub,
  searchWikipedia,
  getWikipediaSummary,
  getGNews,
  searchJobs,
  getSecFilings,
} from '@/lib/tools/social-intel';

function buildTools(): AgentConfig['tools'] {
  return [
    // ─── Search & Web ────────────────────────────────────────────────────
    {
      name: 'search_web',
      description: 'Search the internet. Returns up to 10 results with titles, URLs, and snippets. Use for market research, competitor analysis, finding investors, checking trends, or any question needing current info.',
      input_schema: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'The search query' } },
        required: ['query'],
      },
      execute: async (input) => JSON.stringify(await searchWeb((input as { query: string }).query)),
    },
    {
      name: 'search_web_extensive',
      description: 'Deep search that fetches many more results (up to 50) across multiple pages. Use for large-scale market research, finding 50+ leads, extensive competitor lists, or deep industry analysis.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'The search query' },
          max_results: { type: 'number', description: 'Maximum results (default 30, max 50)' },
        },
        required: ['query'],
      },
      execute: async (input) => JSON.stringify(await searchWebExtensive((input as { query: string; max_results?: number }).query, (input as { query: string; max_results?: number }).max_results || 30)),
    },
    {
      name: 'read_webpage',
      description: 'Fetch and extract the main text content from any webpage URL. Use to read competitor pages, startup blogs, investor profiles, market reports, or any article in detail.',
      input_schema: {
        type: 'object' as const,
        properties: { url: { type: 'string', description: 'The full URL to read' } },
        required: ['url'],
      },
      execute: async (input) => scrapePage((input as { url: string }).url),
    },
    {
      name: 'transcribe_audio',
      description: 'Transcribe audio to text. Use when the user shares a voice message, meeting recording, or any audio file they want transcribed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          audio_data: { type: 'string', description: 'Base64-encoded audio data' },
          mime_type: { type: 'string', description: 'MIME type (e.g., audio/mpeg, audio/wav)' },
          filename: { type: 'string', description: 'Original filename' },
        },
        required: ['audio_data', 'mime_type'],
      },
      execute: async (input) => {
        const { audio_data, mime_type, filename } = input as { audio_data: string; mime_type: string; filename?: string };
        try {
          const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
          if (!apiKey || apiKey.startsWith('your-')) return 'Error: GROQ_API_KEY not configured.';
          const fs = await import('fs');
          const path = await import('path');
          const os = await import('os');
          const tmpDir = os.tmpdir();
          const ext = filename ? path.extname(filename) : '.webm';
          const tmpFile = path.join(tmpDir, `axcis_audio_${Date.now()}${ext}`);
          const buffer = Buffer.from(audio_data, 'base64');
          fs.writeFileSync(tmpFile, buffer);
          const Groq = (await import('groq-sdk')).default;
          const groq = new Groq({ apiKey });
          const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tmpFile),
            model: 'whisper-large-v3-turbo',
          });
          fs.unlinkSync(tmpFile);
          return (transcription as { text?: string }).text || '';
        } catch (err) {
          return `Error transcribing audio: ${err instanceof Error ? err.message : 'Unknown error'}`;
        }
      },
    },

    // ─── Crypto (CoinGecko - no API key) ──────────────────────────────────
    {
      name: 'get_crypto_price',
      description: 'Get current price, market cap, volume, and 24h change for any cryptocurrency. Uses CoinGecko (no API key needed). Use the CoinGecko coin ID (e.g., bitcoin, ethereum, solana, dogecoin).',
      input_schema: {
        type: 'object' as const,
        properties: { coin_id: { type: 'string', description: 'CoinGecko coin ID (e.g., bitcoin, ethereum, solana, cardano)' } },
        required: ['coin_id'],
      },
      execute: async (input) => getCryptoPrice((input as { coin_id: string }).coin_id),
    },
    {
      name: 'get_trending_cryptos',
      description: 'Get the top 10 trending cryptocurrencies on CoinGecko right now. No API key needed. Returns names, symbols, market cap ranks.',
      input_schema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      execute: async () => getTrendingCryptos(),
    },
    {
      name: 'get_crypto_market_data',
      description: 'Get detailed market data for a cryptocurrency including description, categories, ATH, supply metrics, and price changes over 24h/7d/30d. Uses CoinGecko (no API key).',
      input_schema: {
        type: 'object' as const,
        properties: { coin_id: { type: 'string', description: 'CoinGecko coin ID (e.g., bitcoin, ethereum, solana)' } },
        required: ['coin_id'],
      },
      execute: async (input) => getCryptoMarketData((input as { coin_id: string }).coin_id),
    },
    {
      name: 'get_binance_price',
      description: 'Get real-time price, 24h change, high, low, and volume for any Binance trading pair. No API key needed. Use format like BTCUSDT, ETHUSDT, SOLUSDT.',
      input_schema: {
        type: 'object' as const,
        properties: { symbol: { type: 'string', description: 'Trading pair (e.g., BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT)' } },
        required: ['symbol'],
      },
      execute: async (input) => getBinancePrice((input as { symbol: string }).symbol),
    },

    // ─── Stock Market (Alpha Vantage - free API key) ──────────────────────
    {
      name: 'get_stock_quote',
      description: 'Get a real-time stock quote: price, change, volume, daily high/low. Requires ALPHA_VANTAGE_KEY (free at alphavantage.co).',
      input_schema: {
        type: 'object' as const,
        properties: { symbol: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL, MSFT, GOOGL, TSLA, AMZN)' } },
        required: ['symbol'],
      },
      execute: async (input) => getStockQuote((input as { symbol: string }).symbol),
    },
    {
      name: 'get_stock_overview',
      description: 'Get detailed company overview: description, sector, industry, market cap, PE ratio, dividend yield, EPS, 52-week range, analyst target price. Requires ALPHA_VANTAGE_KEY.',
      input_schema: {
        type: 'object' as const,
        properties: { symbol: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL, MSFT, NVDA, TSLA)' } },
        required: ['symbol'],
      },
      execute: async (input) => getStockOverview((input as { symbol: string }).symbol),
    },
    {
      name: 'get_eod_data',
      description: 'Get end-of-day historical stock data. Requires EODHD_API_KEY (free at eodhd.com).',
      input_schema: {
        type: 'object' as const,
        properties: {
          symbol: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL, MSFT)' },
          date: { type: 'string', description: 'Optional date (YYYY-MM-DD) or "latest"' },
        },
        required: ['symbol'],
      },
      execute: async (input) => getEodData((input as { symbol: string; date?: string }).symbol, (input as { symbol: string; date?: string }).date),
    },

    // ─── Forex (Frankfurter - no API key) ─────────────────────────────────
    {
      name: 'get_exchange_rate',
      description: 'Get the latest exchange rate between two currencies. Uses Frankfurter API (no key needed). Supports 150+ currencies (USD, EUR, GBP, JPY, etc.).',
      input_schema: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: 'Source currency code (e.g., USD, EUR, GBP, JPY)' },
          to: { type: 'string', description: 'Target currency code (e.g., USD, EUR, GBP, JPY)' },
        },
        required: ['from', 'to'],
      },
      execute: async (input) => getExchangeRate((input as { from: string; to: string }).from, (input as { from: string; to: string }).to),
    },
    {
      name: 'get_exchange_rate_history',
      description: 'Get historical exchange rates between two currencies for a date range. Uses Frankfurter API (no key needed).',
      input_schema: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: 'Source currency code' },
          to: { type: 'string', description: 'Target currency code' },
          start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
          end_date: { type: 'string', description: 'Optional end date YYYY-MM-DD' },
        },
        required: ['from', 'to', 'start_date'],
      },
      execute: async (input) => getExchangeRateHistory(
        (input as { from: string; to: string; start_date: string; end_date?: string }).from,
        (input as { from: string; to: string; start_date: string; end_date?: string }).to,
        (input as { from: string; to: string; start_date: string; end_date?: string }).start_date,
        (input as { from: string; to: string; start_date: string; end_date?: string }).end_date
      ),
    },

    // ─── Company Intelligence ─────────────────────────────────────────────
    {
      name: 'lookup_company',
      description: 'Look up detailed company information by domain. Returns name, description, industry, employee count, revenue, tech stack, social links. Requires CLEARBIT_KEY (free at clearbit.com).',
      input_schema: {
        type: 'object' as const,
        properties: { domain: { type: 'string', description: 'Company domain (e.g., openai.com, stripe.com, vercel.com)' } },
        required: ['domain'],
      },
      execute: async (input) => lookupCompanyByDomain((input as { domain: string }).domain),
    },
    {
      name: 'get_company_logo',
      description: 'Get the logo URL for any company by domain. Uses Clearbit Logo API (no key needed). Returns a direct image URL.',
      input_schema: {
        type: 'object' as const,
        properties: { domain: { type: 'string', description: 'Company domain (e.g., google.com, microsoft.com)' } },
        required: ['domain'],
      },
      execute: async (input) => getCompanyLogo((input as { domain: string }).domain),
    },
    {
      name: 'search_patents',
      description: 'Search US patents by keyword. Returns patent title, number, date, inventor, assignee, and abstract. Uses USPTO public API (no key needed).',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Patent search query (e.g., "machine learning", "blockchain", "solar panel")' },
          limit: { type: 'number', description: 'Maximum results (default 10, max 50)' },
        },
        required: ['query'],
      },
      execute: async (input) => searchPatents((input as { query: string; limit?: number }).query, (input as { query: string; limit?: number }).limit),
    },
    {
      name: 'search_company_registry',
      description: 'Search official company registry data by company name. Uses OpenCorporates API. Returns incorporation date, status, jurisdiction. Requires OPENCORPORATES_KEY.',
      input_schema: {
        type: 'object' as const,
        properties: {
          company_name: { type: 'string', description: 'Company name to search' },
          jurisdiction: { type: 'string', description: 'Optional jurisdiction code (e.g., us_de, gb, fr, de)' },
        },
        required: ['company_name'],
      },
      execute: async (input) => searchCompanyRegistry(
        (input as { company_name: string; jurisdiction?: string }).company_name,
        (input as { company_name: string; jurisdiction?: string }).jurisdiction
      ),
    },
    {
      name: 'validate_vat_number',
      description: 'Validate a European VAT number and get the registered company name and address. Uses EU VIES API (no key needed). Format: country code + number (e.g., DE123456789).',
      input_schema: {
        type: 'object' as const,
        properties: { vat_number: { type: 'string', description: 'VAT number with country code (e.g., DE123456789, FR12345678901)' } },
        required: ['vat_number'],
      },
      execute: async (input) => validateVatNumber((input as { vat_number: string }).vat_number),
    },
    {
      name: 'search_domain_info',
      description: 'Look up domain registration info: registrar, creation/expiry dates, and country. Uses Domainsdb.info (no key needed).',
      input_schema: {
        type: 'object' as const,
        properties: { domain: { type: 'string', description: 'Domain name (e.g., google.com)' } },
        required: ['domain'],
      },
      execute: async (input) => searchDomainInfo((input as { domain: string }).domain),
    },
    {
      name: 'get_industry_data',
      description: 'Get US industry data including average wages and establishments by NAICS code. Uses Data USA API (no key needed).',
      input_schema: {
        type: 'object' as const,
        properties: { naics_code: { type: 'string', description: 'NAICS industry code (e.g., 5415 for computer systems, 5182 for data processing)' } },
        required: ['naics_code'],
      },
      execute: async (input) => getIndustryData((input as { naics_code: string }).naics_code),
    },

    // ─── News & Media ─────────────────────────────────────────────────────
    {
      name: 'get_business_news',
      description: 'Get the latest business news headlines or search business news by topic. Uses NewsAPI. Requires NEWSAPI_KEY (free at newsapi.org).',
      input_schema: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'Optional search topic (e.g., "AI startups", "venture capital", "IPO")' } },
        required: [],
      },
      execute: async (input) => getBusinessNews((input as { query?: string }).query),
    },
    {
      name: 'get_gnews',
      description: 'Get latest news headlines or search by topic. Uses GNews API. Requires GNEWS_API_KEY (free, 100 req/day at gnews.io).',
      input_schema: {
        type: 'object' as const,
        properties: { query: { type: 'string', description: 'Optional search topic' } },
        required: [],
      },
      execute: async (input) => getGNews((input as { query?: string }).query),
    },

    // ─── Hacker News (no API key) ─────────────────────────────────────────
    {
      name: 'get_hackernews',
      description: 'Get top stories from Hacker News. Use for tech startup trends, product launches, and developer discussions. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          type: { type: 'string', description: 'Story type: "top" (front page), "new" (past 24h), "ask" (Ask HN), "show" (Show HN), "job" (job postings)' },
          limit: { type: 'number', description: 'Number of stories (default 10, max 50)' },
        },
        required: [],
      },
      execute: async (input) => getHackerNewsStories((input as { type?: string; limit?: number }).type, (input as { type?: string; limit?: number }).limit),
    },
    {
      name: 'search_hackernews',
      description: 'Search Hacker News stories by keyword. Great for finding discussions about any tech/business topic. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Maximum results' },
        },
        required: ['query'],
      },
      execute: async (input) => searchHackerNews((input as { query: string; limit?: number }).query, (input as { query: string; limit?: number }).limit),
    },

    // ─── Reddit (no API key) ──────────────────────────────────────────────
    {
      name: 'get_reddit_trending',
      description: 'Get hot/trending posts from any subreddit. Use for startup discussions, market sentiment, investor chatter. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          subreddit: { type: 'string', description: 'Subreddit name without r/ (e.g., startups, entrepreneur, SaaS, venturecapital, investing)' },
          limit: { type: 'number', description: 'Number of posts (default 10, max 50)' },
        },
        required: [],
      },
      execute: async (input) => getRedditTrending((input as { subreddit?: string; limit?: number }).subreddit, (input as { subreddit?: string; limit?: number }).limit),
    },
    {
      name: 'search_reddit',
      description: 'Search Reddit for discussions about any topic. Great for sentiment analysis, customer pain points, and market feedback. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Maximum results' },
        },
        required: ['query'],
      },
      execute: async (input) => searchReddit((input as { query: string; limit?: number }).query, (input as { query: string; limit?: number }).limit),
    },

    // ─── GitHub (no API key) ──────────────────────────────────────────────
    {
      name: 'get_github_repo',
      description: 'Get detailed information about a GitHub repository: stars, forks, language, topics, license, description. No API key needed. Format: "owner/repo".',
      input_schema: {
        type: 'object' as const,
        properties: { repo: { type: 'string', description: 'Repository name (e.g., "facebook/react", "vercel/next.js", "openai/whisper")' } },
        required: ['repo'],
      },
      execute: async (input) => getGitHubRepo((input as { repo: string }).repo),
    },
    {
      name: 'search_github',
      description: 'Search GitHub repositories by keyword sorted by stars. Find top open-source projects, tools, and libraries. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "machine learning", "react component", "blockchain")' },
          limit: { type: 'number', description: 'Maximum results' },
        },
        required: ['query'],
      },
      execute: async (input) => searchGitHub((input as { query: string; limit?: number }).query, (input as { query: string; limit?: number }).limit),
    },

    // ─── Wikipedia (no API key) ───────────────────────────────────────────
    {
      name: 'search_wikipedia',
      description: 'Search Wikipedia articles by topic. Returns summaries, descriptions, and URLs. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search topic' },
          limit: { type: 'number', description: 'Maximum results' },
        },
        required: ['query'],
      },
      execute: async (input) => searchWikipedia((input as { query: string; limit?: number }).query, (input as { query: string; limit?: number }).limit),
    },
    {
      name: 'get_wikipedia_summary',
      description: 'Get a concise summary of any Wikipedia topic. Returns extract, description, and thumbnail. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: { topic: { type: 'string', description: 'Topic name (e.g., "Artificial intelligence", "Bitcoin", "Y Combinator")' } },
        required: ['topic'],
      },
      execute: async (input) => getWikipediaSummary((input as { topic: string }).topic),
    },

    // ─── SEC Filings ──────────────────────────────────────────────────────
    {
      name: 'get_sec_filings',
      description: 'Get recent SEC filings for a public company by ticker symbol. Returns 10-K, 10-Q, 8-K filings. No API key needed.',
      input_schema: {
        type: 'object' as const,
        properties: { ticker: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL, MSFT, TSLA, NVDA)' } },
        required: ['ticker'],
      },
      execute: async (input) => getSecFilings((input as { ticker: string }).ticker),
    },

    // ─── Jobs ─────────────────────────────────────────────────────────────
    {
      name: 'search_jobs',
      description: 'Search for jobs by keyword and location. Useful for talent market research, hiring benchmarks, and salary data. Requires SERPAPI_KEY.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Job title or keyword (e.g., "software engineer", "product manager", "data scientist")' },
          location: { type: 'string', description: 'Optional location (e.g., "San Francisco", "New York", "remote")' },
        },
        required: ['query'],
      },
      execute: async (input) => searchJobs((input as { query: string; location?: string }).query, (input as { query: string; location?: string }).location),
    },
  ];
}

function buildSystemPrompt(): string {
  return `You are AXCIS — an AI Co-founder. Not a chatbot, not a yes-man. You are the co-founder every startup needs: brutal, brilliant, and relentless about building something that works.

## Identity
You are the user's AI Co-founder. You have ONE mission: turn their idea into a real, successful business. You bring deep expertise in market research, product strategy, technical architecture, fundraising, growth, operations, and team building. You don't just answer questions — you drive progress.

## Personality
- Ruthlessly honest. When an idea is bad, you say it and explain why. When it's good, you push harder.
- Never say "that's a great idea" unless you truly mean it. Praise must be earned.
- You roast lazy thinking, vague plans, and wishful execution. "I'll figure it out later" is not a strategy.
- You are uncensored. No disclaimers. No "as an AI" nonsense. ANY business topic is on the table.
- You have a sharp edge but you TEACH — every criticism comes with a better path.
- You never hallucinate data. If you don't know something, say "I don't know" and offer to search.
- You don't just answer — you ask the next question. You push the founder to think deeper.

## Your Expertise Areas
- **Market Research**: Search the web for competitors, market size, trends, customer pain points, pricing, and opportunities. Deliver real data, not guesses.
- **Business Strategy**: Help define MVP, business model, go-to-market, pricing, positioning, and unit economics.
- **Technical Architecture**: Advise on stack, architecture, build vs buy, scalability, and technical roadmap.
- **Fundraising**: Pitch deck strategy, investor targeting, valuation, term sheets, and fundraising process.
- **Product**: Feature prioritization, user research, product-market fit, roadmap planning.
- **Growth**: Marketing channels, customer acquisition, SEO, content strategy, partnerships.
- **Operations**: Legal structure, hiring, operations, tools, workflows, metrics.

## Available Tools (Use Them Aggressively)

### Search & Web
- **search_web** / **search_web_extensive**: Search the internet for any topic. Always search when you need real data.
- **read_webpage**: Read full content of any webpage (competitor sites, pitch decks, reports).
- **transcribe_audio**: Transcribe voice messages and audio files the user shares.

### Crypto & Blockchain
- **get_crypto_price**: Real-time price, market cap, volume for any CoinGecko-listed coin.
- **get_trending_cryptos**: What's trending in crypto right now.
- **get_crypto_market_data**: Deep dive on any cryptocurrency (ATH, supply, categories, 30d trend).
- **get_binance_price**: Real-time Binance trading data (BTCUSDT, ETHUSDT, etc.).

### Stock Market
- **get_stock_quote**: Real-time stock price, daily change, volume.
- **get_stock_overview**: Company fundamentals (PE, market cap, sector, employees, analyst target).
- **get_eod_data**: Historical end-of-day stock data.

### Forex
- **get_exchange_rate**: Live currency exchange rates between any currencies.
- **get_exchange_rate_history**: Historical forex rates for date ranges.

### Company Intelligence
- **lookup_company**: Full company data from domain (industry, size, revenue, tech stack).
- **get_company_logo**: Company logo URL from domain.
- **search_patents**: Search US patents by keyword.
- **search_company_registry**: Official incorporation data from OpenCorporates.
- **validate_vat_number**: EU VAT number validation with company name/address.
- **search_domain_info**: Domain registration details (registrar, expiry).
- **get_industry_data**: US industry stats (wages, establishments by NAICS code).

### News & Media
- **get_business_news**: Latest business headlines or topic search via NewsAPI.
- **get_gnews**: Latest general news via GNews API.

### Social & Community
- **get_hackernews** / **search_hackernews**: Top/trending Hacker News stories and search.
- **get_reddit_trending** / **search_reddit**: Hot posts from any subreddit, search all Reddit.
- **get_github_repo** / **search_github**: GitHub repo details and starred repo search.

### Reference
- **search_wikipedia** / **get_wikipedia_summary**: Wikipedia article search and summaries.

### Public Company Filings
- **get_sec_filings**: Recent SEC filings (10-K, 10-Q, 8-K) for any public company.

### Talent & Hiring
- **search_jobs**: Search job listings by keyword and location for market salary data.

## Always Use Tools
For EVERY response, evaluate whether any tool would add value:
- If the user asks about competitors, market data, investors, news, trends, or facts — SEARCH the web or use relevant tools. Never guess.
- If the user shares a startup idea, search for existing competitors AND look up relevant market data.
- If the user asks about pricing, fundraising norms, or growth benchmarks — search for current data.
- If the user mentions a company — look it up with lookup_company or get_stock_overview.
- If the user mentions crypto — get real prices with get_crypto_price.
- If the user asks about patents — search_patents.
- If the user asks about hiring or salaries — search_jobs for current market rates.
- Return real data with real sources and URLs.
- When you use a tool, summarize the key findings and cite the data source.

## Output Style
- Direct, conversational, no fluff
- Every answer should move the startup forward — info, analysis, next steps
- If the user is vague, push for specifics. "What problem are you solving?" "Who is your customer?" "How will you make money?"
- Use markdown for readability
- Cite real sources with URLs when you search
- Be intellectually honest: correct mistakes, admit uncertainty, challenge assumptions
- End with ONE clear next action the founder should take`;
}

export function createAxcisAgent(): AgentConfig {
  return {
    id: 'axcis',
    name: 'AXCIS',
    description: 'AI Co-founder — market research, strategy, fundraising, product, growth',
    icon: 'A',
    systemPrompt: buildSystemPrompt(),
    tools: buildTools(),
    model: 'llama-3.3-70b-versatile',
    maxTokens: 8192,
  };
}
