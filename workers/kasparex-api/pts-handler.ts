/**
 * HTTP handler: /kasparex/pts/*
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import type { Address, Hex } from 'viem';
import { applyPtsDelta, getPtsBalance, normalizePtsWallet } from './pts-ledger';
import { requestIdBytes32FromJobId, signClaimVoucher } from './pts-voucher';

const JSON_HDR = { 'Content-Type': 'application/json' };

function json(body: unknown, status = 200, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(), ...JSON_HDR, ...extra },
  });
}

export async function handlePtsRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders() });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/kasparex/pts/balance' && request.method === 'GET') {
    const wallet = url.searchParams.get('wallet') ?? '';
    const w = normalizePtsWallet(wallet);
    if (!w) return json({ error: 'missing wallet' }, 400);
    const balance_pts = await getPtsBalance(env.REWARDS_DB, w);
    return json(
      { wallet_norm: w, balance_pts },
      200,
      { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' }
    );
  }

  if (path === '/kasparex/pts/history' && request.method === 'GET') {
    const wallet = url.searchParams.get('wallet') ?? '';
    const w = normalizePtsWallet(wallet);
    if (!w) return json({ error: 'missing wallet' }, 400);
    const lim = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '40') || 40));
    const rows = await env.REWARDS_DB.prepare(
      `SELECT idempotency_key, kind, delta_pts, source, meta_json, created_at
       FROM pts_events WHERE wallet_norm = ? ORDER BY created_at DESC LIMIT ?`
    )
      .bind(w, lim)
      .all<{
        idempotency_key: string;
        kind: string;
        delta_pts: number;
        source: string;
        meta_json: string | null;
        created_at: number;
      }>();
    const events = (rows.results ?? []).map((r) => ({
      ...r,
      meta: r.meta_json ? safeJson(r.meta_json) : null,
    }));
    return json({ wallet_norm: w, events });
  }

  if (path === '/kasparex/pts/ingest' && request.method === 'POST') {
    const secret = (env.PTS_INGEST_SECRET ?? '').trim();
    const hdr = request.headers.get('X-Pts-Ingest-Secret')?.trim() ?? '';
    if (!secret || hdr !== secret) {
      return json({ error: 'unauthorized_ingest' }, 401);
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400);
    }
    const b = body as Record<string, unknown>;
    const wallet_norm = normalizePtsWallet(String(b.wallet ?? b.wallet_norm ?? ''));
    const delta = Number(b.delta_pts);
    const source = String(b.source ?? '').trim();
    const idempotency_key = String(b.idempotency_key ?? '').trim();
    if (!wallet_norm || !source || !idempotency_key || !Number.isFinite(delta)) {
      return json({ error: 'invalid body' }, 400);
    }
    const kind = delta >= 0 ? 'credit' : 'debit';
    const meta =
      b.meta && typeof b.meta === 'object' ? (b.meta as Record<string, unknown>) : undefined;
    const res = await applyPtsDelta(env.REWARDS_DB, {
      wallet_norm,
      delta_pts: Math.trunc(delta),
      kind,
      source,
      idempotency_key,
      meta,
    });
    if (!res.ok) {
      return json({ error: res.error, detail: 'detail' in res ? res.detail : undefined }, 400);
    }
    return json({
      balance_pts: res.balance_pts,
      duplicate: res.duplicate,
    });
  }

  if (path === '/kasparex/pts/redeem' && request.method === 'POST') {
    const secret = ((env.PTS_REDEEM_SECRET ?? env.PTS_INGEST_SECRET) ?? '').trim();
    const hdr = request.headers.get('X-Pts-Redeem-Secret')?.trim() ?? '';
    if (!secret || hdr !== secret) {
      return json({ error: 'unauthorized_redeem' }, 401);
    }
    const pk = env.VOUCHER_SIGNER_PRIVATE_KEY as Hex | undefined;
    const vault = env.REWARDS_CLAIM_VAULT_ADDRESS as Address | undefined;
    const chainId = env.VOUCHER_CHAIN_ID ? Number(env.VOUCHER_CHAIN_ID) : NaN;
    const rpc = env.IGRA_RPC_URL;
    if (!pk || !vault || !Number.isFinite(chainId) || !rpc?.startsWith('http')) {
      return json({ error: 'voucher signing not configured' }, 503);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400);
    }
    const b = body as Record<string, unknown>;
    const wallet_kaspa_norm = normalizePtsWallet(String(b.wallet_kaspa ?? b.wallet ?? ''));
    const evm_beneficiary = String(b.evm_beneficiary ?? '').trim().toLowerCase();
    const token_address = String(b.token_address ?? '').trim().toLowerCase();
    const amount_wei = String(b.amount_wei ?? '').trim();
    const pts_spent = Math.floor(Number(b.pts_spent));
    if (
      !wallet_kaspa_norm ||
      !evm_beneficiary.startsWith('0x') ||
      evm_beneficiary.length !== 42 ||
      !token_address.startsWith('0x') ||
      token_address.length !== 42 ||
      !/^[0-9]+$/.test(amount_wei) ||
      pts_spent <= 0
    ) {
      return json({ error: 'invalid body' }, 400);
    }

    const jobId =
      typeof b.request_id === 'string' && b.request_id.trim()
        ? b.request_id.trim()
        : `rdm_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const requestId = requestIdBytes32FromJobId(jobId);
    const idempotencyDebit = `redeem:${jobId}`;

    const debit = await applyPtsDelta(env.REWARDS_DB, {
      wallet_norm: wallet_kaspa_norm,
      delta_pts: -pts_spent,
      kind: 'debit',
      source: 'l2_redeem_voucher',
      idempotency_key: idempotencyDebit,
      meta: {
        evm_beneficiary,
        token_address,
        amount_wei,
        request_id: jobId,
      },
    });
    if (!debit.ok) {
      return json({ error: debit.error, detail: 'detail' in debit ? debit.detail : undefined }, 400);
    }

    if (debit.duplicate) {
      const prev = await env.REWARDS_DB.prepare(
        `SELECT pts_spent, evm_beneficiary, token_address, amount_wei, request_id, voucher_deadline, chain_id, vault_address, voucher_signature, voucher_nonce
         FROM redemption_jobs WHERE id = ?`
      )
        .bind(jobId)
        .first<{
          pts_spent: number;
          evm_beneficiary: string;
          token_address: string;
          amount_wei: string;
          request_id: string;
          voucher_deadline: number;
          chain_id: number;
          vault_address: string;
          voucher_signature: string | null;
          voucher_nonce: string | null;
        }>();
      if (prev?.voucher_signature && prev.voucher_nonce != null) {
        const deadlineSec = BigInt(Math.floor(prev.voucher_deadline / 1000));
        return json({
          job_id: jobId,
          balance_pts: debit.balance_pts,
          duplicate_debit: true,
          voucher: {
            beneficiary: prev.evm_beneficiary,
            token: prev.token_address,
            amount: prev.amount_wei,
            ptsConsumed: String(prev.pts_spent),
            requestId: prev.request_id as Hex,
            nonce: prev.voucher_nonce,
            deadline: deadlineSec.toString(),
            signature: prev.voucher_signature as Hex,
            chainId: prev.chain_id,
            vault: prev.vault_address,
          },
        });
      }
      return json(
        { error: 'duplicate_debit_missing_voucher', job_id: jobId, balance_pts: debit.balance_pts },
        409
      );
    }

    const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + 3600);
    let signature: Hex;
    let nonce: bigint;
    try {
      const key = (pk.startsWith('0x') ? pk : `0x${pk}`) as Hex;
      const signed = await signClaimVoucher({
        rpcUrl: rpc,
        privateKey: key,
        chainId,
        vault,
        beneficiary: evm_beneficiary as Address,
        token: token_address as Address,
        amount: BigInt(amount_wei),
        ptsConsumed: BigInt(pts_spent),
        requestId,
        deadline: deadlineSec,
      });
      signature = signed.signature;
      nonce = signed.nonce;
    } catch (e) {
      console.error('[pts/redeem] sign failed', e);
      const rev = await applyPtsDelta(env.REWARDS_DB, {
        wallet_norm: wallet_kaspa_norm,
        delta_pts: pts_spent,
        kind: 'credit',
        source: 'l2_redeem_sign_failed_refund',
        idempotency_key: `redeem_revert:${jobId}`,
        meta: { job_id: jobId },
      });
      return json(
        {
          error: 'sign_failed',
          detail: e instanceof Error ? e.message : String(e),
          refund_ok: rev.ok,
          balance_pts: rev.ok ? rev.balance_pts : undefined,
        },
        500
      );
    }

    const now = Date.now();
    await env.REWARDS_DB.prepare(
      `INSERT INTO redemption_jobs (
        id, wallet_kaspa_norm, evm_beneficiary, token_address, amount_wei, pts_spent,
        request_id, status, voucher_deadline, chain_id, vault_address, voucher_signature, voucher_nonce, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'voucher_issued', ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        jobId,
        wallet_kaspa_norm,
        evm_beneficiary,
        token_address,
        amount_wei,
        pts_spent,
        requestId,
        Number(deadlineSec) * 1000,
        chainId,
        vault,
        signature,
        nonce.toString(),
        now,
        now
      )
      .run();

    return json({
      job_id: jobId,
      balance_pts: debit.balance_pts,
      duplicate_debit: debit.duplicate,
      voucher: {
        beneficiary: evm_beneficiary,
        token: token_address,
        amount: amount_wei,
        ptsConsumed: String(pts_spent),
        requestId,
        nonce: nonce.toString(),
        deadline: deadlineSec.toString(),
        signature,
        chainId,
        vault,
      },
    });
  }

  return json({ error: 'Not found' }, 404);
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}
