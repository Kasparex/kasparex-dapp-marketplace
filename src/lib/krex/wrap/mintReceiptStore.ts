import { promises as fs } from 'fs';
import path from 'path';
import {
  MINT_RECEIPTS_TN10_PATH,
  emptyMintReceiptStore,
  normalizeMintReceiptStore,
  type KrexWrapMintReceiptStore,
} from './mintReceipts';
import type { MigrateAttestation } from './migrateV2';

const githubPath = MINT_RECEIPTS_TN10_PATH;
const attestationsPath = 'data/krex-wrap/attestations-tn10.json';
export const MIGRATE_MINT_TIP_TN10_PATH = 'data/krex-wrap/migrate-mint-tip-tn10.json';

/** Live KCC20Migrate tip for chaining attestor auto-mints (TN10 soak). */
export type MigrateMintTip = {
  network?: 'testnet-10';
  updatedAt?: string;
  minterTxId: string;
  minterIndex: number;
  minterAddress: string;
  controllerTxId: string;
  controllerIndex: number;
  controllerAddress: string;
  remainingAllowance: string;
  assetCovenantId: string;
  controllerCovenantId: string;
  lastBurnTxId?: string;
};

function normalizeMigrateMintTip(raw: unknown): MigrateMintTip | null {
  const o = (raw && typeof raw === 'object' ? raw : null) as Partial<MigrateMintTip> | null;
  if (!o) return null;
  const minterTxId = typeof o.minterTxId === 'string' ? o.minterTxId.trim().toLowerCase() : '';
  const controllerTxId =
    typeof o.controllerTxId === 'string' ? o.controllerTxId.trim().toLowerCase() : '';
  const minterAddress = typeof o.minterAddress === 'string' ? o.minterAddress.trim() : '';
  const controllerAddress =
    typeof o.controllerAddress === 'string' ? o.controllerAddress.trim() : '';
  const remainingAllowance =
    typeof o.remainingAllowance === 'string'
      ? o.remainingAllowance.trim()
      : typeof o.remainingAllowance === 'number'
        ? String(o.remainingAllowance)
        : '';
  const assetCovenantId =
    typeof o.assetCovenantId === 'string' ? o.assetCovenantId.trim().toLowerCase() : '';
  const controllerCovenantId =
    typeof o.controllerCovenantId === 'string' ? o.controllerCovenantId.trim().toLowerCase() : '';
  if (
    !/^[a-f0-9]{64}$/.test(minterTxId) ||
    !/^[a-f0-9]{64}$/.test(controllerTxId) ||
    !minterAddress ||
    !controllerAddress ||
    !remainingAllowance ||
    !/^[a-f0-9]{64}$/.test(assetCovenantId) ||
    !/^[a-f0-9]{64}$/.test(controllerCovenantId)
  ) {
    return null;
  }
  const lastBurn =
    typeof o.lastBurnTxId === 'string' ? o.lastBurnTxId.trim().toLowerCase() : undefined;
  return {
    network: 'testnet-10',
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    minterTxId,
    minterIndex: Number(o.minterIndex ?? 0),
    minterAddress,
    controllerTxId,
    controllerIndex: Number(o.controllerIndex ?? 2),
    controllerAddress,
    remainingAllowance,
    assetCovenantId,
    controllerCovenantId,
    ...(lastBurn && /^[a-f0-9]{64}$/.test(lastBurn) ? { lastBurnTxId: lastBurn } : {}),
  };
}

export type AttestationStoreFile = {
  network: 'testnet-10';
  updatedAt: string;
  attestations: MigrateAttestation[];
};

function emptyAttestationStore(): AttestationStoreFile {
  return { network: 'testnet-10', updatedAt: new Date().toISOString(), attestations: [] };
}

function normalizeAttestationStore(raw: unknown): AttestationStoreFile {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<AttestationStoreFile>;
  const attestations = Array.isArray(o.attestations) ? (o.attestations as MigrateAttestation[]) : [];
  return {
    network: 'testnet-10',
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    attestations,
  };
}

function localPath(): string {
  return path.join(process.cwd(), MINT_RECEIPTS_TN10_PATH);
}

