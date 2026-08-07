/**
 * User-signed KCC20 migrate claim (v3): spend MigrateTicket + mint against tip.
 * Requires tip.migrateVersion >= 3, tip.adminRenounced, and template parts on the tip.
 */

import type { MigrateAttestation, MigrateClaimPlan } from './migrateV2';
import { buildMigrateClaimPlan } from './migrateV2';
import {
  encodeKcc20State,
  encodeMigrateControllerState,
  encodeMigrateTicketState,
  hexToBytes,
  spliceTemplateScript,
  type ScriptTemplateParts,
} from './migrateStateEncode';
import type { MigrateMintTip } from './mintReceiptStore';

export const MIGRATE_TOTAL_CAP_RAW = 1_000_000n * 100_000_000n;
const IDENTIFIER_PUBKEY = 0x00;
const IDENTIFIER_COVENANT_ID = 0x02;
const MINT_SELECTOR = 2n;
const ATTESTOR_THRESHOLD = 2;
const BRANCH_UTXO_SOMPI = 50_000_000n;
const CONTROLLER_KEEP_SOMPI = 200_000_000n;
const PRIORITY_FEE_SOMPI = 15_000_000n;
const COMPUTE_BUDGET = 200;
const EXTRA_FUNDING_SOMPI = 200_000_000n;

export type MigrateClaimTip = MigrateMintTip & {
  assetTemplate?: ScriptTemplateParts;
  ticketTemplate?: ScriptTemplateParts;
  controllerTemplate?: ScriptTemplateParts;
  legacyNote?: string;
};

export type ClaimAssembleResult = {
  ok: boolean;
  error?: string;
  unsignedTxJson?: string;
  plan?: MigrateClaimPlan;
  tip?: MigrateClaimTip;
};

function tipReadyForUserClaim(tip: MigrateClaimTip | null | undefined): string | null {
  if (!tip) return 'Migrate tip not loaded';
  if (tip.legacyNote) return 'Tip is marked legacy (pre-ticket soak)';
  if (Number(tip.migrateVersion || 0) < 3) return 'Tip migrateVersion < 3 (v3 cutover not live)';
  if (tip.adminRenounced !== true) return 'Tip not post-handover (adminRenounced required for user Claim)';
  if (!tip.assetTemplate || !tip.ticketTemplate || !tip.controllerTemplate) {
    return 'Tip missing asset/ticket/controller template parts for claim assembly';
  }
  return null;
}

async function fetchAddressUtxos(address: string) {
  const res = await fetch(`https://api-tn10.kaspa.org/addresses/${encodeURIComponent(address)}/utxos`);
  if (!res.ok) throw new Error(`UTXO fetch failed for ${address}: ${res.status}`);
  const raw = await res.json();
  return Array.isArray(raw) ? raw : raw.utxos || raw.result || [];
}

