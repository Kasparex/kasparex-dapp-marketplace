type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const memoryStore = new Map<string, JsonValue>();

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

export async function leaderboardStoreGet<T>(key: string): Promise<T | null> {
  const cfg = kvConfig();
  if (!cfg) {
    return (memoryStore.get(key) as T | undefined) ?? null;
  }
  const v = await kvCommand<string>(['GET', key]);
  if (v == null) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

export async function leaderboardStoreSet<T extends JsonValue>(key: string, value: T): Promise<void> {
  const cfg = kvConfig();
  if (!cfg) {
    memoryStore.set(key, value);
    return;
  }
  await kvCommand(['SET', key, JSON.stringify(value)]);
}
