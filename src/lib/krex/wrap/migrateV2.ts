/**
 * KCC20 migrate v2/v3 helpers: keyless sink, attestation types, Burn→Attest→Claim.
 * See docs/KCC20_BRIDGE_KEYLESS_ARCHITECTURE.md
 */

import type { Krc20BridgeNetwork } from './types';

/** Published P2SH(OP_RETURN <sha256("kasparex-kcc20-migrate-sink-v1")>). No spend key. */
export const MIGRATE_SINK_V1 = {
  tag: 'kasparex-kcc20-migrate-sink-v1',
  tagHash: 'cdc5d0288ef0f7cc83f2f7697ee5329069216eaeb0859b0f4e278688bb629cfb',
  redeemScriptHex: '6a20cdc5d0288ef0f7cc83f2f7697ee5329069216eaeb0859b0f4e278688bb629cfb',
  addresses: {
    'testnet-10': 'kaspatest:pqw2y985nkrstxa7x30rkckq6y8papu48tv688vak9eyew2fc9r9vdf0hcw87',
    mainnet: 'kaspa:pqw2y985nkrstxa7x30rkckq6y8papu48tv688vak9eyew2fc9r9vv0fvhsk6',
  },
} as const;

export const MIGRATE_ATTEST_QUORUM_DEFAULT = 2;

export type MigrateAttestationStatus = 'pending' | 'attested' | 'claimed' | 'rejected';

export type MigrateAttestorSig = {
  /** x-only pubkey (64 hex) */
  pubkey: string;
  /** Schnorr signature hex over buildMigrateAttestationMessage */
  signature: string;
};

export type MigrateAttestation = {
  network: Krc20BridgeNetwork;
  tick: string;
  burnTxHash: string;
  amountRaw: string;
  amount: number;
  from: string;
  sinkAddress: string;
  claimantAddress?: string;
  /** Attestor pubkey (x-only 64 hex) when signed (legacy single). */
  attestorPubkey?: string;
  /** Quorum signatures over the canonical attest message (v3). */
  attestorSigs?: MigrateAttestorSig[];
  /**
   * Ticket outpoint `txid:index` when issued, else burn tx hash placeholder until ticket lands.
   */
  ticketId?: string;
  ticketTxId?: string;
  ticketIndex?: number;
  mintTxHash?: string;
  assetCovenantId?: string;
  migrateVersion?: number;
  status: MigrateAttestationStatus;
  attestedAt?: string;
  note?: string;
};

export type MigrateClaimPlan = {
  network: Krc20BridgeNetwork;
  tick: string;
  burnTxHash: string;
  amountRaw: string;
  claimantAddress: string;
  ticketId: string;
  ticketTxId: string;
  ticketIndex: number;
  /** Suggested input order for claim tx builders. */
  ticketInputIdx: number;
  assetCovenantId?: string;
  note: string;
};

export function defaultMigrateSinkAddress(network: Krc20BridgeNetwork): string {
  return MIGRATE_SINK_V1.addresses[network];
}

/** Canonical attestation message (UTF-8) for 2-of-3 signing. */
export function buildMigrateAttestationMessage(input: {
  network: Krc20BridgeNetwork;
  tick: string;
  burnTxHash: string;
  amountRaw: string;
  sinkAddress: string;
  claimantAddress: string;
}): string {
  return [
    'kasparex-kcc20-migrate-attest-v1',
    input.network,
    input.tick.trim().toUpperCase(),
    input.burnTxHash.trim().toLowerCase(),
    input.amountRaw.trim(),
    input.sinkAddress.trim().toLowerCase(),
    input.claimantAddress.trim().toLowerCase(),
  ].join('|');
}

export function parseTicketOutpoint(ticketId: string | undefined | null): {
  txId: string;
  index: number;
} | null {
  const raw = String(ticketId || '').trim().toLowerCase();
  const m = /^([a-f0-9]{64}):(\d+)$/.exec(raw);
  if (!m) return null;
  return { txId: m[1], index: Number(m[2]) };
}

export function formatTicketOutpoint(txId: string, index: number): string {
  return `${txId.trim().toLowerCase()}:${Number(index)}`;
}

/** Build a user Claim plan once an attestation carries a real ticket outpoint. */
export function buildMigrateClaimPlan(attestation: MigrateAttestation): MigrateClaimPlan | null {
  if (attestation.status !== 'attested' && attestation.status !== 'claimed') return null;
  const parsed =
    parseTicketOutpoint(attestation.ticketId) ||
    (attestation.ticketTxId && attestation.ticketIndex != null
      ? { txId: attestation.ticketTxId, index: attestation.ticketIndex }
      : null);
  if (!parsed) return null;
  const claimant = (attestation.claimantAddress || attestation.from || '').trim();
  if (!claimant) return null;
  return {
    network: attestation.network,
    tick: attestation.tick,
    burnTxHash: attestation.burnTxHash,
    amountRaw: attestation.amountRaw,
    claimantAddress: claimant,
    ticketId: formatTicketOutpoint(parsed.txId, parsed.index),
    ticketTxId: parsed.txId,
    ticketIndex: parsed.index,
    ticketInputIdx: 2,
    assetCovenantId: attestation.assetCovenantId,
    note: 'User signs ticket redeem + funding; mint spends ticket (consensus replay).',
  };
}

export function attestationHasTicket(attestation: MigrateAttestation): boolean {
  return Boolean(parseTicketOutpoint(attestation.ticketId) || attestation.ticketTxId);
}
