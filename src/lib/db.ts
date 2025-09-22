import type { APIRoute } from 'astro';

type EnvContext = Parameters<APIRoute>[0]['locals']['runtime']['env'];

type D1 = D1Database | undefined;

export function getDB(env: EnvContext | undefined): D1 {
  if (!env || !(env as { DB?: D1Database }).DB) {
    return undefined;
  }
  return (env as { DB: D1Database }).DB;
}

export async function runStatement<T = unknown>(db: D1, query: string, params: unknown[] = []): Promise<T[]> {
  if (!db) {
    throw new Error('Database tidak tersedia');
  }
  const result = await db.prepare(query).bind(...params).all<T>();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.results ?? [];
}

export async function runExecute(db: D1, query: string, params: unknown[] = []) {
  if (!db) {
    throw new Error('Database tidak tersedia');
  }
  const result = await db.prepare(query).bind(...params).run();
  if (result.error) {
    throw new Error(result.error);
  }
  return result;
}
