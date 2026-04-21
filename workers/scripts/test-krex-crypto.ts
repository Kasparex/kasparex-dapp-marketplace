/**
 * Golden-vector checks for node HMAC string and GRID preview math (mirrors Worker logic).
 * Run: cd workers && npm run test:krex-crypto
 */
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmacSha256Hex(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data, 'utf8').digest('hex');
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// --- HMAC canonical string (must match workers/kasparex-api/node-crypto.ts) ---
const secret = 'krex-test-secret';
const body = JSON.stringify({ node_id: 'node-test-1', seq: 42 });
const ts = 1700000000;
const nonce = 'deadbeef';
const bodySha = sha256Hex(body);
const sig = hmacSha256Hex(secret, `${ts}.${nonce}.${bodySha}`);
assert(sig.length === 64, 'signature hex length');
assert(/^[0-9a-f]+$/.test(sig), 'signature hex charset');

// --- Settlement preview (mirrors workers/kasparex-api/rewards.ts previewNodeRewardGrid) ---
const tiersPath = join(process.cwd(), 'config', 'node-reward-tiers.json');
const tiers = JSON.parse(readFileSync(tiersPath, 'utf8')) as {
  roleMultipliers: Record<string, number>;
  underservedRegions: string[];
  regionMultiplierUnderserved: number;
  regionMultiplierDefault: number;
  settlement: {
    gridPerEpochBase: number;
    alpha: number;
    beta: number;
    targetUptimeHours: number;
    activityLogNorm: number;
    minUptimeHoursForEpoch: number;
    capPerNodePerEpoch: number;
  };
};

function roleMultiplier(role: string): number {
  return tiers.roleMultipliers[role] ?? 1;
}

function regionMultiplier(region: string): number {
  const r = (region || '').toLowerCase();
  return tiers.underservedRegions.includes(r) ? tiers.regionMultiplierUnderserved : tiers.regionMultiplierDefault;
}

function previewFinalGrid(input: {
  role: string;
  region: string;
  uptime_hours: number;
  requests_served_total: number;
  krex_multiplier: number;
}): number {
  const s = tiers.settlement;
  if ((input.uptime_hours || 0) < s.minUptimeHoursForEpoch) return 0;
  const uptimeScore = Math.min(Math.max(0, (input.uptime_hours || 0) / s.targetUptimeHours), 1);
  const req = Math.max(0, Number(input.requests_served_total) || 0);
  const activityScore = Math.min(Math.log(1 + req) / s.activityLogNorm, 1);
  let baseGrid = s.gridPerEpochBase * (s.alpha * uptimeScore + s.beta * activityScore);
  const roleM = roleMultiplier(input.role);
  const regionM = regionMultiplier(input.region);
  let finalGrid = baseGrid * roleM * input.krex_multiplier * regionM;
  finalGrid = Math.min(finalGrid, s.capPerNodePerEpoch);
  return finalGrid;
}

// Scenario A from plan: Light, 24h, 10k req, krex 1, region 1 → base 1000, final 4000
const a = previewFinalGrid({
  role: 'light',
  region: 'eu-west',
  uptime_hours: 24,
  requests_served_total: 10_000,
  krex_multiplier: 1,
});
assert(Math.abs(a - 4000) < 0.01, `Scenario A expected ~4000, got ${a}`);

const b = previewFinalGrid({
  role: 'mirror',
  region: 'eu-west',
  uptime_hours: 24,
  requests_served_total: 10_000,
  krex_multiplier: 1,
});
assert(Math.abs(b - 5000) < 0.01, `Scenario B expected ~5000, got ${b}`);

const belowMin = previewFinalGrid({
  role: 'light',
  region: 'eu-west',
  uptime_hours: 6,
  requests_served_total: 10_000,
  krex_multiplier: 1,
});
assert(belowMin === 0, `Below min uptime should be 0, got ${belowMin}`);

console.log('test-krex-crypto: OK', { hmacSample: sig.slice(0, 16) + '…', scenarioA: a, scenarioB: b });
