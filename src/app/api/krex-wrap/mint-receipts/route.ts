import { NextRequest, NextResponse } from 'next/server';
import {
  findMintReceipt,
  normalizeTxHash,
  upsertMintReceipt,
  type KrexWrapMintReceipt,
} from '@/lib/krex/wrap/mintReceipts';
import {
  findAttestation,
  loadAttestationStore,
  loadMigrateMintTip,
  loadMintReceiptStore,
  persistMigrateMintTip,
  persistMintReceiptStore,
  upsertAttestation,
} from '@/lib/krex/wrap/mintReceiptStore';
import { attestationHasTicket, type MigrateAttestation } from '@/lib/krex/wrap/migrateV2';
import {
  verifyMigrateClaimOnChain,
  discoverClaimMintForAttestation,
  healMigrateTipFromChain,
} from '@/lib/krex/wrap/claimReport';
import { observeSinkBurn } from '@/lib/krex/wrap/observeBurn';
import { canIssueTicketsOnHub, issueMigrateTicket } from '@/lib/krex/wrap/issueTicket';
import type { Krc20BridgeNetwork } from '@/lib/krex/wrap/types';

export const runtime = 'nodejs';

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
} as const;

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status, headers: NO_STORE });
}

function watcherSecretExpected(): string {
  return (
    process.env.KCC20_MIGRATE_ATTESTOR_SECRET?.trim() ||
    process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim() ||
    ''
  );
}

function watcherAuthorized(req: NextRequest): boolean {
  const expected = watcherSecretExpected();
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const header =
    req.headers.get('x-krex-attestor-secret')?.trim() ||
    req.headers.get('x-krex-watcher-secret')?.trim() ||
    '';
  return bearer === expected || header === expected;
}

async function getAttestations(req: NextRequest) {
  const burn = normalizeTxHash(req.nextUrl.searchParams.get('burnTxHash'));
  const discover = req.nextUrl.searchParams.get('discover') === '1';
  const store = await loadAttestationStore();
  if (burn) {
    let row = await findAttestation(burn);
    let discovered: { mintTxHash: string } | null = null;
    if (
      discover &&
      row &&
      row.status === 'attested' &&
      !row.mintTxHash &&
      row.ticketId
    ) {
      const tip = await loadMigrateMintTip();
      if (tip) {
        const found = await discoverClaimMintForAttestation({ attestation: row, tip });
        if (found?.mintTxHash) {
          discovered = { mintTxHash: found.mintTxHash };
          const verified = await verifyMigrateClaimOnChain({
            attestation: row,
            mintTxHash: found.mintTxHash,
            tip,
          });
          if (verified.ok && verified.mintTxHash) {
            const updated: MigrateAttestation = {
              ...row,
              status: 'claimed',
              mintTxHash: verified.mintTxHash,
              note: 'User claimed KCC20 on Kaspa L1 (ticket spent).',
            };
            const upserted = await upsertAttestation(updated);
            row = upserted.attestation;
            if (verified.tipPatch) {
              await persistMigrateMintTip({
                ...tip,
                ...verified.tipPatch,
                adminRenounced: tip.adminRenounced,
                migrateVersion: tip.migrateVersion,
                assetTemplate: tip.assetTemplate,
                ticketTemplate: tip.ticketTemplate,
                controllerTemplate: tip.controllerTemplate,
              });
            }
          }
        }
      }
    }
    return json({
      ok: true,
      mode: 'attest',
      network: store.network,
      burnTxHash: burn,
      found: Boolean(row),
      attestation: row,
      attestations: row ? [row] : [],
      ...(discovered ? { discovered } : {}),
    });
  }
  return json({
    ok: true,
    mode: 'attest',
    network: store.network,
    updatedAt: store.updatedAt,
    attestations: store.attestations,
    watcherSecretConfigured: Boolean(watcherSecretExpected()),
  });
}

