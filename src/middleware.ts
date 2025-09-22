import type { MiddlewareHandler } from 'astro';

const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://www.google.com https://maps.google.com",
  "font-src 'self' data:",
  "form-action 'self'",
  "base-uri 'self'"
].join('; ');

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
  const url = new URL(request.url);
  const response = await next();
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  if (request.method === 'GET' && response.status === 200) {
    const isStaticAsset = /\.(?:css|js|webp|avif|svg|png|jpg|jpeg|gif|ico|woff2|json|xml|txt)$/i.test(url.pathname);
    if (isStaticAsset || url.pathname.startsWith('/_astro/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
  return response;
};
