const DEFAULT_REWARDS_WALLET = 'kaspa:qzsjrd50vw36g4aj7ufj2d9a4fhewehaegxm7xmlt7jntlx6dpv2q77jl6fkn';
const DEFAULT_POOL_PERCENT = 80;
const DEFAULT_SPLITS = [50, 30, 20] as const;

export type RewardBreakdown = {
  wallet: string;
  poolPercent: number;
  splits: readonly [number, number, number];
  balanceKas: number;
  poolKas: number;
  firstKas: number;
  secondKas: number;
  thirdKas: number;
};

function parsePercent(raw: string | undefined, fallback: number): number {
  const n = Number(raw ?? '');
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(100, n);
}

export function rewardsWalletAddress(): string {
  return process.env.NEXT_PUBLIC_CHRONICLES_REWARDS_WALLET?.trim() || DEFAULT_REWARDS_WALLET;
}

export function rewardsPoolPercent(): number {
  return parsePercent(process.env.NEXT_PUBLIC_CHRONICLES_REWARDS_POOL_PERCENT, DEFAULT_POOL_PERCENT);
}

export function rewardsSplits(): readonly [number, number, number] {
  const raw = (process.env.NEXT_PUBLIC_CHRONICLES_REWARDS_SPLIT ?? '').trim();
  if (!raw) return DEFAULT_SPLITS;
  const parts = raw.split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length !== 3 || parts.some((x) => !Number.isFinite(x) || x < 0)) return DEFAULT_SPLITS;
  const sum = parts[0] + parts[1] + parts[2];
  if (sum <= 0) return DEFAULT_SPLITS;
  return [parts[0], parts[1], parts[2]];
}

export function computeRewardBreakdown(balanceKas: number): RewardBreakdown {
  const wallet = rewardsWalletAddress();
  const poolPercent = rewardsPoolPercent();
  const [s1, s2, s3] = rewardsSplits();
  const splitTotal = s1 + s2 + s3;
  const safeBalance = Number.isFinite(balanceKas) && balanceKas > 0 ? balanceKas : 0;
  const poolKas = (safeBalance * poolPercent) / 100;
  return {
    wallet,
    poolPercent,
    splits: [s1, s2, s3],
    balanceKas: safeBalance,
    poolKas,
    firstKas: splitTotal > 0 ? (poolKas * s1) / splitTotal : 0,
    secondKas: splitTotal > 0 ? (poolKas * s2) / splitTotal : 0,
    thirdKas: splitTotal > 0 ? (poolKas * s3) / splitTotal : 0,
  };
}
