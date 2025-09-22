const ALLOWED_ORIGIN = 'https://ma-malnukananga.sch.id';

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      ...init?.headers
    },
    status: init?.status ?? 200
  });
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN
    },
    status
  });
}
