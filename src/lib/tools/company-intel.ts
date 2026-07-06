import axios from 'axios';

// ─── Clearbit Company Logo (no API key needed for URL) ──────────────────────

export async function getCompanyLogo(domain: string): Promise<string> {
  try {
    const d = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return JSON.stringify({
      domain: d,
      logo_url: `https://logo.clearbit.com/${d}`,
      note: 'Use this logo URL directly in an <img> tag. If it 404s, the company may not have a logo on Clearbit.',
    });
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Clearbit Company API (free tier, needs API key) ────────────────────────

export async function lookupCompanyByDomain(domain: string): Promise<string> {
  const apiKey = process.env.CLEARBIT_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'Clearbit API key not configured. Set CLEARBIT_KEY in your environment. Get a free key at https://dashboard.clearbit.com/signup';
  }
  try {
    const d = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const res = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
      params: { domain: d },
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const data = res.data;
    if (!data || !data.name) return `No company data found for domain "${d}".`;
    return JSON.stringify({
      name: data.name,
      legal_name: data.legalName,
      domain: data.domain,
      description: data.description?.substring(0, 500),
      category: {
        sector: data.category?.sector,
        industry_group: data.category?.industryGroup,
        industry: data.category?.industry,
        sub_industry: data.category?.subIndustry,
      },
      location: {
        city: data.geo?.city,
        state: data.geo?.state,
        country: data.geo?.countryCode,
      },
      metrics: {
        estimated_employees: data.metrics?.employees,
        estimated_annual_revenue: data.metrics?.estimatedAnnualRevenue,
        market_cap: data.metrics?.marketCap,
        raised: data.metrics?.raised,
      },
      tech: data.tech,
      site: {
        email_addresses: data.site?.emailAddresses,
        phone_numbers: data.site?.phoneNumbers,
      },
      tags: data.tags,
      founded_year: data.foundedYear,
      logo: data.logo,
      crunchbase_url: data.crunchbase,
    });
  } catch (err) {
    return `Error looking up company: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── USPTO Patent Search (no API key needed) ─────────────────────────────────

export async function searchPatents(query: string, limit: number = 10): Promise<string> {
  try {
    const res = await axios.post(
      'https://developer.uspto.gov/ds-api/patent/search',
      {
        q: query,
        fl: ['patentTitle', 'patentNumber', 'patentDate', 'inventorName', 'assignee', 'abstractText'],
        rows: Math.min(limit, 50),
        start: 0,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    const docs = res.data?.patentDocuments || res.data?.docs || [];
    if (docs.length === 0) return `No patents found for "${query}".`;
    const results = docs.map((d: Record<string, string>) => ({
      title: d.patentTitle,
      number: d.patentNumber,
      date: d.patentDate,
      inventor: d.inventorName,
      assignee: d.assignee,
      abstract: d.abstractText?.substring(0, 300),
    }));
    return JSON.stringify({ query, total: results.length, patents: results });
  } catch (err) {
    return `Error searching patents: ${err instanceof Error ? err.message : 'Unknown error'}. Try a simpler query.`;
  }
}

// ─── Domainsdb.info (no API key) ─────────────────────────────────────────────

export async function searchDomainInfo(domain: string): Promise<string> {
  try {
    const d = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const res = await axios.get('https://api.domainsdb.info/v1/domains/search', {
      params: { domain: d, limit: 10 },
      timeout: 10000,
    });
    const domains = res.data?.domains || [];
    if (domains.length === 0) return `No domain info found for "${d}".`;
    return JSON.stringify(domains.map((x: Record<string, string>) => ({
      domain: x.domain,
      country: x.country,
      registrar: x.registrar,
      create_date: x.create_date,
      update_date: x.update_date,
      expire_date: x.expire_date,
    })));
  } catch (err) {
    return `Error searching domain info: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── Data USA (no API key, US public data) ───────────────────────────────────

export async function getIndustryData(industry: string): Promise<string> {
  try {
    const res = await axios.get('https://api.datausa.io/api/', {
      params: {
        measure: 'Average Wage,Establishments,Total Population',
        drilldowns: 'Industry',
        NAICS_2017: industry,
        year: 'latest',
      },
      timeout: 10000,
    });
    const data = res.data?.data || [];
    if (data.length === 0) return `No data found for industry code "${industry}". Try a NAICS code.`;
    return JSON.stringify(data.slice(0, 20));
  } catch (err) {
    return `Error fetching industry data: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── OpenCorporates (free tier, needs API key) ───────────────────────────────

export async function searchCompanyRegistry(companyName: string, jurisdiction?: string): Promise<string> {
  const apiKey = process.env.OPENCORPORATES_KEY;
  if (!apiKey || apiKey.startsWith('your-')) {
    return 'OpenCorporates API key not configured. Set OPENCORPORATES_KEY. Get a free key at https://opencorporates.com/api_accounts/new';
  }
  try {
    const params: Record<string, string | number> = {
      q: companyName,
      api_token: apiKey,
      per_page: 10,
    };
    if (jurisdiction) params.jurisdiction_code = jurisdiction;
    const res = await axios.get('https://api.opencorporates.com/v0.4/companies/search', {
      params,
      timeout: 10000,
    });
    const results = res.data?.results?.companies || [];
    if (results.length === 0) return `No company registry results for "${companyName}".`;
    return JSON.stringify(results.map((r: { company: Record<string, unknown> }) => ({
      name: r.company.name,
      number: r.company.company_number,
      jurisdiction: r.company.jurisdiction_code,
      status: r.company.current_status,
      type: r.company.company_type,
      incorporation_date: r.company.incorporation_date,
      address: r.company.registered_address_in_full,
      url: r.company.url,
    })));
  } catch (err) {
    return `Error searching company registry: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

// ─── EU VAT Validation (no API key needed) ───────────────────────────────────

export async function validateVatNumber(vatNumber: string): Promise<string> {
  try {
    const vat = vatNumber.toUpperCase().trim().replace(/\s/g, '');
    const countryCode = vat.substring(0, 2);
    const number = vat.substring(2);
    const res = await axios.get(`https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number`, {
      params: { vatCountry: countryCode, vatNumber: number },
      timeout: 10000,
    });
    const d = res.data;
    return JSON.stringify({
      valid: d.isValid || d.valid,
      name: d.name || d.traderName,
      address: d.address || d.traderAddress,
      country: d.vatCountry || countryCode,
      vat_number: vat,
      request_date: d.requestDate || d.date,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      return `VAT validation service unavailable or invalid format. Use format like "DE123456789" or "FR12345678901".`;
    }
    return `Error validating VAT: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}
