import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type PinManifestEntry = {
  cid: string;
  bytes: number;
  pinnedAt: number;
  gateway?: string;
};

export type PinManifest = {
  version: 1;
  entries: PinManifestEntry[];
};

const DEFAULT_GATEWAYS = [
  'https://storacha.network/ipfs/{cid}',
  'https://ipfs.io/ipfs/{cid}',
  'https://{cid}.ipfs.dweb.link',
];

export function normalizeCid(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  const m = s.match(/(?:ipfs:\/\/|\/ipfs\/)([a-zA-Z0-9]+)/i);
  if (m?.[1]) return m[1];
  if (/^[a-zA-Z0-9]+$/.test(s) && s.length >= 32) return s;
  return null;
}

function gatewayUrl(template: string, cid: string, subpath = ''): string {
  const base = template.replace(/\{cid\}/g, cid).replace(/\/$/, '');
  if (!subpath) return base;
  const path = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${base}${path}`;
}

function cidFileName(cid: string): string {
  return createHash('sha256').update(cid).digest('hex').slice(0, 32);
}

export class PinStore {
  private readonly root: string;
  private manifest: PinManifest = { version: 1, entries: [] };
  private loaded = false;

  constructor(rootDir: string) {
    this.root = rootDir;
  }

  private manifestPath(): string {
    return join(this.root, 'manifest.json');
  }

  private objectPath(cid: string): string {
    return join(this.root, cidFileName(cid));
  }

  async init(): Promise<void> {
    if (this.loaded) return;
    await mkdir(this.root, { recursive: true });
    try {
      const raw = await readFile(this.manifestPath(), 'utf8');
      const parsed = JSON.parse(raw) as PinManifest;
      if (parsed?.version === 1 && Array.isArray(parsed.entries)) {
        this.manifest = parsed;
      }
    } catch {
      this.manifest = { version: 1, entries: [] };
    }
    this.loaded = true;
  }

  async saveManifest(): Promise<void> {
    await writeFile(this.manifestPath(), JSON.stringify(this.manifest, null, 2), 'utf8');
  }

  listCids(): string[] {
    return this.manifest.entries.map((e) => e.cid);
  }

  stats(): { count: number; bytes: number } {
    const bytes = this.manifest.entries.reduce((sum, e) => sum + (e.bytes || 0), 0);
    return { count: this.manifest.entries.length, bytes };
  }

  has(cid: string): boolean {
    return this.manifest.entries.some((e) => e.cid === cid);
  }

  async read(cid: string): Promise<{ body: Buffer; contentType: string } | null> {
    await this.init();
    if (!this.has(cid)) return null;
    try {
      const body = await readFile(this.objectPath(cid));
      const contentType = detectContentType(body);
      return { body, contentType };
    } catch {
      return null;
    }
  }

  async warm(
    cid: string,
    gateways: string[] = DEFAULT_GATEWAYS,
    subpath = '',
  ): Promise<boolean> {
    await this.init();
    const norm = normalizeCid(cid);
    if (!norm) return false;
    if (this.has(norm)) return true;

    for (const template of gateways) {
      const url = gatewayUrl(template, norm, subpath);
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: '*/*', 'User-Agent': 'Kasparex-Krex-Node/1.0' },
          signal: AbortSignal.timeout(25_000),
        });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0) continue;
        await writeFile(this.objectPath(norm), buf);
        this.manifest.entries.push({
          cid: norm,
          bytes: buf.length,
          pinnedAt: Date.now(),
          gateway: template,
        });
        await this.saveManifest();
        return true;
      } catch {
        // try next gateway
      }
    }
    return false;
  }
}

function detectContentType(body: Buffer): string {
  if (body.length >= 2 && body[0] === 0xff && body[1] === 0xd8) return 'image/jpeg';
  if (body.length >= 8 && body.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (body.length >= 4 && body.subarray(0, 4).toString() === '%PDF') return 'application/pdf';
  try {
    const text = body.toString('utf8').trim();
    if (text.startsWith('{') || text.startsWith('[')) return 'application/json';
  } catch {
    // ignore
  }
  return 'application/octet-stream';
}

let storesByRoot = new Map<string, PinStore>();

export function getPinStore(rootDir: string): PinStore {
  let store = storesByRoot.get(rootDir);
  if (!store) {
    store = new PinStore(rootDir);
    storesByRoot.set(rootDir, store);
  }
  return store;
}

export async function pinStoreStats(rootDir: string): Promise<{ count: number; bytes: number }> {
  const store = getPinStore(rootDir);
  await store.init();
  return store.stats();
}
