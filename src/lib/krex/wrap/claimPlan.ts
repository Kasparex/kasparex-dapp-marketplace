/**
 * Hub-side claim helpers for keyless migrate v3 (ticket + user-signed mint).
 * Full UTXO assembly mirrors tools/tn10-migrate broadcast-tkrex-migrate-mint.mjs
 * with an added MigrateTicket input; wallet signs redeem + funding.
 */

import {
  attestationHasTicket,
  buildMigrateClaimPlan,
  type MigrateAttestation,
  type MigrateClaimPlan,
} from './migrateV2';

export type MigrateClaimReady = {
  ready: boolean;
  reason?: string;
  plan?: MigrateClaimPlan;
};

export function evaluateMigrateClaimReady(attestation: MigrateAttestation | null | undefined): MigrateClaimReady {
  if (!attestation) return { ready: false, reason: 'No attestation yet' };
  if (attestation.status === 'claimed') {
    return { ready: false, reason: 'Already claimed' };
  }
  if (attestation.status === 'rejected') {
    return { ready: false, reason: 'Attestation rejected' };
  }
  if (attestation.status !== 'attested') {
    return { ready: false, reason: 'Waiting for attestor' };
  }
  if (!attestationHasTicket(attestation)) {
    return {
      ready: false,
      reason: 'Ticket UTXO not issued yet (attestor will post ticketId as txid:index)',
    };
  }
  const plan = buildMigrateClaimPlan(attestation);
  if (!plan) return { ready: false, reason: 'Invalid ticket outpoint' };
  return { ready: true, plan };
}

export function claimButtonLabel(ready: MigrateClaimReady): string {
  if (ready.ready) return 'Claim KCC20';
  if (ready.reason?.includes('Ticket')) return 'Waiting for ticket…';
  if (ready.reason?.includes('attestor')) return 'Waiting for confirm…';
  if (ready.reason?.includes('Already')) return 'Already claimed';
  return 'Claim unavailable';
}
