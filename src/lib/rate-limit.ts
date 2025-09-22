export async function rateLimit(request: Request, limit = 20, windowSeconds = 60) {
  const cache = caches.default;
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const url = new URL(request.url);
  const cacheKey = new Request(`https://rate-limit.ma${url.pathname}?ip=${ip}`, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  const now = Date.now();
  let entry = { count: 0, expires: now + windowSeconds * 1000 };
  if (cached) {
    try {
      const body = await cached.json();
      if (body.expires > now) {
        entry = body;
      }
    } catch (error) {
      console.error('Rate-limit cache parse error', error);
    }
  }
  entry.count += 1;
  const response = new Response(JSON.stringify(entry), {
    headers: {
      'Cache-Control': `max-age=${windowSeconds}`
    }
  });
  await cache.put(cacheKey, response);
  return entry.count <= limit;
}