async function readLocalFile(): Promise<KrexWrapMintReceiptStore | null> {
  try {
    const raw = await fs.readFile(localPath(), 'utf8');
    return normalizeMintReceiptStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function fetchGithubFile(): Promise<{ store: KrexWrapMintReceiptStore; sha?: string } | null> {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  if (!githubToken) return null;

  const res = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${githubPath}`,
    {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    },
  );
  if (res.status === 404) return { store: emptyMintReceiptStore(), sha: undefined };
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string };
  if (!data.content) return { store: emptyMintReceiptStore(), sha: data.sha };
  const decoded = Buffer.from(data.content, (data.encoding as BufferEncoding) || 'base64').toString(
    'utf8',
  );
  return { store: normalizeMintReceiptStore(JSON.parse(decoded)), sha: data.sha };
}

/** Prefer GitHub (live after watcher POST), else deployment file. */
export async function loadMintReceiptStore(): Promise<KrexWrapMintReceiptStore> {
  const fromGh = await fetchGithubFile();
  if (fromGh?.store) return fromGh.store;
  const local = await readLocalFile();
  return local || emptyMintReceiptStore();
}

export async function persistMintReceiptStore(store: KrexWrapMintReceiptStore): Promise<{
  ok: boolean;
  via: 'github' | 'local' | 'none';
  error?: string;
}> {
  const body = `${JSON.stringify(store, null, 2)}\n`;
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';

  if (githubToken) {
    try {
      const current = await fetchGithubFile();
      const content = Buffer.from(body, 'utf8').toString('base64');
      const updateResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${githubPath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore(bridge): upsert TN10 TKREX mint receipt (${store.updatedAt})`,
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
      error: 'GITHUB_TOKEN required on Vercel to persist mint receipts',
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

function attestLocalPath(): string {
  return path.join(process.cwd(), attestationsPath);
}

async function readAttestLocalFile(): Promise<AttestationStoreFile | null> {
  try {
    const raw = await fs.readFile(attestLocalPath(), 'utf8');
    return normalizeAttestationStore(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function fetchAttestGithubFile(): Promise<{
  store: AttestationStoreFile;
  sha?: string;
} | null> {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  if (!githubToken) return null;

  const res = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${attestationsPath}`,
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

/** Prefer GitHub (live after attestor POST), else deployment file. */
export async function loadAttestationStore(): Promise<AttestationStoreFile> {
  const fromGh = await fetchAttestGithubFile();
  if (fromGh?.store) return fromGh.store;
  const local = await readAttestLocalFile();
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
      const current = await fetchAttestGithubFile();
      const content = Buffer.from(body, 'utf8').toString('base64');
      const updateResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${attestationsPath}`,
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
    await fs.mkdir(path.dirname(attestLocalPath()), { recursive: true });
    await fs.writeFile(attestLocalPath(), body, 'utf8');
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

function tipLocalPath(): string {
  return path.join(process.cwd(), MIGRATE_MINT_TIP_TN10_PATH);
}

async function readTipLocalFile(): Promise<MigrateMintTip | null> {
  try {
    const raw = await fs.readFile(tipLocalPath(), 'utf8');
    return normalizeMigrateMintTip(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function fetchTipGithubFile(): Promise<{ tip: MigrateMintTip | null; sha?: string } | null> {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';
  if (!githubToken) return null;

  const res = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${MIGRATE_MINT_TIP_TN10_PATH}`,
    {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    },
  );
  if (res.status === 404) return { tip: null, sha: undefined };
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string };
  if (!data.content) return { tip: null, sha: data.sha };
  const decoded = Buffer.from(data.content, (data.encoding as BufferEncoding) || 'base64').toString(
    'utf8',
  );
  return { tip: normalizeMigrateMintTip(JSON.parse(decoded)), sha: data.sha };
}

/** Prefer GitHub (live after attestor mint), else deployment file. */
export async function loadMigrateMintTip(): Promise<MigrateMintTip | null> {
  const fromGh = await fetchTipGithubFile();
  if (fromGh) return fromGh.tip;
  return readTipLocalFile();
}

export async function persistMigrateMintTip(tipInput: unknown): Promise<{
  ok: boolean;
  via: 'github' | 'local' | 'none';
  tip?: MigrateMintTip;
  error?: string;
}> {
  const tip = normalizeMigrateMintTip({
    ...(typeof tipInput === 'object' && tipInput ? tipInput : {}),
    network: 'testnet-10',
    updatedAt: new Date().toISOString(),
  });
  if (!tip) {
    return { ok: false, via: 'none', error: 'Invalid migrate mint tip payload' };
  }
  const body = `${JSON.stringify(tip, null, 2)}\n`;
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';

  if (githubToken) {
    try {
      const current = await fetchTipGithubFile();
      const content = Buffer.from(body, 'utf8').toString('base64');
      const updateResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${MIGRATE_MINT_TIP_TN10_PATH}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore(bridge): upsert TN10 migrate mint tip (${tip.updatedAt})`,
            content,
            sha: current?.sha,
          }),
        },
      );
      if (updateResponse.ok) return { ok: true, via: 'github', tip };
      const err = await updateResponse.text();
      return { ok: false, via: 'github', tip, error: err.slice(0, 500) };
    } catch (e) {
      return {
        ok: false,
        via: 'github',
        tip,
        error: e instanceof Error ? e.message : 'GitHub write failed',
      };
    }
  }

  if (process.env.VERCEL) {
    return {
      ok: false,
      via: 'none',
      tip,
      error: 'GITHUB_TOKEN required on Vercel to persist migrate mint tip',
    };
  }

  try {
    await fs.mkdir(path.dirname(tipLocalPath()), { recursive: true });
    await fs.writeFile(tipLocalPath(), body, 'utf8');
    return { ok: true, via: 'local', tip };
  } catch (e) {
    return {
      ok: false,
      via: 'none',
      tip,
      error: e instanceof Error ? e.message : 'Local write failed',
    };
  }
}
