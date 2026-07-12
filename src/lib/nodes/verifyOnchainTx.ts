import type { KaspaRestTransaction } from '@/lib/kaspa/api';

function normalizeWallet(addr: string): string {
  const a = (addr || '').trim();
  if (!a) return '';
  return a.toLowerCase().startsWith('kaspa:') ? a.toLowerCase() : `kaspa:${a.toLowerCase()}`;
}

function outputAddress(o: Record<string, unknown>): string | undefined {
  return (
    (typeof o.script_public_key_address === 'string' ? o.script_public_key_address : undefined) ??
    (typeof o.scriptPublicKeyAddress === 'string' ? o.scriptPublicKeyAddress : undefined) ??
    (typeof o.address === 'string' ? o.address : undefined)
  );
}

function sumOutputsTo(tx: KaspaRestTransaction, target: string): number {
  const targetNorm = normalizeWallet(target);
  let sum = 0;
  for (const o of tx.outputs ?? []) {
    const row = o as Record<string, unknown>;
    const addr = outputAddress(row);
    if (!addr || normalizeWallet(addr) !== targetNorm) continue;
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) sum += amt;
  }
  return sum;
}

function tryDecodeHexPayloadToText(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  const hex = s.startsWith('0x') ? s.slice(2) : s;
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    const text = new TextDecoder().decode(bytes);
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

function getTxPayload(tx: KaspaRestTransaction): string {
  if (typeof tx.payload === 'string' && tx.payload.length > 0) return tx.payload;
  return '';
}

export function minVerifySompi(minKas: number): number {
  return Math.floor(Math.max(0.001, minKas) * 100_000_000);
}

export function validateOnchainVerificationTx(args: {
  tx: KaspaRestTransaction;
  wallet: string;
  toAddress: string;
  minKas?: number;
}): { ok: true } | { ok: false; error: string } {
  const paid = sumOutputsTo(args.tx, args.toAddress);
  if (paid < minVerifySompi(args.minKas ?? 1)) {
    return { ok: false, error: 'Verification payment output is too low.' };
  }

  const rawPayload = getTxPayload(args.tx) || '';
  const decodedPayload = tryDecodeHexPayloadToText(rawPayload) || rawPayload;
  const payload = decodedPayload.toLowerCase();
  if (!payload.includes('krex:verify')) {
    return { ok: false, error: 'Transaction payload must include "krex:verify".' };
  }

  const wallet = normalizeWallet(args.wallet);
  const payers = new Set<string>();
  for (const inp of args.tx.inputs ?? []) {
    const row = inp as Record<string, unknown>;
    const a =
      (typeof row.previous_outpoint_address === 'string' ? row.previous_outpoint_address : undefined) ??
      (typeof row.previousOutpointAddress === 'string' ? row.previousOutpointAddress : undefined);
    if (a) payers.add(normalizeWallet(a));
  }
  if (payers.size > 0 && !payers.has(wallet)) {
    return { ok: false, error: 'Transaction inputs do not show your wallet as the sender.' };
  }

  return { ok: true };
}
