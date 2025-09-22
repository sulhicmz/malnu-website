export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyTurnstile } from '../../../lib/turnstile';
import { rateLimit } from '../../../lib/rate-limit';
import { verifyToken } from '../../../lib/attendance-token';
import { getDB, runExecute } from '../../../lib/db';
import { jsonResponse, errorResponse } from '../../../lib/response';

const schema = z.object({
  nisn: z.string().regex(/^\d{10}$/),
  token: z.string().min(20),
  'cf-turnstile-response': z.string().optional()
});

function hashIp(ip: string | null): string {
  if (!ip) return 'anon';
  const data = new TextEncoder().encode(ip);
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash * 131 + data[i]) >>> 0;
  }
  return hash.toString(16);
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!(await rateLimit(request, 30, 60))) {
    return errorResponse('Terlalu banyak percobaan.', 429);
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Data tidak valid.');
  }
  const env = locals.runtime?.env as { TURNSTILE_SECRET_KEY?: string; JWT_SECRET?: string } | undefined;
  const turnstile = await verifyTurnstile(parsed.data['cf-turnstile-response'], env?.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP') ?? undefined);
  if (!turnstile.success) {
    return errorResponse(turnstile.error ?? 'Verifikasi Turnstile gagal.');
  }
  const secret = env?.JWT_SECRET;
  if (!secret) {
    return errorResponse('JWT secret belum dikonfigurasi.', 500);
  }
  let payload;
  try {
    payload = await verifyToken(parsed.data.token, secret);
  } catch (error) {
    return errorResponse((error as Error).message, 400);
  }
  const db = getDB(env);
  if (!db) {
    return jsonResponse({ stored: false, message: 'Mode demo: catat manual di spreadsheet.' });
  }
  try {
    const result = await runExecute(
      db,
      `INSERT INTO log_absen (acara_id, siswa_id, waktu_scan, user_agent, ip_hash, unik_token)
       VALUES (?1, ?2, datetime('now'), ?3, ?4, ?5)` as any,
      [
        payload.eventId,
        parsed.data.nisn,
        request.headers.get('user-agent') ?? 'unknown',
        hashIp(request.headers.get('CF-Connecting-IP')),
        payload.jti
      ]
    );
    return jsonResponse({ stored: true, waktu_scan: new Date().toISOString(), id: result.lastRowId });
  } catch (error) {
    return errorResponse('Token sudah digunakan atau tidak sah.', 400);
  }
};
