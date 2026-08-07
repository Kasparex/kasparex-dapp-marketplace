/**
 * Fast path: verify a sink burn on Kasplex and upsert a Hub attestation
 * without waiting for GHA / silverc ticket issue.
 */

import {
  getKrexWrapTick,
  getMigrateSinkAddress,
  getWrapCovenantIdForTick,
  kasplexApiBaseForNetwork,
} from './config';
import { findAttestation, upsertAttestation } from './mintReceiptStore';
import { normalizeTxHash } from './mintReceipts';
import { attestationHasTicket, type MigrateAttestation } from './migrateV2';
import { stripKaspaAddressHrp } from '@/lib/kaspa/sdk';
import type { Krc20BridgeNetwork } from './types';
import { wakeMigrateAttestor } from './wakeAttestor';

type KasplexOp = {
  op?: string;
  tick?: string;
  amt?: string;
  to?: string;
  from?: string;
  txId?: string;
  hashRev?: string;
  opAccept?: string | number | boolean;
  txAccept?: string | number | boolean;
};

function accepted(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

export async function observeSinkBurn(input: {
  burnTxHash: string;
  network?: Krc20BridgeNetwork;
  tick?: string;
  wallet?: string;
  amount?: number;
}): Promise<{
  ok: boolean;
  error?: string;
  attestation?: MigrateAttestation;
  verified?: boolean;
  opAccept?: boolean;
  created?: boolean;
}> {
  const network: Krc20BridgeNetwork = input.network === 'mainnet' ? 'mainnet' : 'testnet-10';
  const burnTxHash = normalizeTxHash(input.burnTxHash);
  if (!burnTxHash) return { ok: false, error: 'burnTxHash must be 64-char hex' };

  const sink = getMigrateSinkAddress(network);
  if (!sink) return { ok: false, error: 'Sink not configured for this network' };

  const tick = (input.tick || getKrexWrapTick(network) || 'TKREX').trim().toUpperCase();
  const sinkNorm = stripKaspaAddressHrp(sink).toLowerCase();
  const walletNorm = input.wallet ? stripKaspaAddressHrp(input.wallet).toLowerCase() : null;
  const apiBase = kasplexApiBaseForNetwork(network);

  const url = `${apiBase}/v1/krc20/oplist?tick=${encodeURIComponent(tick)}&txId=${encodeURIComponent(burnTxHash)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  });
  if (!res.ok) {
    return { ok: false, error: `Kasplex returned ${res.status}` };
  }
  const json = (await res.json()) as { result?: KasplexOp[] };
  const ops = Array.isArray(json.result) ? json.result : [];
  const match = ops.find((op) => {
    const opTick = (op.tick || '').toUpperCase();
    const to = stripKaspaAddressHrp(op.to || '').toLowerCase();
    const from = stripKaspaAddressHrp(op.from || '').toLowerCase();
    const isTransfer = (op.op || '').toLowerCase() === 'transfer';
    const toSink = to === sinkNorm;
    const fromWallet = !walletNorm || from === walletNorm;
    return isTransfer && opTick === tick && toSink && fromWallet;
  });

  if (!match) {
    return {
      ok: true,
      verified: false,
      error: 'Burn not indexed on Kasplex yet',
    };
  }

  const existing = await findAttestation(burnTxHash);
  if (existing?.status === 'claimed' && existing.mintTxHash) {
    return { ok: true, verified: true, attestation: existing, opAccept: true };
  }
  // Do not clobber a real ticket outpoint already posted by the attestor.
  if (existing?.ticketId && /^[a-f0-9]{64}:\d+$/.test(existing.ticketId)) {
    return {
      ok: true,
      verified: true,
      attestation: existing,
      opAccept: accepted(match.opAccept),
    };
  }

  const opOk = accepted(match.opAccept);
  // Already attested and waiting for ticket: do not re-persist (GitHub spam + tip races).
  if (existing?.status === 'attested' && opOk) {
    if (!attestationHasTicket(existing)) {
      void wakeMigrateAttestor(`observe-burn:${burnTxHash.slice(0, 12)}`);
    }
    return {
      ok: true,
      verified: true,
      attestation: existing,
      opAccept: true,
      created: false,
    };
  }

  const amountRaw = String(match.amt || '0');
  const amount =
    typeof input.amount === 'number' && Number.isFinite(input.amount)
      ? input.amount
      : Number(amountRaw) / 1e8;
  const row: MigrateAttestation = {
    network: 'testnet-10',
    tick,
    burnTxHash,
    amountRaw,
    amount: Number.isFinite(amount) ? amount : 0,
    from: String(match.from || input.wallet || ''),
    sinkAddress: sink,
    claimantAddress: String(match.from || input.wallet || ''),
    assetCovenantId: getWrapCovenantIdForTick(tick) || existing?.assetCovenantId,
    migrateVersion: existing?.migrateVersion ?? 3,
    status: opOk ? 'attested' : 'pending',
    attestedAt: existing?.attestedAt || new Date().toISOString(),
    ticketId: existing?.ticketId,
    ticketTxId: existing?.ticketTxId,
    ticketIndex: existing?.ticketIndex,
    mintTxHash: existing?.mintTxHash,
    note: opOk
      ? 'Burn accepted. Waiting for claim ticket (may take a few minutes)…'
      : 'Burn seen on Kasplex. Waiting for opAccept…',
  };

  const { attestation } = await upsertAttestation(row);
  if (opOk && attestation && !attestationHasTicket(attestation)) {
    void wakeMigrateAttestor(`observe-burn:${burnTxHash.slice(0, 12)}`);
  }
  return {
    ok: true,
    verified: true,
    opAccept: opOk,
    attestation,
    created: !existing,
  };
}
