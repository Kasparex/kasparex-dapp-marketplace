/**
 * Periodic pts_events archival and balance checkpoint (cheap trust signal).
 */

import type { Env } from '../index';

const HOT_DAYS = 180;

/** Move pts_events older than HOT_DAYS to pts_events_archive (batched). */
export async function archiveOldPtsEvents(db: D1Database, batchSize = 45): Promise<number> {
  const cutoff = Date.now() - HOT_DAYS * 24 * 60 * 60 * 1000;
  const rows = await db
    .prepare(
      `SELECT id, idempotency_key, wallet_norm, kind, delta_pts, source, meta_json, created_at
       FROM pts_events WHERE created_at < ? ORDER BY id ASC LIMIT ?`
    )
    .bind(cutoff, batchSize)
    .all<{
      id: number;
      idempotency_key: string;
      wallet_norm: string;
      kind: string;
      delta_pts: number;
      source: string;
      meta_json: string | null;
      created_at: number;
    }>();

  const list = rows.results ?? [];
  if (list.length === 0) return 0;

  const now = Date.now();
  const stmts = list.map((r) =>
    db
      .prepare(
        `INSERT INTO pts_events_archive (
          idempotency_key, wallet_norm, kind, delta_pts, source, meta_json, created_at, archived_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        r.idempotency_key,
        r.wallet_norm,
        r.kind,
        r.delta_pts,
        r.source,
        r.meta_json,
        r.created_at,
        now
      )
  );
  stmts.push(
    ...list.map((r) => db.prepare(`DELETE FROM pts_events WHERE id = ?`).bind(r.id))
  );
  await db.batch(stmts);
  return list.length;
}

/** Store SHA-256 of sorted balance rows plus event tail count. */
export async function insertPtsCheckpoint(db: D1Database): Promise<void> {
  const ev = await db
    .prepare(`SELECT COUNT(1) as c FROM pts_events`)
    .first<{ c: number }>();
  const eventCount = Number(ev?.c ?? 0);

  const balRows = await db
    .prepare(`SELECT wallet_norm, balance_pts FROM pts_balances ORDER BY wallet_norm ASC`)
    .all<{ wallet_norm: string; balance_pts: number }>();
  const lines = (balRows.results ?? []).map((b) => `${b.wallet_norm}:${b.balance_pts}`);
  const rowsPayload = lines.join('|');
  const rowsHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rowsPayload));
  const rowsHash = bufferToHex(rowsHashBuf);

  const rootBuf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${rowsHash}:${eventCount}:${Date.now()}`)
  );
  const rootHash = bufferToHex(rootBuf);
  const balCount = lines.length;

  await db
    .prepare(
      `INSERT INTO pts_checkpoints (root_hash, rows_hash, event_count, balance_row_count, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(rootHash, rowsHash, eventCount, balCount, Date.now())
    .run();
}

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function runPtsMaintenance(env: Env): Promise<void> {
  try {
    let moved = 0;
    for (let i = 0; i < 20; i++) {
      const n = await archiveOldPtsEvents(env.REWARDS_DB, 45);
      moved += n;
      if (n < 45) break;
    }
    if (moved) console.log('[PtsMaintenance] archived events batch total', moved);
  } catch (e) {
    console.error('[PtsMaintenance] archive failed', e);
  }
  try {
    await insertPtsCheckpoint(env.REWARDS_DB);
    console.log('[PtsMaintenance] checkpoint written');
  } catch (e) {
    console.error('[PtsMaintenance] checkpoint failed', e);
  }
}
