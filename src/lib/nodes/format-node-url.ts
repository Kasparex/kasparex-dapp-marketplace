/** Display label for node URLs in tables (hostname, truncated). */
export function formatNodeUrlDisplay(url: string, maxLen = 26): string {
  if (!url?.trim()) return '-';

  let host = url.trim();
  try {
    const normalized = /^https?:\/\//i.test(host) ? host : `https://${host}`;
    host = new URL(normalized).host;
  } catch {
    host = host.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }

  if (host.length <= maxLen) return host;

  const budget = maxLen - 1;
  const head = Math.ceil(budget * 0.5);
  const tail = budget - head;
  return `${host.slice(0, head)}…${host.slice(-tail)}`;
}

/** Ensure href works when registry stored URL without scheme. */
export function normalizeNodeUrlHref(url: string): string {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
