export const prerender = false;
import type { APIRoute } from 'astro';
import QRCode from 'qrcode';
import { signToken } from '../../../lib/attendance-token';
import { errorResponse } from '../../../lib/response';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const acaraId = url.searchParams.get('acara_id');
  const validMinutes = Number(url.searchParams.get('valid')) || 60;
  if (!acaraId) {
    return errorResponse('Parameter acara_id wajib diisi.');
  }
  const env = locals.runtime?.env as { JWT_SECRET?: string } | undefined;
  const secret = env?.JWT_SECRET;
  if (!secret) {
    return errorResponse('JWT secret belum dikonfigurasi.', 500);
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    eventId: acaraId,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + validMinutes * 60
  };
  const token = await signToken(payload, secret);
  const verifyUrl = new URL('/absen', url.origin);
  verifyUrl.searchParams.set('token', token);
  const svg = await QRCode.toString(verifyUrl.toString(), {
    type: 'svg',
    color: {
      dark: '#2E7D32',
      light: '#F3FFE5'
    },
    margin: 2,
    errorCorrectionLevel: 'M'
  });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store'
    }
  });
};
