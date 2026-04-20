export function getKasparexWorkerBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL ||
    process.env.NEXT_PUBLIC_KASPAREX_API_URL ||
    process.env.NEXT_PUBLIC_KASPAREX_API_BASE_URL ||
    null;
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

