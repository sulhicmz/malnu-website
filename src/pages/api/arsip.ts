export const prerender = false;
import type { APIRoute } from 'astro';
import fallbackArsip from '../../../data/arsip.json';
import { rateLimit } from '../../lib/rate-limit';
import { getDB, runStatement } from '../../lib/db';
import { jsonResponse, errorResponse } from '../../lib/response';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!(await rateLimit(request))) {
    return errorResponse('Terlalu banyak permintaan.', 429);
  }
  const env = locals.runtime?.env;
  const db = getDB(env);
  if (!db) {
    return jsonResponse(fallbackArsip, {
      headers: { 'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id' }
    });
  }
  const rows = await runStatement(db, 'SELECT id, siswa_id, nama_file, url_rel, tipe_mime, diunggah_pada FROM arsip ORDER BY diunggah_pada DESC LIMIT 100');
  return jsonResponse(rows, {
    headers: { 'Access-Control-Allow-Origin': 'https://ma-malnukananga.sch.id' }
  });
};
