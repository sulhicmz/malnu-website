export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { rateLimit } from '../../lib/rate-limit';
import { verifyTurnstile } from '../../lib/turnstile';
import { getDB, runExecute } from '../../lib/db';
import { jsonResponse, errorResponse } from '../../lib/response';

const schema = z.object({
  nama: z.string().min(3),
  nisn: z.string().regex(/^\d{10}$/),
  ttl: z.string().min(5),
  alamat: z.string().min(10),
  kontak: z.string().min(8),
  jurusan_pilihan: z.string().min(2),
  'cf-turnstile-response': z.string().optional()
});

function hashIp(ip: string | null): string {
  if (!ip) return 'anon';
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash * 31 + data[i]) >>> 0;
  }
  return hash.toString(16);
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!(await rateLimit(request, 10, 60))) {
    return errorResponse('Terlalu banyak permintaan.', 429);
  }
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse('Data tidak valid: ' + parsed.error.errors.map((e) => e.message).join(', '));
  }
  const env = locals.runtime?.env as { TURNSTILE_SECRET_KEY?: string } | undefined;
  const turnstile = await verifyTurnstile(parsed.data['cf-turnstile-response'], env?.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP') ?? undefined);
  if (!turnstile.success) {
    return errorResponse(turnstile.error ?? 'Verifikasi Turnstile gagal.', 400);
  }
  const db = getDB(env);
  if (!db) {
    return jsonResponse({
      stored: false,
      message: 'Mode demo: Aktifkan D1 untuk menyimpan data secara permanen.'
    });
  }
  const result = await runExecute(
    db,
    `INSERT INTO ppdb (nama, nisn, ttl, alamat, kontak, jurusan_pilihan, waktu_daftar, status, ip_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), 'Menunggu', ?7)` as any,
    [
      parsed.data.nama,
      parsed.data.nisn,
      parsed.data.ttl,
      parsed.data.alamat,
      parsed.data.kontak,
      parsed.data.jurusan_pilihan,
      hashIp(request.headers.get('CF-Connecting-IP'))
    ]
  );
  const nomorPendaftaran = `PPDB-${result.lastRowId}`;
  return jsonResponse({ nomorPendaftaran, stored: true });
};
