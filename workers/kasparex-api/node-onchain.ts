import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import { fetchKaspaRestTransaction, type KaspaRestTransaction, type KaspaRestTxInput, type KaspaRestTxOutput } from './kaspa-rest';
import { verifyJwtHs256 } from './node-crypto';

function enrollmentSecret(env: Env): string | null {
  return env.NODE_ENROLLMENT_SECRET?.trim() || null;
}

function normalizeWallet(addr: string): string {
  const a = (addr || '').trim();
  if (!a) return '';
  return a.toLowerCase().startsWith('kaspa:') ? a : `kaspa:${a}`;
}

function normalizeKaspaTxid(txid: string): string {
  return txid.replace(/^0x/i, '').trim().toLowerCase();
}

function minSompi(env: Env): number {
  const kas = Number(env.NODE_VERIFY_MIN_KAS ?? '1') || 1;
  return Math.floor(Math.max(0.001, kas) * 100_000_000);
}

function requiredToAddress(env: Env): string | null {
  const a = (env.NODE_VERIFY_TO_ADDRESS || '').trim();
  if (!a) return null;
  return a.toLowerCase().startsWith('kaspa:') ? a.toLowerCase() : `kaspa:${a.toLowerCase()}`;
}

function outputAddress(o: KaspaRestTxOutput): string | undefined {
  const any = o as Record<string, unknown>;
  return (
    o.script_public_key_address ??
    o.scriptPublicKeyAddress ??
    o.address ??
    (typeof o.script_public_key === 'object' && o.script_public_key && typeof o.script_public_key.address === 'string'
      ? o.script_public_key.address
      : undefined) ??
    (typeof o.scriptPublicKey === 'object' && o.scriptPublicKey && typeof o.scriptPublicKey.address === 'string'
      ? o.scriptPublicKey.address
      : undefined) ??
    (typeof any.scriptPublicKey === 'object' &&
    any.scriptPublicKey &&
    typeof (any.scriptPublicKey as { address?: string }).address === 'string'
      ? (any.scriptPublicKey as { address: string }).address
      : undefined)
  );
}

function sumOutputsTo(tx: KaspaRestTransaction, target: string): number {
  const targetNorm = normalizeWallet(target);
  let sum = 0;
  for (const o of tx.outputs ?? []) {
    const addr = outputAddress(o);
    if (!addr) continue;
    if (normalizeWallet(addr) !== targetNorm) continue;
    const amt = typeof o.amount === 'string' ? parseInt(o.amount, 10) : Number(o.amount ?? 0);
    if (!Number.isNaN(amt) && amt > 0) sum += amt;
  }
  return sum;
}

function payerAddressesFromTx(tx: KaspaRestTransaction): Set<string> {
  const set = new Set<string>();
  for (const inp of tx.inputs ?? []) {
    const vd = inp.verboseData ?? inp.verbose_data;
    const fromVerbose = vd && typeof vd.address === 'string' ? vd.address : undefined;
    const a = inp.previous_outpoint_address ?? inp.previousOutpointAddress ?? fromVerbose;
    if (a && typeof a === 'string') set.add(normalizeWallet(a));
  }
  return set;
}

function getTxPayload(tx: KaspaRestTransaction): string | null {
  const p = tx.payload;
  if (typeof p === 'string' && p.length > 0) return p;
  const vd = tx.verboseData ?? tx.verbose_data;
  if (vd && typeof vd.payload === 'string' && vd.payload.length > 0) return vd.payload;
  return null;
}

function tryDecodeHexPayloadToText(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;
  const hex = s.startsWith('0x') ? s.slice(2) : s;
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
  if (hex.length % 2 !== 0) return null;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    // Kaspa payloads are typically UTF-8 text for our use-case.
    const text = new TextDecoder().decode(bytes);
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

type VerifyOnchainBody = {
  enrollmentToken?: string;
  tx_hash?: string;
};

type PendingResponse = { ok: false; pending: true; error: string };

/**
 * POST /kasparex/node/verify-onchain
 *
 * Verifies a symbolic L1 action: send >= NODE_VERIFY_MIN_KAS KAS to NODE_VERIFY_TO_ADDRESS
 * from the wallet that just passed /verify-wallet.
 *
 * Wallet-first flow:
 * - payload must contain `krex:verify` (stable, not session-based).
 * - once verified, the wallet is marked verified in D1 and enrollment/editing is unlocked.
 */
export async function handleNodeVerifyOnchain(request: Request, env: Env): Promise<Response> {
  const cors = getCorsHeaders();
  const secret = enrollmentSecret(env);
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: 'NODE_ENROLLMENT_SECRET not configured' }), {
      status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  const toAddr = requiredToAddress(env);
  if (!toAddr) {
    return new Response(JSON.stringify({ ok: false, error: 'NODE_VERIFY_TO_ADDRESS not configured' }), {
      status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as VerifyOnchainBody;
    const token = body.enrollmentToken?.trim();
    const txHash = body.tx_hash?.trim();
    if (!token || !txHash) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing enrollmentToken or tx_hash' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const pl = await verifyJwtHs256(secret, token);
    if (!pl || pl.typ !== 'krex-enroll' || typeof pl.wallet !== 'string' || typeof pl.nonce !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid or expired enrollment token' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const wallet = normalizeWallet(pl.wallet as string);

    // If wallet is already verified, return the existing txid.
    const existing = await env.NODES_DB.prepare(
      `SELECT verified_txid, verified_at FROM wallet_verifications WHERE LOWER(wallet) = LOWER(?)`
    )
      .bind(wallet)
      .first<{ verified_txid: string; verified_at: number }>();
    if (existing?.verified_txid) {
      return new Response(
        JSON.stringify({
          ok: true,
          tx_hash: existing.verified_txid,
          alreadyVerified: true,
          verified_at: existing.verified_at,
        }),
        {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    const tx = await fetchKaspaRestTransaction(env, txHash);
    if (!tx) {
      const body: PendingResponse = {
        ok: false,
        pending: true,
        error: 'Transaction not indexed yet. Kaspa REST may be slow; retry in a few seconds.',
      };
      // 202 indicates "accepted, still processing" (indexer lag).
      return new Response(JSON.stringify(body), {
        status: 202,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const paid = sumOutputsTo(tx, toAddr);
    if (paid < minSompi(env)) {
      return new Response(JSON.stringify({ ok: false, error: 'Verification payment output is too low.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const payers = payerAddressesFromTx(tx);
    if (payers.size > 0 && !payers.has(wallet)) {
      return new Response(JSON.stringify({ ok: false, error: 'Transaction inputs do not show your wallet as the sender.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const rawPayload = getTxPayload(tx) || '';
    const decodedPayload = tryDecodeHexPayloadToText(rawPayload) || rawPayload;
    const payload = decodedPayload.toLowerCase();
    const want = 'krex:verify';
    if (!payload.includes(want)) {
      return new Response(JSON.stringify({ ok: false, error: `Transaction payload must include "${want}".` }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const normTxid = normalizeKaspaTxid(txHash);
    const now = Date.now();
    await env.NODES_DB.prepare(
      `INSERT INTO wallet_verifications (wallet, verified_txid, verified_at)
       VALUES (?, ?, ?)
       ON CONFLICT(wallet) DO UPDATE SET verified_txid = excluded.verified_txid, verified_at = excluded.verified_at`
    )
      .bind(wallet, normTxid, now)
      .run();

    return new Response(JSON.stringify({ ok: true, tx_hash: normTxid, verified_at: now }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('verify-onchain', e);
    return new Response(JSON.stringify({ ok: false, error: 'Verification failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

