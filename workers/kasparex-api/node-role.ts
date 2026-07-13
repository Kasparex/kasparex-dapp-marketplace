/**
 * Krex node role slugs, URL policy, and reward lookups.
 */

import type { Env } from '../index';
import tiers from '../config/node-reward-tiers.json';

export const KREX_NODE_ROLES = ['light', 'edge', 'super'] as const;
export type KrexNodeRole = (typeof KREX_NODE_ROLES)[number];

type TierConfig = typeof tiers;

export function normalizeNodeRole(role: string | undefined | null): KrexNodeRole {
  const r = (role ?? '').trim().toLowerCase();
  if (r === 'mirror') return 'edge';
  if (r === 'light' || r === 'edge' || r === 'super') return r;
  return 'light';
}

export function parseNodeRole(input: string | undefined | null): KrexNodeRole | null {
  if (!input?.trim()) return null;
  const r = input.trim().toLowerCase();
  if (r === 'mirror') return 'edge';
  if ((KREX_NODE_ROLES as readonly string[]).includes(r)) return r as KrexNodeRole;
  return null;
}

export function roleRequiresPublicHttps(role: KrexNodeRole): boolean {
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

export function validateNodeUrlForRole(role: KrexNodeRole, url: string | undefined | null): string | null {
  const trimmed = url?.trim() ?? '';
  if (roleRequiresPublicHttps(role)) {
    if (!isPublicHttpsUrl(trimmed)) {
      return 'Edge and Super nodes require a public HTTPS URL (https://your-host). Run locally to test, then enroll with your tunnel or VPS URL.';
    }
    return null;
  }
  return null;
}

export function enrollmentPtsForRole(role: KrexNodeRole, cfg: TierConfig = tiers): number {
  const byRole = (cfg.settlement as { ptsOnEnrollmentByRole?: Record<string, number> }).ptsOnEnrollmentByRole;
  if (byRole) {
    return Math.max(0, Math.floor(Number(byRole[role] ?? 0)));
  }
  return Math.max(0, Math.floor(Number((cfg.settlement as { ptsOnEnrollment?: number }).ptsOnEnrollment ?? 0)));
}

export function dailyPtsForRole(role: KrexNodeRole, cfg: TierConfig = tiers): number {
  const byRole = (cfg.settlement as { ptsPerQualifiedEpochByRole?: Record<string, number> }).ptsPerQualifiedEpochByRole;
  if (byRole) {
    return Math.max(0, Math.floor(Number(byRole[role] ?? 0)));
  }
  return Math.max(0, Math.floor(Number((cfg.settlement as { ptsPerQualifiedEpoch?: number }).ptsPerQualifiedEpoch ?? 0)));
}

/** One-time D1 migration: legacy mirror slug → edge. */
export async function migrateLegacyMirrorRoles(env: Env): Promise<void> {
  await env.NODES_DB.prepare(`UPDATE nodes SET role = 'edge' WHERE role = 'mirror'`).run();
}
