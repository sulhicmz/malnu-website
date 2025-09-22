export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import fallbackAlumni from '../../../data/alumni.json';
import { rateLimit } from '../../lib/rate-limit';
import { verifyTurnstile } from '../../lib/turnstile';
import { getDB, runStatement, runExecute } from '../../lib/db';
import { jsonResponse, errorResponse } from '../../lib/response';

const schema = z.object({
  nama: z.string().min(3),
  angkatan: z.string().regex(/^\d{4}$/),
  pekerjaan: z.string().min(2),
  kontak_opsional: z.string().optional(),
  'cf-turnstile-response': z.string().optional()
});

export const GET: APIRoute = async ({ request, locals }) => {
  if (!(await rateLimit(request))) {
    return errorResponse('Terlalu banyak permintaan.', 429);
  }
  const env = locals.runtime?.env;
  const db = getDB(env);
  if (!db) {
    return jsonResponse(fallbackAlumni, {
      headers: { 'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id' }
    });
  }
  const rows = await runStatement(db, 'SELECT id, nama, angkatan, pekerjaan, kontak_opsional FROM alumni ORDER BY dibuat_pada DESC LIMIT 100');
  return jsonResponse(rows, {
    headers: { 'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id' }
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!(await rateLimit(request, 10, 60))) {
    return errorResponse('Terlalu banyak permintaan.', 429);
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
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
    return jsonResponse(
      {
        message: 'Mode demo: data tidak tersimpan, silakan aktifkan D1.',
        stored: false
      },
      {
        headers: { 'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id' }
      }
    );
  }
  await runExecute(
    db,
    'INSERT INTO alumni (nama, angkatan, pekerjaan, kontak_opsional, dibuat_pada) VALUES (?1, ?2, ?3, ?4, datetime("now"))',
    [parsed.data.nama, parsed.data.angkatan, parsed.data.pekerjaan, parsed.data.kontak_opsional ?? null]
  );
  return jsonResponse(
    {
      message: 'Data alumni berhasil disimpan dan menunggu verifikasi admin.'
    },
    {
      headers: { 'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id' }
    }
  );
};