async function postAttestation(req: NextRequest, body: Record<string, unknown>) {
  if (!watcherSecretExpected()) {
    return json(
      { ok: false, error: 'Watcher/attestor secret is not configured on this deployment' },
      { status: 503 },
    );
  }
  if (!watcherAuthorized(req)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const burnTxHash = normalizeTxHash(typeof body.burnTxHash === 'string' ? body.burnTxHash : '');
  if (!burnTxHash) {
    return json({ ok: false, error: 'burnTxHash must be 64-char hex' }, { status: 400 });
  }

  const existing = await findAttestation(burnTxHash);
  const statusRaw = typeof body.status === 'string' ? body.status : existing?.status || 'attested';
  const status = (['pending', 'attested', 'claimed', 'rejected'] as const).includes(
    statusRaw as MigrateAttestation['status'],
  )
    ? (statusRaw as MigrateAttestation['status'])
    : 'attested';

  if (existing?.status === 'claimed' && status !== 'claimed') {
    return json(
      { ok: false, error: 'Burn already claimed; nullifier active', attestation: existing },
      { status: 409 },
    );
  }

  const ticketIdRaw = typeof body.ticketId === 'string' ? body.ticketId.trim() : existing?.ticketId;
  const ticketTxId =
    typeof body.ticketTxId === 'string'
      ? body.ticketTxId.trim().toLowerCase()
      : existing?.ticketTxId;
  const ticketIndex =
    typeof body.ticketIndex === 'number'
      ? body.ticketIndex
      : typeof body.ticketIndex === 'string'
        ? Number(body.ticketIndex)
        : existing?.ticketIndex;

  // Prefer explicit outpoint fields; accept ticketId as txid:index.
  let ticketId = ticketIdRaw;
  if (ticketTxId && /^[a-f0-9]{64}$/.test(ticketTxId) && Number.isFinite(ticketIndex)) {
    ticketId = `${ticketTxId}:${Number(ticketIndex)}`;
  }

  if (
    existing?.ticketId &&
    /^[a-f0-9]{64}:\d+$/.test(existing.ticketId) &&
    ticketId &&
    ticketId !== existing.ticketId &&
    status === 'attested'
  ) {
    return json(
      {
        ok: false,
        error: 'Ticket already issued for this burn; nullifier active',
        attestation: existing,
      },
      { status: 409 },
    );
  }

  const row: MigrateAttestation = {
    network: 'testnet-10',
    tick: String(body.tick || existing?.tick || 'TKREX').trim().toUpperCase(),
    burnTxHash,
    amountRaw: String(body.amountRaw ?? existing?.amountRaw ?? '0'),
    amount: Number(body.amount ?? existing?.amount ?? 0),
    from: String(body.from || existing?.from || ''),
    sinkAddress: String(body.sinkAddress || existing?.sinkAddress || ''),
    claimantAddress:
      typeof body.claimantAddress === 'string' ? body.claimantAddress : existing?.claimantAddress,
    attestorPubkey:
      typeof body.attestorPubkey === 'string' ? body.attestorPubkey : existing?.attestorPubkey,
    attestorSigs: Array.isArray(body.attestorSigs)
      ? (body.attestorSigs as MigrateAttestation['attestorSigs'])
      : existing?.attestorSigs,
    ticketId,
    ticketTxId: ticketTxId && /^[a-f0-9]{64}$/.test(ticketTxId) ? ticketTxId : existing?.ticketTxId,
    ticketIndex: Number.isFinite(ticketIndex) ? Number(ticketIndex) : existing?.ticketIndex,
    mintTxHash:
      normalizeTxHash(typeof body.mintTxHash === 'string' ? body.mintTxHash : '') ||
      existing?.mintTxHash,
    assetCovenantId:
      typeof body.assetCovenantId === 'string' ? body.assetCovenantId : existing?.assetCovenantId,
    migrateVersion:
      typeof body.migrateVersion === 'number' ? body.migrateVersion : existing?.migrateVersion ?? 3,
    status,
    attestedAt: existing?.attestedAt || new Date().toISOString(),
    note: typeof body.note === 'string' ? body.note : existing?.note,
  };

  const { attestation, persist } = await upsertAttestation(row);
  return json({ ok: true, mode: 'attest', attestation, persist });
}

async function getMintTip() {
  const tip = await loadMigrateMintTip();
  if (!tip) {
    return json({
      ok: true,
      mode: 'mint-tip',
      network: 'testnet-10',
      found: false,
      tip: null,
    });
  }

  // If claim-report could not persist tip (no GITHUB_TOKEN), heal from chain for Claim.
  const store = await loadAttestationStore();
  const healed = await healMigrateTipFromChain({
    tip,
    attestations: store.attestations || [],
  });
  if (healed.healed) {
    void persistMigrateMintTip(healed.tip);
    for (const c of healed.claimed) {
      const row = store.attestations.find((a) => a.burnTxHash === c.burnTxHash);
      if (!row || (row.status === 'claimed' && row.mintTxHash === c.mintTxHash)) continue;
      void upsertAttestation({
        ...row,
        status: 'claimed',
        mintTxHash: c.mintTxHash,
        note: 'User claimed KCC20 on Kaspa L1 (ticket spent).',
      });
    }
  }

  return json({
    ok: true,
    mode: 'mint-tip',
    network: 'testnet-10',
    found: true,
    tip: healed.tip,
    tipHealed: healed.healed,
    tipHealedBurns: healed.claimed.map((c) => c.burnTxHash),
  });
}

async function postMintTip(req: NextRequest, body: Record<string, unknown>) {
  if (!watcherSecretExpected()) {
    return json(
      { ok: false, error: 'Watcher/attestor secret is not configured on this deployment' },
      { status: 503 },
    );
  }
  if (!watcherAuthorized(req)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const tipBody =
    body.tip && typeof body.tip === 'object'
      ? (body.tip as Record<string, unknown>)
      : body;
  const persisted = await persistMigrateMintTip(tipBody);
  if (!persisted.ok || !persisted.tip) {
    return json(
      {
        ok: false,
        mode: 'mint-tip',
        error: persisted.error || 'Failed to persist migrate mint tip',
        via: persisted.via,
      },
      { status: persisted.error?.startsWith('Invalid') ? 400 : 502 },
    );
  }
  return json({
    ok: true,
    mode: 'mint-tip',
    tip: persisted.tip,
    persist: { ok: true, via: persisted.via },
  });
}

/**
 * Watcher/ops POST: force-issue a claim ticket for an accepted burn without
 * waiting for the GHA attestor. Requires TKREX_WALLET3_PRIVKEY + >=2 attestor
 * privkeys configured on this deployment (see canIssueTicketsOnHub).
 */
async function postIssueTicket(req: NextRequest, body: Record<string, unknown>) {
  if (!watcherSecretExpected()) {
    return json(
      { ok: false, error: 'Watcher/attestor secret is not configured on this deployment' },
      { status: 503 },
    );
  }
  if (!watcherAuthorized(req)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const burnTxHash = normalizeTxHash(typeof body.burnTxHash === 'string' ? body.burnTxHash : '');
  if (!burnTxHash) {
    return json({ ok: false, error: 'burnTxHash must be 64-char hex' }, { status: 400 });
  }

  const existing = await findAttestation(burnTxHash);
  if (!existing) {
    return json({ ok: false, error: 'No attestation for this burn' }, { status: 404 });
  }
  if (attestationHasTicket(existing)) {
    return json({ ok: true, mode: 'issue-ticket', already: true, attestation: existing });
  }
  if (!canIssueTicketsOnHub()) {
    return json(
      {
        ok: false,
        mode: 'issue-ticket',
        error: 'Attestor/wallet3 privkeys are not configured on this deployment',
      },
      { status: 503 },
    );
  }

  const issued = await issueMigrateTicket({
    burnTxHash,
    amountRaw: existing.amountRaw,
    claimantAddress: existing.claimantAddress || existing.from,
  });
  if (!issued.ok) {
    return json(
      { ok: false, mode: 'issue-ticket', error: issued.error || 'Ticket issue failed' },
      { status: 502 },
    );
  }

  const row: MigrateAttestation = {
    ...existing,
    ticketId: issued.ticketId,
    ticketTxId: issued.ticketTxId,
    ticketIndex: issued.ticketIndex,
    note: 'Burn accepted. Ticket issued automatically; Claim is ready.',
  };
  const { attestation, persist } = await upsertAttestation(row);
  return json({ ok: true, mode: 'issue-ticket', attestation, persist, issued });
}

/**
 * Public claim report: mintTx must spend the attestation ticket on TN10.
 * Marks Hub attestation claimed and advances the migrate tip when possible.
 */
async function postClaimReport(body: Record<string, unknown>) {
  const burnTxHash = normalizeTxHash(typeof body.burnTxHash === 'string' ? body.burnTxHash : '');
  const mintTxHash = normalizeTxHash(typeof body.mintTxHash === 'string' ? body.mintTxHash : '');
  if (!burnTxHash || !mintTxHash) {
    return json(
      { ok: false, error: 'burnTxHash and mintTxHash must be 64-char hex' },
      { status: 400 },
    );
  }

  const existing = await findAttestation(burnTxHash);
  if (!existing) {
    return json({ ok: false, error: 'No attestation for this burn' }, { status: 404 });
  }
  if (existing.status === 'claimed' && existing.mintTxHash === mintTxHash) {
    return json({
      ok: true,
      mode: 'claim-report',
      already: true,
      attestation: existing,
    });
  }

  const tip = await loadMigrateMintTip();
  const verified = await verifyMigrateClaimOnChain({
    attestation: existing,
    mintTxHash,
    tip,
  });
  if (!verified.ok || !verified.mintTxHash) {
    return json(
      { ok: false, mode: 'claim-report', error: verified.error || 'Claim verification failed' },
      { status: 400 },
    );
  }

  const row: MigrateAttestation = {
    ...existing,
    status: 'claimed',
    mintTxHash: verified.mintTxHash,
    note: 'User claimed KCC20 on Kaspa L1 (ticket spent).',
  };
  const { attestation, persist } = await upsertAttestation(row);

  // Tip already points at this mint (e.g. a prior claim-report already advanced it,
  // or a chained Claim landed first): skip re-persisting to avoid a redundant write
  // and a double-subtracted remainingAllowance.
  const tipAlreadyAtMint = Boolean(tip && normalizeTxHash(tip.minterTxId) === verified.mintTxHash);

  let tipPersist: { ok: boolean; via?: string; error?: string } | undefined;
  if (tip && verified.tipPatch && !tipAlreadyAtMint) {
    const nextTip = await persistMigrateMintTip({
      ...tip,
      ...verified.tipPatch,
      adminRenounced: tip.adminRenounced,
      migrateVersion: tip.migrateVersion,
      assetTemplate: tip.assetTemplate,
      ticketTemplate: tip.ticketTemplate,
      controllerTemplate: tip.controllerTemplate,
    });
    tipPersist = { ok: nextTip.ok, via: nextTip.via, error: nextTip.error };
  }

  return json({
    ok: true,
    mode: 'claim-report',
    attestation,
    persist,
    tipPersist,
    mintTxHash: verified.mintTxHash,
  });
}

/** Public: mint receipts, migrate attestations (?mode=attest), or mint tip (?mode=mint-tip). */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode');
  if (mode === 'attest') {
    return getAttestations(req);
  }
  if (mode === 'mint-tip') {
    return getMintTip();
  }

  const deposit = normalizeTxHash(req.nextUrl.searchParams.get('depositTxHash'));
  const store = await loadMintReceiptStore();
  if (deposit) {
    const receipt = findMintReceipt(store, deposit);
    return json({
      ok: true,
      network: store.network,
      tick: store.tick,
      depositTxHash: deposit,
      found: Boolean(receipt),
      receipt,
      ignored: store.ignoredDepositTxHashes.includes(deposit),
    });
  }
  return json({
    ok: true,
    network: store.network,
    tick: store.tick,
    updatedAt: store.updatedAt,
    receipts: store.receipts,
    ignoredDepositTxHashes: store.ignoredDepositTxHashes,
  });
}

/**
 * Watcher/attestor POST.
 * - Mint receipt: depositTxHash + mintTxHash
 * - Migrate attest: mode=attest (query or body) + burnTxHash
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const mode =
    req.nextUrl.searchParams.get('mode') ||
    (typeof body.mode === 'string' ? body.mode : '') ||
    (typeof body.burnTxHash === 'string' && !body.mintTxHash ? 'attest' : 'mint');

  if (mode === 'attest') {
    return postAttestation(req, body);
  }
  if (mode === 'mint-tip') {
    return postMintTip(req, body);
  }
  if (mode === 'claim-report') {
    return postClaimReport(body);
  }
  if (mode === 'issue-ticket') {
    return postIssueTicket(req, body);
  }
  if (mode === 'observe-burn') {
    const observed = await observeSinkBurn({
      burnTxHash: typeof body.burnTxHash === 'string' ? body.burnTxHash : '',
      network: (body.network === 'mainnet' ? 'mainnet' : 'testnet-10') as Krc20BridgeNetwork,
      tick: typeof body.tick === 'string' ? body.tick : undefined,
      wallet: typeof body.wallet === 'string' ? body.wallet : undefined,
      amount: typeof body.amount === 'number' ? body.amount : undefined,
    });
    if (!observed.ok) {
      return json(
        { ok: false, mode: 'observe-burn', error: observed.error },
        { status: 400 },
      );
    }
    return json({ ...observed, mode: 'observe-burn' });
  }

  if (!watcherAuthorized(req)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.KCC20_BRIDGE_WATCHER_SECRET?.trim()) {
    return json(
      { ok: false, error: 'KCC20_BRIDGE_WATCHER_SECRET is not configured' },
      { status: 503 },
    );
  }

  const depositTxHash = normalizeTxHash(
    typeof body.depositTxHash === 'string' ? body.depositTxHash : '',
  );
  const mintTxHash = normalizeTxHash(typeof body.mintTxHash === 'string' ? body.mintTxHash : '');
  if (!depositTxHash || !mintTxHash) {
    return json(
      { ok: false, error: 'depositTxHash and mintTxHash must be 64-char hex' },
      { status: 400 },
    );
  }

  const amountRaw =
    typeof body.amountRaw === 'string'
      ? body.amountRaw
      : typeof body.amountRaw === 'number'
        ? String(body.amountRaw)
        : '';
  const amount =
    typeof body.amount === 'number' && Number.isFinite(body.amount)
      ? body.amount
      : amountRaw
        ? Number(amountRaw) / 1e8
        : 0;

  const receipt: KrexWrapMintReceipt = {
    depositTxHash,
    mintTxHash,
    amountRaw,
    amount: Number.isFinite(amount) ? amount : 0,
    from: typeof body.from === 'string' ? body.from : undefined,
    recipientAddress: typeof body.recipientAddress === 'string' ? body.recipientAddress : undefined,
    recipientPubkey: typeof body.recipientPubkey === 'string' ? body.recipientPubkey : undefined,
    assetCovenantId: typeof body.assetCovenantId === 'string' ? body.assetCovenantId : undefined,
    mintedAt: typeof body.mintedAt === 'string' ? body.mintedAt : new Date().toISOString(),
    status: 'minted',
  };

  const store = await loadMintReceiptStore();
  const next = upsertMintReceipt(store, receipt);
  const persisted = await persistMintReceiptStore(next);
  if (!persisted.ok) {
    return json(
      {
        ok: false,
        error: persisted.error || 'Failed to persist mint receipt',
        via: persisted.via,
        receipt,
      },
      { status: 502 },
    );
  }

  return json({
    ok: true,
    via: persisted.via,
    receipt,
    updatedAt: next.updatedAt,
  });
}
