export const prerender = false;
import type { APIRoute } from 'astro';
import { XMLParser } from 'fast-xml-parser';
import fallbackNews from '../../../data/news.json';
import { rateLimit } from '../../lib/rate-limit';

const DEFAULT_SOURCES = [
  'https://kemenag.go.id/rss',
  'https://madrasah.kemenag.go.id/feed'
];

function normalize(items: any[], sourceName: string) {
  return items
    .filter(Boolean)
    .map((item) => ({
      title: item.title ?? 'Tanpa judul',
      link: item.link ?? item.guid ?? '#',
      source: sourceName,
      published_at: item.pubDate ?? item.published ?? new Date().toISOString(),
      summary: item.description ?? item.summary ?? ''
    }));
}

export const GET: APIRoute = async ({ request, locals }) => {
  if (!(await rateLimit(request, 60, 60))) {
    return new Response(JSON.stringify({ success: false, error: 'Terlalu banyak permintaan.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, cached);
  }

  const env = locals.runtime?.env as { NEWS_SOURCES?: string } | undefined;
  const sources = env?.NEWS_SOURCES?.split(',').map((s) => s.trim()).filter(Boolean) ?? DEFAULT_SOURCES;
  const parser = new XMLParser({ ignoreAttributes: false });
  const aggregated: any[] = [];

  for (const url of sources) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MA Malnu Kananga Aggregator' } });
      if (!res.ok) throw new Error('Respon buruk');
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const channel = parsed.rss?.channel ?? parsed.feed;
      let items: any[] = [];
      if (Array.isArray(channel)) {
        items = channel.flatMap((ch: any) => ch.item ?? ch.entry ?? []);
      } else if (channel) {
        items = channel.item ?? channel.entry ?? [];
      }
      if (!Array.isArray(items)) {
        items = [items].filter(Boolean);
      }
      aggregated.push(...normalize(items, new URL(url).hostname));
    } catch (error) {
      console.error('RSS fetch error', url, error);
    }
  }

  const payload = aggregated.length > 0 ? aggregated.slice(0, 12) : (fallbackNews as any[]);
  const response = new Response(JSON.stringify({ success: true, data: payload }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'max-age=21600',
      'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id'
    }
  });
  await cache.put(cacheKey, response.clone());
  return response;
};
