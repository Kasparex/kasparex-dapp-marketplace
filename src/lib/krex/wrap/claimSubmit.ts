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
  type MigrateClaimTip,
} from './claimAssemble';
import { bytesToHex, hexToBytes, spliceTemplateScript, encodeMigrateTicketState } from './migrateStateEncode';
import type { MigrateAttestation } from './migrateV2';
import { buildMigrateClaimPlan } from './migrateV2';

const ATTESTOR_THRESHOLD = 2;

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

function extractSchnorrFromSigScript(sigScriptHex: string): Uint8Array {
  const bytes = hexToBytes(sigScriptHex.replace(/^0x/i, ''));
  // Common shapes: raw 65, or push+65, or longer P2SH wrap: take last 65 with sighash.
  if (bytes.length === 65) return bytes;
  if (bytes.length >= 65) {
    const slice = bytes.slice(bytes.length - 65);
    if (slice[64] === 0x01 || slice[64] === 0x00) return slice;
  }
  if (bytes.length >= 66 && bytes[0] === 65) return bytes.slice(1, 66);
  throw new Error('Could not extract Schnorr signature from wallet signatureScript');
}

export async function submitMigrateClaim(input: {
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
  const claimSig = extractSchnorrFromSigScript(rawSigScript);
  const ticketPrefix = new kaspa.ScriptBuilder();
  ticketPrefix.addData(hexToBytes(claimantXOnly));
  ticketPrefix.addData(claimSig);
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
