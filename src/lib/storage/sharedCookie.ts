export type CookieOptions = {
  /** Defaults to '/' */
  path?: string;
  /** If omitted, uses a host cookie. If set, should be like '.kasparex.com'. */
  domain?: string;
  /** Seconds. If omitted, cookie becomes a session cookie. */
  maxAgeSeconds?: number;
  /** Defaults to 'Lax'. */
  sameSite?: 'Lax' | 'Strict' | 'None';
  /** Defaults to true on https. */
  secure?: boolean;
};

function isHttps(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.protocol === 'https:';
}

function defaultDomainForKasparex(): string | undefined {
  if (typeof window === 'undefined') return '.kasparex.com';
  const h = window.location.hostname.toLowerCase();
  return h.endsWith('.kasparex.com') || h === 'kasparex.com' ? '.kasparex.com' : undefined;
}

export function getSharedCookie(key: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const idx = c.indexOf('=');
    const k = idx >= 0 ? c.slice(0, idx) : c;
    if (k === key) {
      const v = idx >= 0 ? c.slice(idx + 1) : '';
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
}

export function setSharedCookie(key: string, value: string, opts?: CookieOptions): void {
  if (typeof document === 'undefined') return;
  const path = opts?.path ?? '/';
  const domain = opts?.domain ?? defaultDomainForKasparex();
  const sameSite = opts?.sameSite ?? 'Lax';
  const secure = opts?.secure ?? isHttps();

  let cookie = `${key}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (domain) cookie += `; Domain=${domain}`;
  if (secure) cookie += '; Secure';
  if (typeof opts?.maxAgeSeconds === 'number') cookie += `; Max-Age=${opts.maxAgeSeconds}`;
  document.cookie = cookie;
}

export function deleteSharedCookie(key: string, opts?: CookieOptions): void {
  // Delete by setting Max-Age=0 (also include domain/path for best coverage).
  setSharedCookie(key, '', { ...opts, maxAgeSeconds: 0 });
}

