import type { NodeType } from '@/lib/nodes/types';
import rewardTiers from '@/config/node-reward-tiers.json';

export const KREX_NODE_ROLES: NodeType[] = ['light', 'edge', 'super'];

export function normalizeNodeRole(role: string | undefined | null): NodeType {
  const r = (role ?? '').trim().toLowerCase();
  if (r === 'mirror') return 'edge';
  if (r === 'light' || r === 'edge' || r === 'super') return r;
  return 'light';
}

export function roleRequiresPublicHttps(role: NodeType): boolean {
  return role === 'edge' || role === 'super';
}

export function isPublicHttpsUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
  } catch {
    return false;
  }
}

export function validateNodeUrlForRole(role: NodeType, url: string | undefined | null): string | null {
  if (!roleRequiresPublicHttps(role)) return null;
  if (!isPublicHttpsUrl(url)) {
    return 'Edge and Super nodes require a public HTTPS URL. Test on localhost first, then enroll with your tunnel or VPS URL.';
  }
  return null;
}

const enrollByRole = (rewardTiers.settlement as { ptsOnEnrollmentByRole: Record<NodeType, number> })
  .ptsOnEnrollmentByRole;
const dailyByRole = (rewardTiers.settlement as { ptsPerQualifiedEpochByRole: Record<NodeType, number> })
  .ptsPerQualifiedEpochByRole;

export const ENROLL_PTS_BY_ROLE: Record<NodeType, number> = enrollByRole;
export const DAILY_PTS_BY_ROLE: Record<NodeType, number> = dailyByRole;

export function enrollPtsLabel(): string {
  return '500 Light · 700 Edge · 1,000 Super';
}

export function dailyPtsLabel(): string {
  return '100 Light · 250 Edge · 500 Super';
}
