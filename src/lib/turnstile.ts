export async function verifyTurnstile(token: string | undefined | null, secret: string | undefined, remoteIp?: string) {
  if (!secret) {
    return { success: true, skip: true } as const;
  }
  if (!token) {
    return { success: false, error: 'Token Turnstile tidak ditemukan.' } as const;
  }
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  const data = (await result.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) {
    return { success: false, error: `Turnstile gagal: ${(data["error-codes"] ?? []).join(', ')}` } as const;
  }
  return { success: true } as const;
}
