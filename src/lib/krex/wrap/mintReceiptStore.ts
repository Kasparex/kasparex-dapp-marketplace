import { promises as fs } from 'fs';
import path from 'path';
import {
  MINT_RECEIPTS_TN10_PATH,
  emptyMintReceiptStore,
  normalizeMintReceiptStore,
  type KrexWrapMintReceiptStore,
} from './mintReceipts';
import { attestationHasTicket, type MigrateAttestation } from './migrateV2';

const githubPath = MINT_RECEIPTS_TN10_PATH;
const attestationsPath = 'data/krex-wrap/attestations-tn10.json';
export const MIGRATE_MINT_TIP_TN10_PATH = 'data/krex-wrap/migrate-mint-tip-tn10.json';

/** Template parts for claim assembly (state splice without silverc). */
export type MigrateTipTemplateParts = {
  prefixLength: number;
  suffixLength: number;
  expectedTemplateHash: string;
  templatePrefix: string;
  templateSuffix: string;
};

/** Live KCC20Migrate tip for chaining claims (TN10). */
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
  adminRenounced?: boolean;
  migrateVersion?: number;
  legacyNote?: string;
  assetTemplate?: MigrateTipTemplateParts;
  ticketTemplate?: MigrateTipTemplateParts;
  controllerTemplate?: MigrateTipTemplateParts;
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
  const asTemplate = (raw: unknown): MigrateTipTemplateParts | undefined => {
    const t = raw && typeof raw === 'object' ? (raw as Partial<MigrateTipTemplateParts>) : null;
    if (!t) return undefined;
    if (
      typeof t.prefixLength !== 'number' ||
      typeof t.suffixLength !== 'number' ||
      typeof t.expectedTemplateHash !== 'string' ||
      typeof t.templatePrefix !== 'string' ||
      typeof t.templateSuffix !== 'string'
    ) {
      return undefined;
    }
    return {
      prefixLength: t.prefixLength,
      suffixLength: t.suffixLength,
      expectedTemplateHash: t.expectedTemplateHash.trim().toLowerCase(),
      templatePrefix: t.templatePrefix.trim().toLowerCase().replace(/^0x/i, ''),
      templateSuffix: t.templateSuffix.trim().toLowerCase().replace(/^0x/i, ''),
    };
  };

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
    ...(typeof o.adminRenounced === 'boolean' ? { adminRenounced: o.adminRenounced } : {}),
    ...(typeof o.migrateVersion === 'number' ? { migrateVersion: o.migrateVersion } : {}),
    ...(typeof o.legacyNote === 'string' && o.legacyNote.trim()
      ? { legacyNote: o.legacyNote.trim() }
      : {}),
    ...(asTemplate(o.assetTemplate) ? { assetTemplate: asTemplate(o.assetTemplate) } : {}),
    ...(asTemplate(o.ticketTemplate) ? { ticketTemplate: asTemplate(o.ticketTemplate) } : {}),
    ...(asTemplate(o.controllerTemplate)
      ? { controllerTemplate: asTemplate(o.controllerTemplate) }
      : {}),
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

/** Claimed rows only; open / ticket-pending rows are never dropped. */
const MAX_CLAIMED_ATTESTATIONS = 10;

function isClaimedAttestation(row: MigrateAttestation): boolean {
  return row.status === 'claimed' || Boolean(row.mintTxHash);
}

/**
 * Keep every unclaimed attestation (users still need Claim).
 * Cap claimed history so Hub / GitHub stay lightweight.
 */
export function pruneAttestationStore(store: AttestationStoreFile): AttestationStoreFile {
  const rows = Array.isArray(store.attestations) ? store.attestations : [];
  const open: MigrateAttestation[] = [];
  const claimed: MigrateAttestation[] = [];
  for (const row of rows) {
    if (isClaimedAttestation(row)) claimed.push(row);
    else open.push(row);
  }
  claimed.sort((a, b) => String(b.attestedAt || '').localeCompare(String(a.attestedAt || '')));
  return {
    ...store,
    attestations: [...open, ...claimed.slice(0, MAX_CLAIMED_ATTESTATIONS)].sort((a, b) =>
      String(b.attestedAt || '').localeCompare(String(a.attestedAt || '')),
    ),
  };
}

