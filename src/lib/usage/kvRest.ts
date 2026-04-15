type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function kvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function kvCommand<T>(command: unknown[]): Promise<T | null> {
  const cfg = kvConfig();
  if (!cfg) return null;

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV request failed (${res.status})`);
  const j = (await res.json()) as { result?: T };
  return (j.result ?? null) as T | null;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = await kvCommand<string>(['GET', key]);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSet<T extends JsonValue>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds && ttlSeconds > 0) {
    // Many REST KV providers support: SET key value EX seconds
    const ok = await kvCommand<unknown>(['SET', key, JSON.stringify(value), 'EX', ttlSeconds]);
    if (ok !== null) return;
  }
  await kvCommand(['SET', key, JSON.stringify(value)]);
}

export async function kvIncr(key: string, ttlSeconds?: number): Promise<number | null> {
  const v = await kvCommand<number>(['INCR', key]);
  if (v == null) return null;
  if (ttlSeconds && ttlSeconds > 0) {
    // Best-effort expiry for per-minute counters
    await kvCommand(['EXPIRE', key, ttlSeconds]);
  }
  return v;
}

export async function kvMGet<T>(keys: string[]): Promise<(T | null)[] | null> {
  if (keys.length === 0) return [];
  const raw = await kvCommand<(string | null)[]>(['MGET', ...keys]);
  if (raw == null) return null;
  return raw.map((v) => {
    if (v == null) return null;
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  });
}