async function isTxAcceptedOnTn10(txId: string): Promise<boolean> {
  const id = String(txId || '')
    .trim()
    .toLowerCase()
    .replace(/^0x/i, '');
  if (!/^[a-f0-9]{64}$/.test(id)) return false;
  try {
    const res = await fetch(
      `https://api-tn10.kaspa.org/transactions/${id}?inputs=false&outputs=false&resolve_previous_outpoints=no`,
      { cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return false;
    const j = (await res.json()) as { is_accepted?: boolean; isAccepted?: boolean; block_hash?: unknown };
    if (j.is_accepted === false || j.isAccepted === false) return false;
    if (j.is_accepted === true || j.isAccepted === true) return true;
    return Boolean(j.block_hash);
  } catch {
    return false;
  }
}

/** Wait until tip/ticket parents are accepted so KasWare pushTx does not orphan. */
export async function waitForClaimParentsReady(input: {
  tip: MigrateClaimTip;
  ticketTxId: string;
  maxAttempts?: number;
  delayMs?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const maxAttempts = Math.max(1, input.maxAttempts ?? 10);
  const delayMs = Math.max(250, input.delayMs ?? 1500);
  for (let i = 0; i < maxAttempts; i++) {
    const [minterOk, ctrlOk, ticketOk] = await Promise.all([
      isTxAcceptedOnTn10(input.tip.minterTxId),
      isTxAcceptedOnTn10(input.tip.controllerTxId),
      isTxAcceptedOnTn10(input.ticketTxId),
    ]);
    if (minterOk && ctrlOk && ticketOk) return { ok: true };
    if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return {
    ok: false,
    error:
      'Claim inputs are not confirmed on TN10 yet. Wait a few seconds and tap Claim again.',
  };
}

function findUtxo(list: unknown[], txId: string, index: number) {
  return (list as Array<Record<string, unknown>>).find((u) => {
    const op = (u.outpoint || u.previousOutpoint || {}) as Record<string, unknown>;
    return (
      String(op.transactionId || op.transaction_id || '').toLowerCase() === txId.toLowerCase() &&
      Number(op.index ?? op.outpointIndex ?? 0) === index
    );
  });
}

function utxoAmount(u: Record<string, unknown>): bigint {
  const entry = (u.utxoEntry || u.entry || u) as Record<string, unknown>;
  return BigInt(String(entry.amount ?? u.amount ?? 0));
}

function utxoDaa(u: Record<string, unknown>): bigint {
  const entry = (u.utxoEntry || u.entry || u) as Record<string, unknown>;
  return BigInt(String(entry.blockDaaScore ?? entry.block_daa_score ?? 0));
}

function utxoScriptHex(u: Record<string, unknown>): string {
  const entry = (u.utxoEntry || u.entry || u) as Record<string, unknown>;
  const spkRaw = (entry.scriptPublicKey ?? u.scriptPublicKey) as unknown;
  if (typeof spkRaw === 'string') return spkRaw.replace(/^0x/i, '');
  if (spkRaw && typeof spkRaw === 'object') {
    const o = spkRaw as { scriptPublicKey?: unknown; script?: unknown };
    const s = o.scriptPublicKey ?? o.script ?? '';
    return String(s).replace(/^0x/i, '');
  }
  return '';
}

/** Build unsigned Safe-JSON claim tx for KasWare signPskt + pushTx. */
export async function assembleMigrateClaimTx(input: {
  attestation: MigrateAttestation;
  tip: MigrateClaimTip;
  fundingAddress: string;
  claimantXOnly: string;
  kaspa: {
    Address: new (a: string) => unknown;
    createTransaction: (...args: unknown[]) => {
      version: number;
      inputs: Array<{ sigOpCount: number; computeBudget: number; signatureScript?: unknown }>;
      outputs: Array<{ covenant?: unknown }>;
      finalize: () => void;
      serializeToSafeJSON: () => string;
    };
    CovenantBinding: new (n: number, h: unknown) => unknown;
    Hash: new (hex: string) => unknown;
    payToScriptHashScript: (script: Uint8Array) => unknown;
    addressFromScriptPublicKey: (spk: unknown, network: string) => { toString: () => string };
    ScriptPublicKey: new (version: number, hex: string) => unknown;
    ScriptBuilder: {
      new (): {
        addData: (d: Uint8Array) => unknown;
        addI64: (n: bigint) => unknown;
        drain: () => string;
      };
      fromScript: (
        script: Uint8Array,
        opts: { flags: { covenantsEnabled: boolean } },
      ) => { encodePayToScriptHashSignatureScript: (prefix: string) => string };
    };
  };
}): Promise<ClaimAssembleResult> {
  const tipErr = tipReadyForUserClaim(input.tip);
  if (tipErr) return { ok: false, error: tipErr };

  const plan = buildMigrateClaimPlan(input.attestation);
  if (!plan) return { ok: false, error: 'Invalid claim plan / ticket outpoint' };

  const tip = input.tip;
  const amountRaw = BigInt(plan.amountRaw);
  const remainingBefore = BigInt(tip.remainingAllowance);
  const remainingAfter = remainingBefore - amountRaw;
  if (remainingAfter < 0n) return { ok: false, error: 'Mint exceeds remaining allowance' };

  const assetTemplate = tip.assetTemplate!;
  const ticketTemplate = tip.ticketTemplate!;
  const controllerTemplate = tip.controllerTemplate!;

  const minterScript = spliceTemplateScript(
    assetTemplate,
    encodeKcc20State({
      ownerIdentifier: tip.controllerCovenantId,
      identifierType: IDENTIFIER_COVENANT_ID,
      amount: 0n,
      isMinter: true,
    }),
  );
  const recipientScript = spliceTemplateScript(
    assetTemplate,
    encodeKcc20State({
      ownerIdentifier: input.claimantXOnly,
      identifierType: IDENTIFIER_PUBKEY,
      amount: amountRaw,
      isMinter: false,
    }),
  );
  const spendControllerScript = spliceTemplateScript(
    controllerTemplate,
    encodeMigrateControllerState({
      assetCovenantId: tip.assetCovenantId,
      totalCap: MIGRATE_TOTAL_CAP_RAW,
      remainingAllowance: remainingBefore,
      initialized: true,
      adminRenounced: true,
    }),
  );
  const postMintScript = spliceTemplateScript(
    controllerTemplate,
    encodeMigrateControllerState({
      assetCovenantId: tip.assetCovenantId,
      totalCap: MIGRATE_TOTAL_CAP_RAW,
      remainingAllowance: remainingAfter,
      initialized: true,
      adminRenounced: true,
    }),
  );
  const ticketScript = spliceTemplateScript(
    ticketTemplate,
    encodeMigrateTicketState({
      threshold: ATTESTOR_THRESHOLD,
      burnTxId: plan.burnTxHash,
      amountRaw,
      claimantXOnly: input.claimantXOnly,
      active: true,
    }),
  );

  const { kaspa } = input;
  const minterSpk = kaspa.payToScriptHashScript(minterScript);
  const recipientSpk = kaspa.payToScriptHashScript(recipientScript);
  const postMintSpk = kaspa.payToScriptHashScript(postMintScript);
  const ticketSpk = kaspa.payToScriptHashScript(ticketScript);
  const minterAddress = kaspa.addressFromScriptPublicKey(minterSpk, 'testnet-10').toString();
  const recipientAddress = kaspa.addressFromScriptPublicKey(recipientSpk, 'testnet-10').toString();
  const postMintAddress = kaspa.addressFromScriptPublicKey(postMintSpk, 'testnet-10').toString();
  const ticketAddress = kaspa.addressFromScriptPublicKey(ticketSpk, 'testnet-10').toString();
  const spendControllerAddress = kaspa
    .addressFromScriptPublicKey(kaspa.payToScriptHashScript(spendControllerScript), 'testnet-10')
    .toString();
  if (spendControllerAddress !== tip.controllerAddress) {
    return {
      ok: false,
      error:
        'Migrate tip remainingAllowance does not match live controller. Refresh History and try Claim again.',
    };
  }

  const [minterUtxos, controllerUtxos, ticketUtxos, fundUtxos] = await Promise.all([
    fetchAddressUtxos(tip.minterAddress),
    fetchAddressUtxos(tip.controllerAddress),
    fetchAddressUtxos(ticketAddress),
    fetchAddressUtxos(input.fundingAddress),
  ]);

  const assetLive = findUtxo(minterUtxos, tip.minterTxId, tip.minterIndex);
  const controllerLive = findUtxo(controllerUtxos, tip.controllerTxId, tip.controllerIndex);
  const ticketLive = findUtxo(ticketUtxos, plan.ticketTxId, plan.ticketIndex);
  if (!assetLive) return { ok: false, error: 'Minter UTXO not found on tip address' };
  if (!controllerLive) return { ok: false, error: 'Controller UTXO not found on tip address' };
  if (!ticketLive) {
    return {
      ok: false,
      error: `Ticket UTXO ${plan.ticketId} not found on ${ticketAddress}`,
    };
  }

  const fundCandidates = (fundUtxos as Array<Record<string, unknown>>)
    .map((u) => {
      const op = (u.outpoint || u.previousOutpoint || {}) as Record<string, unknown>;
      return {
        raw: u,
        outpoint: {
          transactionId: String(op.transactionId || op.transaction_id || ''),
          index: Number(op.index ?? op.outpointIndex ?? 0),
        },
        amount: utxoAmount(u),
        scriptHex: utxoScriptHex(u),
        blockDaaScore: utxoDaa(u),
        isCoinbase: Boolean(
          ((u.utxoEntry || u) as Record<string, unknown>).isCoinbase ??
            ((u.utxoEntry || u) as Record<string, unknown>).is_coinbase,
        ),
      };
    })
    .filter((x) => x.amount >= EXTRA_FUNDING_SOMPI)
    .filter((x) => !x.scriptHex.startsWith('aa20'))
    .sort((a, b) => {
      // Prefer older / higher DAA first so we do not spend brand-new fee change.
      if (a.blockDaaScore !== b.blockDaaScore) return a.blockDaaScore > b.blockDaaScore ? -1 : 1;
      return a.amount < b.amount ? -1 : 1;
    });

  let fundPick:
    | (typeof fundCandidates)[number]
    | undefined;
  for (const cand of fundCandidates.slice(0, 8)) {
    const parentOk = await isTxAcceptedOnTn10(cand.outpoint.transactionId);
    if (parentOk || cand.isCoinbase) {
      fundPick = cand;
      break;
    }
  }
  // Fallback: still allow newest if indexer lags (retry path handles orphan).
  if (!fundPick) fundPick = fundCandidates[0];
  if (!fundPick) {
    return {
      ok: false,
      error: `Need a funding UTXO >= ${EXTRA_FUNDING_SOMPI} sompi on ${input.fundingAddress}`,
    };
  }

  const assetAmount = utxoAmount(assetLive as Record<string, unknown>);
  const controllerAmount = utxoAmount(controllerLive as Record<string, unknown>);
  const ticketAmount = utxoAmount(ticketLive as Record<string, unknown>);
  const totalIn = assetAmount + controllerAmount + ticketAmount + fundPick.amount;
  const changeSompi =
    totalIn - BRANCH_UTXO_SOMPI - BRANCH_UTXO_SOMPI - CONTROLLER_KEEP_SOMPI - PRIORITY_FEE_SOMPI;
  if (changeSompi < 0n) {
    return { ok: false, error: `Not enough KAS for claim outputs+fee (in=${totalIn})` };
  }

  const assetEntry = {
    address: new kaspa.Address(tip.minterAddress),
    outpoint: { transactionId: tip.minterTxId, index: tip.minterIndex },
    amount: assetAmount,
    scriptPublicKey: kaspa.payToScriptHashScript(minterScript),
    blockDaaScore: utxoDaa(assetLive as Record<string, unknown>),
    isCoinbase: false,
    covenantId: tip.assetCovenantId,
  };
  const controllerEntry = {
    address: new kaspa.Address(tip.controllerAddress),
    outpoint: { transactionId: tip.controllerTxId, index: tip.controllerIndex },
    amount: controllerAmount,
    scriptPublicKey: kaspa.payToScriptHashScript(spendControllerScript),
    blockDaaScore: utxoDaa(controllerLive as Record<string, unknown>),
    isCoinbase: false,
    covenantId: tip.controllerCovenantId,
  };
  const ticketEntry = {
    address: new kaspa.Address(ticketAddress),
    outpoint: { transactionId: plan.ticketTxId, index: plan.ticketIndex },
    amount: ticketAmount,
    scriptPublicKey: ticketSpk,
    blockDaaScore: utxoDaa(ticketLive as Record<string, unknown>),
    isCoinbase: false,
  };
  const fundingEntry = {
    address: new kaspa.Address(input.fundingAddress),
    outpoint: fundPick.outpoint,
    amount: fundPick.amount,
    scriptPublicKey: new kaspa.ScriptPublicKey(0, fundPick.scriptHex),
    blockDaaScore: fundPick.blockDaaScore,
    isCoinbase: fundPick.isCoinbase,
  };

  const unsigned = kaspa.createTransaction(
    [assetEntry, controllerEntry, ticketEntry, fundingEntry],
    [
      { address: minterAddress, amount: BRANCH_UTXO_SOMPI },
      { address: recipientAddress, amount: BRANCH_UTXO_SOMPI },
      { address: postMintAddress, amount: CONTROLLER_KEEP_SOMPI },
      ...(changeSompi > 0n ? [{ address: input.fundingAddress, amount: changeSompi }] : []),
    ],
    PRIORITY_FEE_SOMPI,
  );
  unsigned.version = 1;
  for (const tin of unsigned.inputs) {
    tin.sigOpCount = 0;
    tin.computeBudget = COMPUTE_BUDGET;
  }
  unsigned.outputs[0].covenant = new kaspa.CovenantBinding(0, new kaspa.Hash(tip.assetCovenantId));
  unsigned.outputs[1].covenant = new kaspa.CovenantBinding(0, new kaspa.Hash(tip.assetCovenantId));
  unsigned.outputs[2].covenant = new kaspa.CovenantBinding(
    1,
    new kaspa.Hash(tip.controllerCovenantId),
  );
  unsigned.finalize();

  // Pre-fill covenant unlock prefixes (wallet signs ticket redeem + funding).
  // Asset leader transfer unlock (input 0)
  const assetPrefix = new kaspa.ScriptBuilder();
  assetPrefix.addData(
    Uint8Array.from([
      ...hexToBytes(tip.controllerCovenantId),
      ...hexToBytes(input.claimantXOnly),
    ]),
  );
  assetPrefix.addData(Uint8Array.from([IDENTIFIER_COVENANT_ID, IDENTIFIER_PUBKEY]));
  const amtPair = new Uint8Array(16);
  new DataView(amtPair.buffer).setBigInt64(0, 0n, true);
  new DataView(amtPair.buffer).setBigInt64(8, amountRaw, true);
  assetPrefix.addData(amtPair);
  assetPrefix.addData(Uint8Array.from([1, 0]));
  assetPrefix.addData(new Uint8Array(0));
  assetPrefix.addData(Uint8Array.from([1]));
  assetPrefix.addI64(0n);
  unsigned.inputs[0].signatureScript = kaspa.ScriptBuilder.fromScript(minterScript, {
    flags: { covenantsEnabled: true },
  }).encodePayToScriptHashSignatureScript(assetPrefix.drain());

  // Controller mint unlock (input 1): post-handover authoritySig is placeholder.
  const dummySig = new Uint8Array(65);
  dummySig[64] = 0x01;
  const ctrlPrefix = new kaspa.ScriptBuilder();
  ctrlPrefix.addData(hexToBytes(tip.assetCovenantId));
  ctrlPrefix.addI64(MIGRATE_TOTAL_CAP_RAW);
  ctrlPrefix.addI64(remainingAfter);
  ctrlPrefix.addI64(1n);
  ctrlPrefix.addI64(1n);
  ctrlPrefix.addData(dummySig);
  ctrlPrefix.addData(hexToBytes(plan.burnTxHash));
  ctrlPrefix.addI64(2n); // ticket input idx
  ctrlPrefix.addData(hexToBytes(tip.controllerCovenantId));
  ctrlPrefix.addData(Uint8Array.from([IDENTIFIER_COVENANT_ID]));
  ctrlPrefix.addI64(0n);
  ctrlPrefix.addI64(1n);
  ctrlPrefix.addData(hexToBytes(input.claimantXOnly));
  ctrlPrefix.addData(Uint8Array.from([IDENTIFIER_PUBKEY]));
  ctrlPrefix.addI64(amountRaw);
  ctrlPrefix.addI64(0n);
  ctrlPrefix.addI64(MINT_SELECTOR);
  unsigned.inputs[1].signatureScript = kaspa.ScriptBuilder.fromScript(spendControllerScript, {
    flags: { covenantsEnabled: true },
  }).encodePayToScriptHashSignatureScript(ctrlPrefix.drain());

  // Ticket redeem left for wallet (input 2). Funding left for wallet (input 3).

  return {
    ok: true,
    unsignedTxJson: unsigned.serializeToSafeJSON(),
    plan,
    tip,
  };
}

export { tipReadyForUserClaim };
