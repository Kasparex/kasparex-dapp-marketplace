import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
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

type KaspaRestTxOutput = {
  amount?: number | string;
  script_public_key_address?: string;
  scriptPublicKeyAddress?: string;
  address?: string;
  script_public_key?: { address?: string };
  scriptPublicKey?: { address?: string };
};

type KaspaRestTxInput = {
  previous_outpoint_address?: string | null;
  previousOutpointAddress?: string | null;
  verboseData?: { address?: string } | null;
  verbose_data?: { address?: string } | null;
};

type KaspaRestTransaction = {
  transaction_id?: string;
  transactionId?: string;
  payload?: string | null;
  verboseData?: { payload?: string } | null;
  verbose_data?: { payload?: string } | null;
  outputs?: KaspaRestTxOutput[];
  inputs?: KaspaRestTxInput[];
};

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

async function getRestTransactionById(txId: string, maxAttempts = 8): Promise<KaspaRestTransaction | null> {
  const hash = normalizeKaspaTxid(txId);
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;
  const query = 'inputs=true&outputs=true&resolve_previous_outpoints=light';
  const urls = [
    `https://api.kaspa.org/transactions/${hash}?${query}`,
    `https://api.kaspa.org/v1/transactions/${hash}?${query}`,
  ];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = (await res.json()) as unknown;
        if (data && typeof data === 'object') return data as KaspaRestTransaction;
      } catch {
        // ignore
      }
    }
    // backoff
    await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
  }
  return null;
}

type VerifyOnchainBody = {
  enrollmentToken?: string;
  node_id?: string;
  tx_hash?: string;
};

/**
 * POST /kasparex/node/verify-onchain
 *
 * Verifies a symbolic L1 action: send >= NODE_VERIFY_MIN_KAS KAS to NODE_VERIFY_TO_ADDRESS
 * from the wallet that just passed /verify-wallet.
 *
 * Also requires the transaction payload to contain `krex:<node_id>` for binding.
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
    const nodeId = body.node_id?.trim();
    const txHash = body.tx_hash?.trim();
    if (!token || !nodeId || !txHash) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing enrollmentToken, node_id, or tx_hash' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const pl = await verifyJwtHs256(secret, token);
    if (!pl || pl.typ !== 'krex-enroll' || typeof pl.wallet !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid or expired enrollment token' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const wallet = normalizeWallet(pl.wallet as string);

    const node = await env.NODES_DB.prepare(`SELECT owner_wallet, verified_txid FROM nodes WHERE node_id = ?`)
      .bind(nodeId)
      .first<{ owner_wallet: string; verified_txid: string | null }>();
    if (!node) {
      return new Response(JSON.stringify({ ok: false, error: 'Node not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (normalizeWallet(node.owner_wallet) !== wallet) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (node.verified_txid) {
      return new Response(JSON.stringify({ ok: true, tx_hash: node.verified_txid, alreadyVerified: true }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const tx = await getRestTransactionById(txHash, 8);
    if (!tx) {
      return new Response(JSON.stringify({ ok: false, error: 'Transaction not found yet. Wait for confirmation and try again.' }), {
        status: 404,
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

    const payload = (getTxPayload(tx) || '').toLowerCase();
    const want = `krex:${nodeId}`.toLowerCase();
    if (!payload.includes(want)) {
      return new Response(JSON.stringify({ ok: false, error: `Transaction payload must include "${want}".` }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const normTxid = normalizeKaspaTxid(txHash);
    const now = Date.now();
    await env.NODES_DB.prepare(`UPDATE nodes SET verified_txid = ?, verified_at = ? WHERE node_id = ?`)
      .bind(normTxid, now, nodeId)
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

