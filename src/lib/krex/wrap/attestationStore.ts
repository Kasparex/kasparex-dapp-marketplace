import { promises as fs } from 'fs';
import path from 'path';
import type { MigrateAttestation } from '@/lib/krex/wrap/migrateV2';

export const ATTESTATIONS_TN10_PATH = 'data/krex-wrap/attestations-tn10.json';

export type AttestationStoreFile = {
  network: 'testnet-10';
  updatedAt: string;
  attestations: MigrateAttestation[];
};

export function emptyAttestationStore(): AttestationStoreFile {
  return { network: 'testnet-10', updatedAt: new Date().toISOString(), attestations: [] };
}

export function normalizeAttestationStore(raw: unknown): AttestationStoreFile {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<AttestationStoreFile>;
  const attestations = Array.isArray(o.attestations) ? (o.attestations as MigrateAttestation[]) : [];
  return {
    network: 'testnet-10',
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    attestations,
  };
}

function localPath(): string {
  return path.join(process.cwd(), ATTESTATIONS_TN10_PATH);
}

async function readLocalFile(): Promise<AttestationStoreFile | null> {
  try {
    const raw = await fs.readFile(localPath(), 'utf8');
    return normalizeAttestationStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function fetchGithubFile(): Promise<{ store: AttestationStoreFile; sha?: string } | null> {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  if (!githubToken) return null;

  const res = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${ATTESTATIONS_TN10_PATH}`,
    {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    },
  );
  if (res.status === 404) return { store: emptyAttestationStore(), sha: undefined };
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string };
  if (!data.content) return { store: emptyAttestationStore(), sha: data.sha };
  const decoded = Buffer.from(data.content, (data.encoding as BufferEncoding) || 'base64').toString(
    'utf8',
  );
  return { store: normalizeAttestationStore(JSON.parse(decoded)), sha: data.sha };
}

export async function loadAttestationStore(): Promise<AttestationStoreFile> {
  const fromGh = await fetchGithubFile();
  if (fromGh?.store) return fromGh.store;
  const local = await readLocalFile();
  return local || emptyAttestationStore();
}

export async function persistAttestationStore(store: AttestationStoreFile): Promise<{
  ok: boolean;
  via: 'github' | 'local' | 'none';
  error?: string;
}> {
  const normalized = normalizeAttestationStore({
    ...store,
    updatedAt: new Date().toISOString(),
  });
  const body = `${JSON.stringify(normalized, null, 2)}\n`;
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';

  if (githubToken) {
    try {
      const current = await fetchGithubFile();
      const content = Buffer.from(body, 'utf8').toString('base64');
      const updateResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${ATTESTATIONS_TN10_PATH}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore(bridge): upsert TN10 migrate attestation (${normalized.updatedAt})`,
            content,
            sha: current?.sha,
          }),
        },
      );
      if (updateResponse.ok) return { ok: true, via: 'github' };
      const err = await updateResponse.text();
      return { ok: false, via: 'github', error: err.slice(0, 500) };
    } catch (e) {
      return {
        ok: false,
        via: 'github',
        error: e instanceof Error ? e.message : 'GitHub write failed',
      };
    }
  }

  if (process.env.VERCEL) {
    return {
      ok: false,
      via: 'none',
      error: 'GITHUB_TOKEN required on Vercel to persist attestations',
    };
  }

  try {
    await fs.mkdir(path.dirname(localPath()), { recursive: true });
    await fs.writeFile(localPath(), body, 'utf8');
    return { ok: true, via: 'local' };
  } catch (e) {
    return {
      ok: false,
      via: 'none',
      error: e instanceof Error ? e.message : 'Local write failed',
    };
  }
}

export async function findAttestation(burnTxHash: string): Promise<MigrateAttestation | null> {
  const store = await loadAttestationStore();
  const burn = burnTxHash.trim().toLowerCase();
  return store.attestations.find((a) => a.burnTxHash?.toLowerCase() === burn) ?? null;
}

export async function upsertAttestation(row: MigrateAttestation): Promise<{
  attestation: MigrateAttestation;
  persist: { ok: boolean; via: 'github' | 'local' | 'none'; error?: string };
}> {
  const store = await loadAttestationStore();
  const burn = row.burnTxHash.trim().toLowerCase();
  const normalized: MigrateAttestation = { ...row, burnTxHash: burn };
  const idx = store.attestations.findIndex((a) => a.burnTxHash?.toLowerCase() === burn);
  if (idx >= 0) store.attestations[idx] = { ...store.attestations[idx], ...normalized };
  else store.attestations.unshift(normalized);
  const persist = await persistAttestationStore(store);
  return { attestation: normalized, persist };
}
