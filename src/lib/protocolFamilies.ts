export type ProtocolFamilySlug = 'kpx' | 'ktree' | 'kref';

export type ProtocolFamilyStatus = 'live' | 'preview' | 'planned';

export interface ProtocolFamily {
  slug: ProtocolFamilySlug;
  /** Large letters in the featured strip (e.g. KPX). */
  shortLabel: string;
  /** Full marketing name. */
  name: string;
  description: string;
  status: ProtocolFamilyStatus;
}

export const PROTOCOL_FAMILIES: ProtocolFamily[] = [
  {
    slug: 'kpx',
    shortLabel: 'KPX',
    name: 'KPX protocol',
    description: 'Kaspa-wide payloads for identity, verification, EVM links, and content commits - indexed by Kasparex.',
    status: 'live',
  },
  {
    slug: 'ktree',
    shortLabel: 'KTREE',
    name: 'Ktree protocol',
    description: 'Structured on-chain trees for nested relationships, permissions, and composable namespaces (preview).',
    status: 'preview',
  },
  {
    slug: 'kref',
    shortLabel: 'KREF',
    name: 'Kref protocol',
    description: 'Lightweight references and resolution rules linking Kaspa state to off-chain and cross-chain assets (planned).',
    status: 'planned',
  },
];

export function getProtocolFamily(slug: string): ProtocolFamily | undefined {
  return PROTOCOL_FAMILIES.find((f) => f.slug === slug);
}

export function isProtocolFamilySlug(s: string): s is ProtocolFamilySlug {
  return PROTOCOL_FAMILIES.some((f) => f.slug === s);
}
