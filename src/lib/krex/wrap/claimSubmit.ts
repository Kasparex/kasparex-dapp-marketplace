/**
 * Submit a user-signed migrate claim via KasWare/Kastle (signPskt + pushTx).
 */

import { loadKaspaWasm } from '@/lib/covenant/builder/kaspa-wasm';
import { signAndBroadcastCovenantPskt } from '@/lib/kaspa/pskt-covenant';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import {
  assembleMigrateClaimTx,
  tipReadyForUserClaim,
  waitForClaimParentsReady,
  type MigrateClaimTip,
} from './claimAssemble';
import { bytesToHex, hexToBytes, spliceTemplateScript, encodeMigrateTicketState } from './migrateStateEncode';
import type { MigrateAttestation } from './migrateV2';
import { buildMigrateClaimPlan } from './migrateV2';
import { extractSchnorrSigFromSignatureScript } from '@/lib/covenant/builder/abi-sigscript';

const ATTESTOR_THRESHOLD = 2;
/** MigrateTicket ABI: [0]=issue auth entrypoint, [1]=redeem (without_selector=false). */
const TICKET_REDEEM_SELECTOR = 1n;

async function resolveClaimantXOnly(
  kaspa: Awaited<ReturnType<typeof loadKaspaWasm>>,
  address: string,
  publicKeyHex?: string | null,
): Promise<string> {
  if (publicKeyHex) {
    const body = publicKeyHex.replace(/^0x/i, '').toLowerCase();
    if (/^[0-9a-f]{64}$/.test(body)) return body;
    if (/^[0-9a-f]{66}$/.test(body)) return body.slice(2);
  }
  const XOnly = (kaspa as { XOnlyPublicKey?: { fromAddress: (a: unknown) => unknown } }).XOnlyPublicKey;
  const Address = kaspa.Address;
  if (!XOnly || !Address) throw new Error('Kaspa WASM missing XOnlyPublicKey.fromAddress');
  const x = XOnly.fromAddress(new Address(address));
  return String(x).replace(/^0x/i, '').toLowerCase();
}

function isOrphanReject(err: string | undefined): boolean {
  return Boolean(err && /orphan/i.test(err));
}

async function submitMigrateClaimOnce(input: {
  provider: KaspaWalletProvider;
  attestation: MigrateAttestation;
  tip: MigrateClaimTip;
  fundingAddress: string;
  publicKeyHex?: string | null;
}): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  const tipErr = tipReadyForUserClaim(input.tip);
  if (tipErr) return { ok: false, error: tipErr };

  const plan = buildMigrateClaimPlan(input.attestation);
  if (!plan) return { ok: false, error: 'Ticket outpoint not ready' };

  const wallet = getWalletProvider(input.provider);
  if (!wallet?.signPskt || !wallet.pushTx) {
    return { ok: false, error: 'Wallet needs signPskt + pushTx for Claim' };
  }

  const parents = await waitForClaimParentsReady({
    tip: input.tip,
    ticketTxId: plan.ticketTxId,
    maxAttempts: 8,
    delayMs: 1200,
  });
  if (!parents.ok) return { ok: false, error: parents.error };

  const kaspa = await loadKaspaWasm();
  const claimantXOnly = await resolveClaimantXOnly(kaspa, plan.claimantAddress, input.publicKeyHex);

  const built = await assembleMigrateClaimTx({
    attestation: input.attestation,
    tip: input.tip,
    fundingAddress: input.fundingAddress,
    claimantXOnly,
    kaspa: kaspa as never,
  });
  if (!built.ok || !built.unsignedTxJson) {
    return { ok: false, error: built.error || 'Claim assemble failed' };
  }

  const ticketScript = spliceTemplateScript(
    input.tip.ticketTemplate!,
    encodeMigrateTicketState({
      threshold: ATTESTOR_THRESHOLD,
      burnTxId: plan.burnTxHash,
      amountRaw: plan.amountRaw,
      claimantXOnly,
      active: true,
    }),
  );
  const ticketScriptHex = bytesToHex(ticketScript);

  // 1) Sign ticket redeem input (2)
  const ticketSigned = await signAndBroadcastCovenantPskt(input.provider, {
    unsignedTxJson: built.unsignedTxJson,
    signInputs: [
      {
        index: 2,
        sighashType: 1,
        address: plan.claimantAddress,
        ...(input.publicKeyHex ? { publicKey: input.publicKeyHex } : {}),
      },
    ],
    autoFinalize: false,
    scripts: [{ inputIndex: 2, scriptHex: ticketScriptHex, signType: 1 }],
    skipBroadcast: true,
  });
  if (!ticketSigned.signedTxJson) {
    return { ok: false, error: ticketSigned.error || 'Ticket sign failed' };
  }

  // Wrap ticket unlock: pubkey + sig → P2SH
  const parsed = JSON.parse(ticketSigned.signedTxJson) as {
    inputs: Array<{ signatureScript?: string }>;
  };
  const rawSigScript = parsed.inputs[2]?.signatureScript;
  if (!rawSigScript) {
    return { ok: false, error: 'Wallet did not sign ticket input' };
  }
  const claimSig = extractSchnorrSigFromSignatureScript(rawSigScript);
  // ABI order: claimantPk, claimantSig, selector=1 (redeem). Missing selector made the
  // 65-byte sig get parsed as an int ("Number too big ... exceeds max allowed of 8").
  const ticketPrefix = new kaspa.ScriptBuilder();
  ticketPrefix.addData(hexToBytes(claimantXOnly));
  ticketPrefix.addData(claimSig);
  ticketPrefix.addI64(TICKET_REDEEM_SELECTOR);
  const ticketUnlock = kaspa.ScriptBuilder.fromScript(ticketScript, {
    flags: { covenantsEnabled: true },
  }).encodePayToScriptHashSignatureScript(ticketPrefix.drain());

  const tx = kaspa.Transaction.deserializeFromSafeJSON(ticketSigned.signedTxJson);
  tx.inputs[2].signatureScript = ticketUnlock;
  const withTicketUnlock = tx.serializeToSafeJSON();

  // 2) Sign funding input (3) and broadcast
  const funded = await signAndBroadcastCovenantPskt(input.provider, {
    unsignedTxJson: withTicketUnlock,
    signInputs: [
      {
        index: 3,
        sighashType: 1,
        address: input.fundingAddress,
        ...(input.publicKeyHex ? { publicKey: input.publicKeyHex } : {}),
      },
    ],
    autoFinalize: false,
  });

  if (funded.status === 'failed' || !funded.txHash) {
    return { ok: false, error: funded.error || 'Claim broadcast failed' };
  }
  return { ok: true, txHash: funded.txHash };
}

export async function submitMigrateClaim(input: {
  provider: KaspaWalletProvider;
  attestation: MigrateAttestation;
  tip: MigrateClaimTip;
  fundingAddress: string;
  publicKeyHex?: string | null;
}): Promise<{ ok: boolean; txHash?: string; error?: string }> {
  let last: { ok: boolean; txHash?: string; error?: string } = { ok: false, error: 'Claim failed' };
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
    last = await submitMigrateClaimOnce(input);
    if (last.ok) return last;
    if (!isOrphanReject(last.error)) return last;
  }
  return last;
}