function normalizeAttestationStore(raw: unknown): AttestationStoreFile {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<AttestationStoreFile>;
  const attestations = Array.isArray(o.attestations) ? (o.attestations as MigrateAttestation[]) : [];
  return pruneAttestationStore({
    network: 'testnet-10',
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    attestations,
  });
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
            message: `chore(bridge): upsert TN10 TKREX mint receipt (${store.updatedAt}) [skip vercel]`,
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

  if (githubToken) {
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
    const decoded = Buffer.from(
      data.content,
      (data.encoding as BufferEncoding) || 'base64',
    ).toString('utf8');
    return { store: normalizeAttestationStore(JSON.parse(decoded)), sha: data.sha };
  }

  // Public repo fallback: Hub can serve live tickets without GITHUB_TOKEN on Vercel.
  // Bust GitHub raw CDN cache so Confirm flips to Claim as soon as the ticket lands.
  try {
    const bust = Date.now();
    const res = await fetch(
      `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${attestationsPath}?t=${bust}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      },
    );
    if (!res.ok) return null;
    return { store: normalizeAttestationStore(await res.json()), sha: undefined };
  } catch {
    return null;
  }
}

/** Prefer GitHub (live after attestor POST), else deployment file. */
export async function loadAttestationStore(): Promise<AttestationStoreFile> {
  const fromGh = await fetchAttestGithubFile();
  if (fromGh?.store) return fromGh.store;
  const local = await readAttestLocalFile();
  return local || emptyAttestationStore();
}

function attestationPayloadEqual(a: MigrateAttestation, b: MigrateAttestation): boolean {
  const pick = (x: MigrateAttestation) =>
    JSON.stringify({
      network: x.network,
      tick: x.tick,
      burnTxHash: x.burnTxHash?.toLowerCase(),
      amountRaw: x.amountRaw,
      amount: x.amount,
      from: x.from,
      sinkAddress: x.sinkAddress,
      claimantAddress: x.claimantAddress,
      ticketId: x.ticketId,
      ticketTxId: x.ticketTxId,
      ticketIndex: x.ticketIndex,
      mintTxHash: x.mintTxHash,
      assetCovenantId: x.assetCovenantId,
      migrateVersion: x.migrateVersion,
      status: x.status,
      note: x.note,
    });
  return pick(a) === pick(b);
}

function preferRicherAttestation(
  a: MigrateAttestation,
  b: MigrateAttestation,
): MigrateAttestation {
  const aTicket = attestationHasTicket(a);
  const bTicket = attestationHasTicket(b);
  const aClaimed = a.status === 'claimed' || Boolean(a.mintTxHash);
  const bClaimed = b.status === 'claimed' || Boolean(b.mintTxHash);
  if (aClaimed && !bClaimed) return a;
  if (bClaimed && !aClaimed) return b;
  if (aTicket && !bTicket) {
    return {
      ...b,
      ...a,
      ticketId: a.ticketId,
      ticketTxId: a.ticketTxId,
      ticketIndex: a.ticketIndex,
    };
  }
  if (bTicket && !aTicket) {
    return {
      ...a,
      ...b,
      ticketId: b.ticketId,
      ticketTxId: b.ticketTxId,
      ticketIndex: b.ticketIndex,
    };
  }
  return {
    ...a,
    ...b,
    ticketId: b.ticketId || a.ticketId,
    ticketTxId: b.ticketTxId || a.ticketTxId,
    ticketIndex: b.ticketIndex ?? a.ticketIndex,
    mintTxHash: b.mintTxHash || a.mintTxHash,
    from: b.from || a.from,
    claimantAddress: b.claimantAddress || a.claimantAddress,
    status: bClaimed || aClaimed ? 'claimed' : b.status || a.status,
  };
}

/** Merge local writes onto remote so observe never wipes tickets already on main. */
function mergeAttestationStores(
  remote: AttestationStoreFile,
  local: AttestationStoreFile,
): AttestationStoreFile {
  const byBurn = new Map<string, MigrateAttestation>();
  for (const row of remote.attestations || []) {
    const key = String(row.burnTxHash || '')
      .trim()
      .toLowerCase();
    if (/^[a-f0-9]{64}$/.test(key)) byBurn.set(key, row);
  }
  for (const row of local.attestations || []) {
    const key = String(row.burnTxHash || '')
      .trim()
      .toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(key)) continue;
    const prev = byBurn.get(key);
    byBurn.set(key, prev ? preferRicherAttestation(prev, row) : row);
  }
  return {
    network: 'testnet-10',
    updatedAt: local.updatedAt || remote.updatedAt || new Date().toISOString(),
    attestations: Array.from(byBurn.values()).sort((x, y) =>
      String(y.attestedAt || '').localeCompare(String(x.attestedAt || '')),
    ),
  };
}

export async function persistAttestationStore(
  store: AttestationStoreFile,
  opts?: { force?: boolean },
): Promise<{
  ok: boolean;
  via: 'github' | 'local' | 'none' | 'skipped';
  error?: string;
}> {
  // Hub History polls observe-burn every few seconds. Persisting each poll to GitHub
  // floods main and burns the Vercel deploy queue. Skip routine polls on Vercel.
  // Ticket / claim upgrades MUST persist (force) so Confirm can flip to Claim without
  // waiting for a manual GHA git sync.
  if (process.env.KREX_WRAP_DISABLE_GITHUB_PERSIST === '1') {
    return { ok: true, via: 'skipped' };
  }
  if (
    process.env.VERCEL &&
    process.env.KREX_WRAP_ALLOW_GITHUB_ATTEST_PERSIST !== '1' &&
    !opts?.force
  ) {
    return { ok: true, via: 'skipped' };
  }

  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'Kasparex';
  const repoName = process.env.GITHUB_REPO_NAME || 'kasparex-dapp-marketplace';

  const current = await fetchAttestGithubFile();
  const mergedStore = current?.store
    ? mergeAttestationStores(current.store, store)
    : normalizeAttestationStore(store);
  const normalized = normalizeAttestationStore({
    ...mergedStore,
    updatedAt: new Date().toISOString(),
  });

  if (githubToken) {
    try {
      if (current?.store) {
        const prevRows = current.store.attestations || [];
        const nextRows = normalized.attestations || [];
        if (
          prevRows.length === nextRows.length &&
          prevRows.every((row, i) => nextRows[i] && attestationPayloadEqual(row, nextRows[i]!))
        ) {
          return { ok: true, via: 'skipped' };
        }
      }
      const body = `${JSON.stringify(normalized, null, 2)}\n`;
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
            message: `chore(bridge): upsert TN10 migrate attestation (${normalized.updatedAt}) [skip vercel]`,
            content,
            sha: current?.sha,
          }),
        },
      );
      if (updateResponse.ok) return { ok: true, via: 'github' };
      if (updateResponse.status === 409) {
        const again = await fetchAttestGithubFile();
        const retryStore = again?.store
          ? mergeAttestationStores(again.store, store)
          : normalized;
        const stamped = normalizeAttestationStore({
          ...retryStore,
          updatedAt: new Date().toISOString(),
        });
        const retryRes = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${attestationsPath}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `chore(bridge): upsert TN10 migrate attestation (${stamped.updatedAt}) [skip vercel]`,
              content: Buffer.from(`${JSON.stringify(stamped, null, 2)}\n`, 'utf8').toString(
                'base64',
              ),
              sha: again?.sha,
            }),
          },
        );
        if (retryRes.ok) return { ok: true, via: 'github' };
        const err2 = await retryRes.text();
        return { ok: false, via: 'github', error: err2.slice(0, 500) };
      }
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
    const body = `${JSON.stringify(
      { ...normalized, updatedAt: new Date().toISOString() },
      null,
      2,
    )}\n`;
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

function isMeaningfulAttestationUpgrade(
  prev: MigrateAttestation | undefined,
  next: MigrateAttestation,
): boolean {
  // Only force GitHub writes for ticket/claim upgrades. Ticket-less first sight stays
  // ephemeral on Vercel so observe polls cannot wipe remote tickets with a stale store.
  const gainedTicket = attestationHasTicket(next) && (!prev || !attestationHasTicket(prev));
  const gainedClaim =
    (next.status === 'claimed' && prev?.status !== 'claimed') ||
    (Boolean(next.mintTxHash) && !prev?.mintTxHash);
  return gainedTicket || gainedClaim;
}

export async function upsertAttestation(row: MigrateAttestation): Promise<{
  attestation: MigrateAttestation;
  persist: { ok: boolean; via: 'github' | 'local' | 'none' | 'skipped'; error?: string };
}> {
  const store = await loadAttestationStore();
  const burn = row.burnTxHash.trim().toLowerCase();
  const normalized: MigrateAttestation = { ...row, burnTxHash: burn };
  const idx = store.attestations.findIndex((a) => a.burnTxHash?.toLowerCase() === burn);
  if (idx >= 0) {
    const prev = store.attestations[idx];
    const merged = preferRicherAttestation(prev, normalized);
    if (attestationPayloadEqual(prev, merged)) {
      return { attestation: prev, persist: { ok: true, via: 'skipped' } };
    }
    store.attestations[idx] = merged;
    const persist = await persistAttestationStore(store, {
      force: isMeaningfulAttestationUpgrade(prev, merged),
    });
    return { attestation: merged, persist };
  }
  store.attestations.unshift(normalized);
  const persist = await persistAttestationStore(store, {
    force: isMeaningfulAttestationUpgrade(undefined, normalized),
  });
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

  if (githubToken) {
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
    const decoded = Buffer.from(
      data.content,
      (data.encoding as BufferEncoding) || 'base64',
    ).toString('utf8');
    return { tip: normalizeMigrateMintTip(JSON.parse(decoded)), sha: data.sha };
  }

  try {
    const bust = Date.now();
    const res = await fetch(
      `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${MIGRATE_MINT_TIP_TN10_PATH}?t=${bust}`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      },
    );
    if (!res.ok) return null;
    return { tip: normalizeMigrateMintTip(await res.json()), sha: undefined };
  } catch {
    return null;
  }
}

/** Prefer GitHub (live after attestor mint), else deployment file. */
export async function loadMigrateMintTip(): Promise<MigrateMintTip | null> {
  const fromGh = await fetchTipGithubFile();
  if (fromGh?.tip) return fromGh.tip;
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
            message: `chore(bridge): upsert TN10 migrate mint tip (${tip.updatedAt}) [skip vercel]`,
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
