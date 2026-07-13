/**
 * Authoritative pts ledger on REWARDS_DB (append-only events + materialized balance).
 */

import type { Env } from '../index';

export function normalizePtsWallet(wallet: string): string {
  return (wallet ?? '').trim().toLowerCase();
}

export async function getPtsBalance(db: D1Database, walletNorm: string): Promise<number> {
  const row = await db
    .prepare(`SELECT balance_pts FROM pts_balances WHERE wallet_norm = ?`)
    .bind(walletNorm)
    .first<{ balance_pts: number }>();
  return Math.max(0, Number(row?.balance_pts ?? 0) || 0);
}

export interface ApplyPtsDeltaArgs {
  wallet_norm: string;
  /** Signed: positive credit, negative debit */
  delta_pts: number;
  kind: 'credit' | 'debit';
  source: string;
  idempotency_key: string;
  meta?: Record<string, unknown>;
}

export type ApplyPtsResult =
  | { ok: true; duplicate: true; balance_pts: number }
  | { ok: true; duplicate: false; balance_pts: number }
  | { ok: false; error: 'insufficient_balance' | 'invalid_delta' | 'db_error'; detail?: string };

export async function applyPtsDelta(db: D1Database, args: ApplyPtsDeltaArgs): Promise<ApplyPtsResult> {
  const w = normalizePtsWallet(args.wallet_norm);
  if (!w) return { ok: false, error: 'invalid_delta', detail: 'empty wallet' };

  const delta = Math.trunc(args.delta_pts);
  if (delta === 0) return { ok: false, error: 'invalid_delta', detail: 'zero delta' };
  if (args.kind === 'credit' && delta <= 0) return { ok: false, error: 'invalid_delta', detail: 'credit must be positive' };
  if (args.kind === 'debit' && delta >= 0) return { ok: false, error: 'invalid_delta', detail: 'debit must be negative' };

  const key = (args.idempotency_key ?? '').trim();
  if (!key) return { ok: false, error: 'invalid_delta', detail: 'missing idempotency_key' };

  const existing = await db
    .prepare(`SELECT id FROM pts_events WHERE idempotency_key = ?`)
    .bind(key)
    .first<{ id: number }>();
  if (existing?.id) {
    const bal = await getPtsBalance(db, w);
    return { ok: true, duplicate: true, balance_pts: bal };
  }

  if (args.kind === 'debit') {
    const balBefore = await getPtsBalance(db, w);
    if (balBefore + delta < 0) return { ok: false, error: 'insufficient_balance' };
  }

  const now = Date.now();
  const metaStr = serializeMeta(args.meta);

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO pts_events (idempotency_key, wallet_norm, kind, delta_pts, source, meta_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(key, w, args.kind, delta, args.source, metaStr, now),
      db
        .prepare(
          `INSERT INTO pts_balances (wallet_norm, balance_pts, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(wallet_norm) DO UPDATE SET
             balance_pts = pts_balances.balance_pts + excluded.balance_pts,
             updated_at = excluded.updated_at`
        )
        .bind(w, delta, now),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE constraint failed/i.test(msg)) {
      const bal = await getPtsBalance(db, w);
      return { ok: true, duplicate: true, balance_pts: bal };
    }
    return { ok: false, error: 'db_error', detail: msg };
  }

  const bal = await getPtsBalance(db, w);
  return { ok: true, duplicate: false, balance_pts: bal };
}

function serializeMeta(meta?: Record<string, unknown>): string | null {
  if (!meta || Object.keys(meta).length === 0) return null;
  try {
    return JSON.stringify(meta);
  } catch {
    return null;
  }
}

const NODE_EPOCH_PTS_BASE_SOURCE = 'node_epoch';

/** Policy: base pts per qualified node epoch (tunable in node-reward-tiers.json). */
export function nodeEpochPtsDelta(cfg: { ptsPerQualifiedEpoch: number; krexPointsMultiplier?: number }): number {
  const base = Math.max(0, Math.floor(cfg.ptsPerQualifiedEpoch));
  const mult = Math.max(1, Math.floor(Number(cfg.krexPointsMultiplier ?? 1) || 1));
  return Math.floor(base * mult);
}

export async function recordNodeEpochPtsCredit(
  env: { REWARDS_DB: D1Database },
  args: {
    owner_wallet: string;
    node_id: string;
    epoch_date: string;
    final_grid: number;
    ptsPerQualifiedEpoch: number;
    krexPointsMultiplier?: number;
  }
): Promise<ApplyPtsResult> {
  const krexMult = Math.max(1, Math.floor(Number(args.krexPointsMultiplier ?? 1) || 1));
  const pts = nodeEpochPtsDelta({ ptsPerQualifiedEpoch: args.ptsPerQualifiedEpoch, krexPointsMultiplier: krexMult });
  if (pts <= 0) {
    return { ok: true, duplicate: false, balance_pts: await getPtsBalance(env.REWARDS_DB, normalizePtsWallet(args.owner_wallet)) };
  }
  const wallet_norm = normalizePtsWallet(args.owner_wallet);
  const idempotency_key = `node_epoch:${args.node_id}:${args.epoch_date}`;
  return applyPtsDelta(env.REWARDS_DB, {
    wallet_norm,
    delta_pts: pts,
    kind: 'credit',
    source: NODE_EPOCH_PTS_BASE_SOURCE,
    idempotency_key,
    meta: {
      node_id: args.node_id,
      epoch_date: args.epoch_date,
      final_grid: args.final_grid,
      krex_points_multiplier: krexMult,
      pts_base: args.ptsPerQualifiedEpoch,
    },
  });
}
