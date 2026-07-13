import type { NodeType } from '@/lib/nodes/types';

/** User-facing labels. API/config role slug stays `mirror` for compatibility. */
export const KREX_NODE_ROLE_UI: Record<
  NodeType,
  { title: string; short: string; tagline: string }
> = {
  light: {
    title: 'Light node',
    short: 'Light',
    tagline: 'Heartbeats and local pin cache only. No HTTP server.',
  },
  mirror: {
    title: 'Serve node',
    short: 'Serve',
    tagline: 'Light + a small HTTP server on your machine. Public HTTPS URL is optional and separate.',
  },
  super: {
    title: 'Super node',
    short: 'Super',
    tagline: 'Higher capacity when enabled for your operator account.',
  },
};

export function isPublicServeUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1';
  } catch {
    return false;
  }
}

export function serveVisibilityLabel(url: string | undefined | null): 'local' | 'public' {
  return isPublicServeUrl(url) ? 'public' : 'local';
}
