/**
 * KCC20 migrate v2 helpers: keyless sink, attestation types, Burn→Attest→Claim status.
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

export type MigrateAttestationStatus = 'pending' | 'attested' | 'claimed' | 'rejected';

export type MigrateAttestation = {
  network: Krc20BridgeNetwork;
  tick: string;
  burnTxHash: string;
  amountRaw: string;
  amount: number;
  from: string;
  sinkAddress: string;
  claimantAddress?: string;
  /** Attestor pubkey (x-only 64 hex) when signed. */
  attestorPubkey?: string;
  /** Opaque signature / ticket id for claim builders. */
  ticketId?: string;
  mintTxHash?: string;
  assetCovenantId?: string;
  status: MigrateAttestationStatus;
  attestedAt?: string;
  note?: string;
};

export function defaultMigrateSinkAddress(network: Krc20BridgeNetwork): string {
  return MIGRATE_SINK_V1.addresses[network];
}

/** Canonical attestation message bytes (UTF-8) for N-of-M signing later. */
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
