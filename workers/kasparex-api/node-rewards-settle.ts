/**
 * Epoch GRID settlement for Krex Nodes (batch/cron).
 */

import type { Env } from '../index';
import tiers from '../config/node-reward-tiers.json';
import { resolveKrexHubPointsMultiplier } from './krex-tier';
import { recordNodeEpochPtsCredit } from './pts-ledger';

type TierConfig = typeof tiers;

function settlementPtsPolicy(cfg: TierConfig): number {
  const s = cfg.settlement as typeof cfg.settlement & { ptsPerQualifiedEpoch?: number };
  return Math.max(0, Math.floor(Number(s.ptsPerQualifiedEpoch ?? 0)));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function roleMultiplier(role: string, cfg: TierConfig): number {
  const m = cfg.roleMultipliers as Record<string, number>;
  return m[role] ?? 1;
}

function regionMultiplier(region: string, cfg: TierConfig): number {
  const r = (region || '').toLowerCase();
  if (cfg.underservedRegions.includes(r)) return cfg.regionMultiplierUnderserved;
  return cfg.regionMultiplierDefault;
}

async function effectiveUptimeHours(env: Env, nodeId: string, fallbackUptime: number): Promise<number> {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const row = await env.NODES_DB.prepare(
    `SELECT COALESCE(SUM(ping_count), 0) as c FROM node_uptime_slices WHERE node_id = ? AND hour_ts >= ?`
  )
    .bind(nodeId, since)
    .first<{ c: number }>();
  const pings = Number(row?.c ?? 0) || 0;
  const fromSlices = pings / 60;
  if (fromSlices > 0) return clamp(fromSlices, 0, 24);
  return clamp(fallbackUptime, 0, 24 * 365);
}

export async function processNodeRewardSettlement(env: Env, epochDate: string, limit = 500): Promise<number> {
  const cfg = tiers;
  const s = cfg.settlement;

  const nodes = await env.NODES_DB.prepare(
    `SELECT node_id, owner_wallet, role, region, uptime_hours, requests_served_total
     FROM nodes WHERE COALESCE(status, 'active') = 'active' LIMIT ?`
  )
    .bind(limit)
    .all<{
      node_id: string;
      owner_wallet: string;
      role: string;
      region: string;
      uptime_hours: number;
      requests_served_total: number;
    }>();

  let written = 0;
  let globalPool = s.globalEpochBudget;

  for (const n of nodes.results ?? []) {
    const exists = await env.NODES_DB.prepare(
      `SELECT 1 as x FROM rewards WHERE node_id = ? AND epoch_date = ?`
    )
      .bind(n.node_id, epochDate)
      .first<{ x: number }>();
    if (exists) continue;

    const effUptime = await effectiveUptimeHours(env, n.node_id, Number(n.uptime_hours) || 0);
    if (effUptime < s.minUptimeHoursForEpoch) continue;

    const uptimeScore = clamp(effUptime / s.targetUptimeHours, 0, 1);
    const req = Math.max(0, Number(n.requests_served_total) || 0);
    const activityScore = clamp(Math.log(1 + req) / s.activityLogNorm, 0, 1);
    const baseGrid = s.gridPerEpochBase * (s.alpha * uptimeScore + s.beta * activityScore);

    const krexM = await resolveKrexHubPointsMultiplier(env, n.owner_wallet);
    const roleM = roleMultiplier(n.role, cfg);
    const regionM = regionMultiplier(n.region || 'unknown', cfg);

    let finalGrid = baseGrid * roleM * krexM * regionM;
    finalGrid = Math.min(finalGrid, s.capPerNodePerEpoch);
    finalGrid = Math.min(finalGrid, Math.max(0, globalPool));
    if (finalGrid <= 0) continue;

    globalPool -= finalGrid;

    const inputs = { uptimeHours: effUptime, uptimeScore, requestsServedTotal: req, activityScore };
    const mults = { role: roleM, krex: krexM, region: regionM };

    await env.NODES_DB.prepare(
      `INSERT INTO rewards (
        node_id, wallet, epoch_date, base_grid, final_grid,
        krex_multiplier, region_multiplier, role_multiplier,
        inputs_json, multipliers_json, payout_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accrued')`
    )
      .bind(
        n.node_id,
        n.owner_wallet,
        epochDate,
        baseGrid,
        finalGrid,
        krexM,
        regionM,
        roleM,
        JSON.stringify(inputs),
        JSON.stringify(mults)
      )
      .run();

    const ptsPolicy = settlementPtsPolicy(cfg);
    try {
      const ptsRes = await recordNodeEpochPtsCredit(env, {
        owner_wallet: n.owner_wallet,
        node_id: n.node_id,
        epoch_date: epochDate,
        final_grid: finalGrid,
        ptsPerQualifiedEpoch: ptsPolicy,
        krexPointsMultiplier: krexM,
      });
      if (!ptsRes.ok) {
        console.warn('[node-rewards-settle] pts credit failed', { node_id: n.node_id, err: ptsRes });
      }
    } catch (pe) {
      console.warn('[node-rewards-settle] pts credit exception', n.node_id, pe);
    }

    written++;
  }

  return written;
}
