import axios from 'axios';

// ─── CoinGecko (no API key needed) ──────────────────────────────────────────

export async function getCryptoPrice(coinId: string): Promise<string> {
  try {
    const id = coinId.toLowerCase().trim();
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
      },
      timeout: 10000,
    });
    const data = res.data[id];
    if (!data) return `No data found for "${coinId}". Try using the CoinGecko coin ID (e.g., bitcoin, ethereum, solana).`;
    return JSON.stringify({
      coin: id,
      price_usd: data.usd,
      market_cap_usd: data.usd_market_cap,
      volume_24h_usd: data.usd_24h_vol,
      change_24h_percent: data.usd_24h_change,
    });
  } catch (err) {
    return `Error fetching crypto price: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getTrendingCryptos(): Promise<string> {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 10000 });
    const coins = (res.data.coins || []).slice(0, 10).map((c: { item: Record<string, unknown> }) => ({
      name: c.item.name,
      symbol: c.item.symbol,
      coin_id: c.item.id,
      market_cap_rank: c.item.market_cap_rank,
      price_btc: c.item.price_btc,
      score: c.item.score,
    }));
    return JSON.stringify({ trending: coins });
  } catch (err) {
    return `Error fetching trending cryptos: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getCryptoMarketData(coinId: string): Promise<string> {
  try {
    const id = coinId.toLowerCase().trim();
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        community_data: false,
        developer_data: false,
      },
      timeout: 10000,
    });
    const d = res.data;
    return JSON.stringify({
      name: d.name,
      symbol: d.symbol,
      rank: d.market_cap_rank,
      current_price_usd: d.market_data?.current_price?.usd,
      market_cap_usd: d.market_data?.market_cap?.usd,
      total_volume_usd: d.market_data?.total_volume?.usd,
      high_24h_usd: d.market_data?.high_24h?.usd,
      low_24h_usd: d.market_data?.low_24h?.usd,
      price_change_24h_percent: d.market_data?.price_change_percentage_24h,
      price_change_7d_percent: d.market_data?.price_change_percentage_7d,
      price_change_30d_percent: d.market_data?.price_change_percentage_30d,
      circulating_supply: d.market_data?.circulating_supply,
      total_supply: d.market_data?.total_supply,
      max_supply: d.market_data?.max_supply,
      ath_usd: d.market_data?.ath?.usd,
      ath_date: d.market_data?.ath_date?.usd,
      categories: d.categories,
      description: d.description?.en?.substring(0, 500),
    });
  } catch (err) {
    return `Error fetching crypto market data: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Alpha Vantage (free API key needed for stocks) ──────────────────────────

export async function getStockQuote(symbol: string): Promise<string> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'Alpha Vantage API key not configured. Set ALPHA_VANTAGE_KEY in your environment. Get a free key at https://www.alphavantage.co/support/#api-key';
  }
  try {
    const sym = symbol.toUpperCase().trim();
    const res = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: sym,
        apikey: apiKey,
      },
      timeout: 10000,
    });
    const quote = res.data['Global Quote'];
    if (!quote || !quote['01. symbol']) {
      const note = res.data.Note || res.data['Error Message'] || 'No data found';
      return `No stock data for ${sym}: ${note}`;
    }
    return JSON.stringify({
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      change_percent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']),
      high_today: parseFloat(quote['03. high']),
      low_today: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previous_close: parseFloat(quote['08. previous close']),
    });
  } catch (err) {
    return `Error fetching stock quote: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getStockOverview(symbol: string): Promise<string> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'Alpha Vantage API key not configured. Set ALPHA_VANTAGE_KEY in your environment.';
  }
  try {
    const sym = symbol.toUpperCase().trim();
    const res = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'OVERVIEW',
        symbol: sym,
        apikey: apiKey,
      },
      timeout: 10000,
    });
    const d = res.data;
    if (!d || !d.Symbol) return `No company overview found for ${sym}.`;
    return JSON.stringify({
      symbol: d.Symbol,
      name: d.Name,
      description: d.Description?.substring(0, 600),
      sector: d.Sector,
      industry: d.Industry,
      market_cap: d.MarketCapitalization,
      pe_ratio: d.PERatio,
      peg_ratio: d.PEGRatio,
      dividend_yield: d.DividendYield,
      eps: d.EPS,
      beta: d.Beta,
      '52_week_high': d['52WeekHigh'],
      '52_week_low': d['52WeekLow'],
      analyst_target: d.AnalystTargetPrice,
      employees: d.FullTimeEmployees,
      country: d.Country,
      exchange: d.Exchange,
    });
  } catch (err) {
    return `Error fetching stock overview: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Frankfurter (no API key needed for forex) ───────────────────────────────

export async function getExchangeRate(from: string, to: string): Promise<string> {
  try {
    const fromC = from.toUpperCase().trim();
    const toC = to.toUpperCase().trim();
    const res = await axios.get(`https://api.frankfurter.dev/latest`, {
      params: { from: fromC, to: toC },
      timeout: 10000,
    });
    const rate = res.data.rates?.[toC];
    if (!rate) return `No exchange rate found from ${fromC} to ${toC}.`;
    return JSON.stringify({
      from: fromC,
      to: toC,
      rate,
      date: res.data.date,
      inverted: (1 / rate).toFixed(6),
    });
  } catch (err) {
    return `Error fetching exchange rate: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function getExchangeRateHistory(
  from: string,
  to: string,
  startDate: string,
  endDate?: string
): Promise<string> {
  try {
    const fromC = from.toUpperCase().trim();
    const toC = to.toUpperCase().trim();
    const end = endDate || startDate;
    const res = await axios.get(`https://api.frankfurter.dev/${startDate}..${end}`, {
      params: { from: fromC, to: toC },
      timeout: 10000,
    });
    const rates = res.data.rates;
    if (!rates || Object.keys(rates).length === 0) {
      return `No historical data found for ${fromC} to ${toC} in that range.`;
    }
    return JSON.stringify({ from: fromC, to: toC, start_date: startDate, end_date: end, rates });
  } catch (err) {
    return `Error fetching exchange rate history: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── NewsAPI (free API key needed) ───────────────────────────────────────────

export async function getBusinessNews(query?: string): Promise<string> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'NewsAPI key not configured. Set NEWSAPI_KEY in your environment. Get a free key at https://newsapi.org/register';
  }
  try {
    const params: Record<string, string | number> = {
      apiKey,
      language: 'en',
      pageSize: 10,
    };
    if (query) {
      params.q = query;
      const res = await axios.get('https://newsapi.org/v2/everything', { params, timeout: 10000 });
      const articles = (res.data.articles || []).map((a: { title?: string; source?: { name: string }; url?: string; publishedAt?: string; description?: string }) => ({
        title: a.title,
        source: a.source?.name,
        url: a.url,
        published: a.publishedAt,
        description: a.description?.substring(0, 300),
      }));
      return JSON.stringify({ total: res.data.totalResults, articles });
    } else {
      const res = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: { ...params, category: 'business', country: 'us' },
        timeout: 10000,
      });
      const articles = (res.data.articles || []).map((a: { title?: string; source?: { name: string }; url?: string; publishedAt?: string; description?: string }) => ({
        title: a.title,
        source: a.source?.name,
        url: a.url,
        published: a.publishedAt,
        description: a.description?.substring(0, 300),
      }));
      return JSON.stringify({ total: res.data.totalResults, articles });
    }
  } catch (err) {
    return `Error fetching news: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Binance public ticker (no API key needed) ───────────────────────────────

export async function getBinancePrice(symbol: string): Promise<string> {
  try {
    const sym = symbol.toUpperCase().trim().replace('-', '');
    const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      params: { symbol: sym },
      timeout: 10000,
    });
    return JSON.stringify({
      symbol: res.data.symbol,
      price: parseFloat(res.data.lastPrice),
      change_24h: parseFloat(res.data.priceChange),
      change_percent: parseFloat(res.data.priceChangePercent),
      high_24h: parseFloat(res.data.highPrice),
      low_24h: parseFloat(res.data.lowPrice),
      volume: parseFloat(res.data.volume),
      quote_volume: parseFloat(res.data.quoteVolume),
    });
  } catch (err) {
    return `Error fetching Binance price for ${symbol}. Ensure format like BTCUSDT, ETHUSDT, SOLUSDT.`;
  }
}

// ─── EOD Historical Data (free API key) ──────────────────────────────────────

export async function getEodData(symbol: string, date?: string): Promise<string> {
  const apiKey = process.env.EODHD_API_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'EODHD API key not configured. Set EODHD_API_KEY in your environment. Free tier at https://eodhd.com/';
  }
  try {
    const sym = symbol.toUpperCase().trim();
    const dt = date || 'latest';
    const res = await axios.get(`https://eodhd.com/api/eod/${sym}`, {
      params: { api_token: apiKey, fmt: 'json', date: dt },
      timeout: 10000,
    });
    return JSON.stringify(res.data);
  } catch (err) {
    return `Error fetching EOD data: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}
