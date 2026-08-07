/**
 * Verify a user Claim mint on TN10 and derive the next migrate tip fields.
 * Used by public claim-report (on-chain checked) and History self-heal.
 */

import { parseTicketOutpoint, type MigrateAttestation } from './migrateV2';
import type { MigrateMintTip } from './mintReceiptStore';
import { normalizeTxHash } from './mintReceipts';

const TN10_TX = (txid: string) => `https://api-tn10.kaspa.org/transactions/${txid}`;
const TN10_UTXOS = (address: string) =>
  `https://api-tn10.kaspa.org/addresses/${encodeURIComponent(address)}/utxos`;

type KaspaTx = {
  transaction_id?: string;
  is_accepted?: boolean;
  inputs?: Array<{
    previous_outpoint_hash?: string;
    previous_outpoint_index?: string | number;
  }>;
  outputs?: Array<{
    index?: number;
    script_public_key_address?: string;
    covenant_id?: string | null;
    covenant_authorizing_input?: number | null;
  }>;
};

async function fetchTx(txid: string): Promise<KaspaTx | null> {
  const id = normalizeTxHash(txid);
  if (!id) return null;
  const res = await fetch(TN10_TX(id), { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as KaspaTx;
}

async function fetchAddressUtxos(address: string): Promise<Array<{ txId: string; index: number }>> {
  const res = await fetch(TN10_UTXOS(address), { cache: 'no-store' });
  if (!res.ok) return [];
  const raw = await res.json();
  const list = Array.isArray(raw) ? raw : raw.utxos || raw.result || [];
  return (list as Array<Record<string, unknown>>)
    .map((u) => {
      const op = (u.outpoint || u.previousOutpoint || {}) as Record<string, unknown>;
      return {
        txId: String(op.transactionId || op.transaction_id || '')
          .trim()
          .toLowerCase(),
        index: Number(op.index ?? op.outpointIndex ?? 0),
      };
    })
    .filter((x) => /^[a-f0-9]{64}$/.test(x.txId));
}

function txSpendsTicket(tx: KaspaTx, ticketTxId: string, ticketIndex: number): boolean {
  return (tx.inputs || []).some((inp) => {
    const prev = String(inp.previous_outpoint_hash || '')
      .trim()
      .toLowerCase();
    const idx = Number(inp.previous_outpoint_index ?? -1);
    return prev === ticketTxId && idx === ticketIndex;
  });
}

export type ClaimTipPatch = {
  minterTxId: string;
  minterIndex: number;
  minterAddress: string;
  controllerTxId: string;
  controllerIndex: number;
  controllerAddress: string;
  remainingAllowance: string;
  lastBurnTxId: string;
};

export function tipPatchFromMintTx(
  tip: MigrateMintTip,
  mintTx: KaspaTx,
  amountRaw: string,
): ClaimTipPatch | null {
  const mintTxId = normalizeTxHash(mintTx.transaction_id);
  if (!mintTxId || !mintTx.outputs?.length) return null;

  const assetOut = mintTx.outputs.find(
    (o) =>
      String(o.covenant_id || '').toLowerCase() === tip.assetCovenantId.toLowerCase() &&
      Number(o.covenant_authorizing_input ?? -1) === 0,
  );
  const controllerOut = mintTx.outputs.find(
    (o) =>
      String(o.covenant_id || '').toLowerCase() === tip.controllerCovenantId.toLowerCase(),
  );
  if (!assetOut?.script_public_key_address || !controllerOut?.script_public_key_address) {
    return null;
  }

  // If tip already points at this mint, remainingAllowance was already reduced.
  // Re-subtracting (e.g. claim-report reconcile) breaks the next Claim script.
  let remaining = tip.remainingAllowance;
  const tipAlreadyAtMint = normalizeTxHash(tip.minterTxId) === mintTxId;
  if (!tipAlreadyAtMint) {
    try {
      const next = BigInt(tip.remainingAllowance) - BigInt(amountRaw || '0');
      if (next >= 0n) remaining = String(next);
    } catch {
      /* keep tip remaining */
    }
  }

  return {
    minterTxId: mintTxId,
    minterIndex: Number(assetOut.index ?? 0),
    minterAddress: assetOut.script_public_key_address,
    controllerTxId: mintTxId,
    controllerIndex: Number(controllerOut.index ?? 2),
    controllerAddress: controllerOut.script_public_key_address,
    remainingAllowance: remaining,
    lastBurnTxId: '',
  };
}

/** Confirm mintTx spends the attestation ticket; optionally derive tip patch. */
export async function verifyMigrateClaimOnChain(input: {
  attestation: MigrateAttestation;
  mintTxHash: string;
  tip?: MigrateMintTip | null;
}): Promise<{
  ok: boolean;
  error?: string;
  mintTxHash?: string;
  tipPatch?: ClaimTipPatch;
}> {
  const mintTxHash = normalizeTxHash(input.mintTxHash);
  if (!mintTxHash) return { ok: false, error: 'mintTxHash must be 64-char hex' };

  const ticket =
    parseTicketOutpoint(input.attestation.ticketId) ||
    (input.attestation.ticketTxId && input.attestation.ticketIndex != null
      ? { txId: input.attestation.ticketTxId, index: Number(input.attestation.ticketIndex) }
      : null);
  if (!ticket) return { ok: false, error: 'Attestation has no ticket outpoint' };

  const mintTx = await fetchTx(mintTxHash);
  if (!mintTx) return { ok: false, error: 'Mint transaction not found on TN10' };
  if (mintTx.is_accepted === false) return { ok: false, error: 'Mint transaction not accepted yet' };
  if (!txSpendsTicket(mintTx, ticket.txId, ticket.index)) {
    return { ok: false, error: 'Mint tx does not spend this burn ticket' };
  }

  let tipPatch: ClaimTipPatch | undefined;
  if (input.tip) {
    const patch = tipPatchFromMintTx(input.tip, mintTx, input.attestation.amountRaw);
    if (patch) {
      tipPatch = { ...patch, lastBurnTxId: input.attestation.burnTxHash };
    }
  }

  return { ok: true, mintTxHash, tipPatch };
}

/**
 * When Hub still says "attested" but the ticket UTXO is gone, find the claim mint
 * by inspecting live minter UTXOs on the tip address.
 */
export async function discoverClaimMintForAttestation(input: {
  attestation: MigrateAttestation;
  tip: MigrateMintTip;
}): Promise<{ mintTxHash: string; tipPatch?: ClaimTipPatch } | null> {
  const ticket =
    parseTicketOutpoint(input.attestation.ticketId) ||
    (input.attestation.ticketTxId && input.attestation.ticketIndex != null
      ? { txId: input.attestation.ticketTxId, index: Number(input.attestation.ticketIndex) }
      : null);
  if (!ticket) return null;

  const candidates = new Set<string>();
  if (input.attestation.mintTxHash) {
    const known = normalizeTxHash(input.attestation.mintTxHash);
    if (known) candidates.add(known);
  }
  for (const u of await fetchAddressUtxos(input.tip.minterAddress)) {
    candidates.add(u.txId);
  }

  for (const txId of candidates) {
    const tx = await fetchTx(txId);
    if (!tx || !txSpendsTicket(tx, ticket.txId, ticket.index)) continue;
    const tipPatch = tipPatchFromMintTx(input.tip, tx, input.attestation.amountRaw);
    return {
      mintTxHash: txId,
      tipPatch: tipPatch
        ? { ...tipPatch, lastBurnTxId: input.attestation.burnTxHash }
        : undefined,
    };
  }
  return null;
}

async function tipMinterUtxoLive(tip: MigrateMintTip): Promise<boolean> {
  const utxos = await fetchAddressUtxos(tip.minterAddress);
  return utxos.some(
    (u) => u.txId === tip.minterTxId.toLowerCase() && u.index === Number(tip.minterIndex),
  );
}

/**
 * When claim-report could not persist (missing GITHUB_TOKEN), Hub tip JSON goes stale.
 * Walk attested→claimed discoveries that spend the stored tip, and return an in-memory tip
 * that matches live TN10 minter/controller UTXOs so the next Claim can assemble.
 */
export async function healMigrateTipFromChain(input: {
  tip: MigrateMintTip;
  attestations: MigrateAttestation[];
}): Promise<{
  tip: MigrateMintTip;
  healed: boolean;
  claimed: Array<{ burnTxHash: string; mintTxHash: string }>;
}> {
  let tip = input.tip;
  const claimed: Array<{ burnTxHash: string; mintTxHash: string }> = [];
  if (await tipMinterUtxoLive(tip)) {
    return { tip, healed: false, claimed };
  }

  // Prefer oldest attested first so chained claims advance tip in order.
  const pending = [...input.attestations]
    .filter((a) => a.ticketId && (a.status === 'attested' || a.status === 'claimed'))
    .sort((a, b) => String(a.attestedAt || '').localeCompare(String(b.attestedAt || '')));

  for (let guard = 0; guard < 8; guard++) {
    if (await tipMinterUtxoLive(tip)) break;
    let advanced = false;
    for (const row of pending) {
      if (claimed.some((c) => c.burnTxHash === row.burnTxHash)) continue;
      const found = await discoverClaimMintForAttestation({ attestation: row, tip });
      if (!found?.tipPatch) continue;
      const mintTx = await fetchTx(found.mintTxHash);
      if (!mintTx) continue;
      // Only advance along the tip chain (mint must spend current tip minter).
      if (!txSpendsTicket(mintTx, tip.minterTxId.toLowerCase(), Number(tip.minterIndex))) {
        continue;
      }
      tip = {
        ...tip,
        ...found.tipPatch,
        updatedAt: new Date().toISOString(),
        adminRenounced: tip.adminRenounced,
        migrateVersion: tip.migrateVersion,
        assetTemplate: tip.assetTemplate,
        ticketTemplate: tip.ticketTemplate,
        controllerTemplate: tip.controllerTemplate,
      };
      claimed.push({ burnTxHash: row.burnTxHash, mintTxHash: found.mintTxHash });
      advanced = true;
      break;
    }
    if (!advanced) break;
  }

  return { tip, healed: claimed.length > 0, claimed };
}
