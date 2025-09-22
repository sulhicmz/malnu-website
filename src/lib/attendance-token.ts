const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(data: Uint8Array) {
  let binary = '';
  data.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str: string) {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export interface AttendancePayload {
  eventId: string;
  jti: string;
  exp: number;
  iat: number;
}

export async function signToken(payload: AttendancePayload, secret: string) {
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureEncoded = base64UrlEncode(new Uint8Array(signature));
  return `${data}.${signatureEncoded}`;
}

export async function verifyToken(token: string, secret: string): Promise<AttendancePayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Format token tidak valid');
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const key = await getKey(secret);
  const signature = base64UrlDecode(signatureB64);
  const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
  if (!isValid) {
    throw new Error('Tanda tangan token tidak valid');
  }
  const payloadJson = decoder.decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadJson) as AttendancePayload;
  if (payload.exp * 1000 < Date.now()) {
    throw new Error('Token kedaluwarsa');
  }
  return payload;
}
