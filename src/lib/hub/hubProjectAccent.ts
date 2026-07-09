import type { CSSProperties } from 'react';
import type { KxListingAccent } from '@/lib/ui/kxListingAccent';

export type HubProjectAccent = {
  projectId: string;
  accentId: KxListingAccent;
  hex: string;
  hexHover: string;
  hexLight?: string;
  muted: string;
  border: string;
  shadow: string;
  tiltShadow: string;
};

/** Official Kasparex Games publisher seed for author identicons until wallet addresses are linked. */
export const KASPAREX_GAMES_AUTHOR_SEED = 'kasparex:games';

const HUB_PROJECT_ACCENTS: Record<string, HubProjectAccent> = {
  'kasparex-dapps': {
    projectId: 'kasparex-dapps',
    accentId: 'dapps',
    hex: '#06b6d4',
    hexHover: '#0891b2',
    muted: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
    shadow: 'rgba(6, 182, 212, 0.35)',
    tiltShadow: '0 0 10px rgba(6, 182, 212, 0.35)',
  },
  'kasparex-protocols': {
    projectId: 'kasparex-protocols',
    accentId: 'protocols',
    hex: '#06b6d4',
    hexHover: '#0891b2',
    muted: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
    shadow: 'rgba(6, 182, 212, 0.35)',
    tiltShadow: '0 0 10px rgba(6, 182, 212, 0.35)',
  },
  'kasparex-records': {
    projectId: 'kasparex-records',
    accentId: 'records',
    hex: '#f43f5e',
    hexHover: '#e11d48',
    muted: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.25)',
    shadow: 'rgba(244, 63, 94, 0.35)',
    tiltShadow: '0 0 10px rgba(244, 63, 94, 0.35)',
  },
  'kasparex-tokens': {
    projectId: 'kasparex-tokens',
    accentId: 'tokens',
    hex: '#3b82f6',
    hexHover: '#2563eb',
    hexLight: '#93c5fd',
    muted: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
    shadow: 'rgba(59, 130, 246, 0.35)',
    tiltShadow: '0 0 10px rgba(59, 130, 246, 0.35)',
  },
  'kasparex-games': {
    projectId: 'kasparex-games',
    accentId: 'games',
    hex: '#10b981',
    hexHover: '#059669',
    hexLight: '#6ee7b7',
    muted: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    shadow: 'rgba(16, 185, 129, 0.35)',
    tiltShadow: '0 0 10px rgba(16, 185, 129, 0.35)',
  },
  'kasparex-vblog': {
    projectId: 'kasparex-vblog',
    accentId: 'vblog',
    hex: '#02abb8',
    hexHover: '#019aa6',
    hexLight: '#66dfe8',
    muted: 'rgba(2, 171, 184, 0.1)',
    border: 'rgba(2, 171, 184, 0.25)',
    shadow: 'rgba(2, 171, 184, 0.35)',
    tiltShadow: '0 0 10px rgba(2, 171, 184, 0.35)',
  },
  'kasparex-magazines': {
    projectId: 'kasparex-magazines',
    accentId: 'magazines',
    hex: '#8b5cf6',
    hexHover: '#7c3aed',
    muted: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.25)',
    shadow: 'rgba(139, 92, 246, 0.35)',
    tiltShadow: '0 0 10px rgba(139, 92, 246, 0.35)',
  },
  'krex-chronicles': {
    projectId: 'krex-chronicles',
    accentId: 'chronicles',
    hex: '#f59e0b',
    hexHover: '#d97706',
    muted: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    shadow: 'rgba(245, 158, 11, 0.35)',
    tiltShadow: '0 0 10px rgba(245, 158, 11, 0.35)',
  },
  'kasparex-movies': {
    projectId: 'kasparex-movies',
    accentId: 'movies',
    hex: '#ef4444',
    hexHover: '#dc2626',
    muted: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    shadow: 'rgba(239, 68, 68, 0.35)',
    tiltShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
  },
  'kasparex-defi': {
    projectId: 'kasparex-defi',
    accentId: 'defi',
    hex: '#d946ef',
    hexHover: '#c026d3',
    muted: 'rgba(217, 70, 239, 0.1)',
    border: 'rgba(217, 70, 239, 0.25)',
    shadow: 'rgba(217, 70, 239, 0.35)',
    tiltShadow: '0 0 10px rgba(217, 70, 239, 0.35)',
  },
  'kasparex-studio': {
    projectId: 'kasparex-studio',
    accentId: 'studio',
    hex: '#6366f1',
    hexHover: '#4f46e5',
    muted: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.25)',
    shadow: 'rgba(99, 102, 241, 0.35)',
    tiltShadow: '0 0 10px rgba(99, 102, 241, 0.35)',
  },
  'krex-nodes': {
    projectId: 'krex-nodes',
    accentId: 'nodes',
    hex: '#64748b',
    hexHover: '#475569',
    muted: 'rgba(100, 116, 139, 0.1)',
    border: 'rgba(100, 116, 139, 0.25)',
    shadow: 'rgba(100, 116, 139, 0.35)',
    tiltShadow: '0 0 10px rgba(100, 116, 139, 0.35)',
  },
  'kasparex-rewards': {
    projectId: 'kasparex-rewards',
    accentId: 'rewards',
    hex: '#14b8a6',
    hexHover: '#0d9488',
    muted: 'rgba(20, 184, 166, 0.1)',
    border: 'rgba(20, 184, 166, 0.25)',
    shadow: 'rgba(20, 184, 166, 0.35)',
    tiltShadow: '0 0 10px rgba(20, 184, 166, 0.35)',
  },
  'kasparex-stats': {
    projectId: 'kasparex-stats',
    accentId: 'stats',
    hex: '#0ea5e9',
    hexHover: '#0284c7',
    muted: 'rgba(14, 165, 233, 0.1)',
    border: 'rgba(14, 165, 233, 0.25)',
    shadow: 'rgba(14, 165, 233, 0.35)',
    tiltShadow: '0 0 10px rgba(14, 165, 233, 0.35)',
  },
  'kasparex-nft-tools': {
    projectId: 'kasparex-nft-tools',
    accentId: 'nftTools',
    hex: '#84cc16',
    hexHover: '#65a30d',
    muted: 'rgba(132, 204, 22, 0.1)',
    border: 'rgba(132, 204, 22, 0.25)',
    shadow: 'rgba(132, 204, 22, 0.35)',
    tiltShadow: '0 0 10px rgba(132, 204, 22, 0.35)',
  },
  'kasparex-store': {
    projectId: 'kasparex-store',
    accentId: 'store',
    hex: '#06b6d4',
    hexHover: '#0891b2',
    muted: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
    shadow: 'rgba(6, 182, 212, 0.35)',
    tiltShadow: '0 0 10px rgba(6, 182, 212, 0.35)',
  },
  'kasparex-donations': {
    projectId: 'kasparex-donations',
    accentId: 'crowdkas',
    hex: '#10b981',
    hexHover: '#059669',
    muted: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    shadow: 'rgba(16, 185, 129, 0.35)',
    tiltShadow: '0 0 10px rgba(16, 185, 129, 0.35)',
  },
  'kasparex-ads': {
    projectId: 'kasparex-ads',
    accentId: 'ads',
    hex: '#ec4899',
    hexHover: '#db2777',
    muted: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.25)',
    shadow: 'rgba(236, 72, 153, 0.35)',
    tiltShadow: '0 0 10px rgba(236, 72, 153, 0.35)',
  },
  'kasparex-ai': {
    projectId: 'kasparex-ai',
    accentId: 'ai',
    hex: '#a855f7',
    hexHover: '#9333ea',
    muted: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.25)',
    shadow: 'rgba(168, 85, 247, 0.35)',
    tiltShadow: '0 0 10px rgba(168, 85, 247, 0.35)',
  },
};

const DEFAULT_ACCENT = HUB_PROJECT_ACCENTS['kasparex-dapps'];

export function getHubProjectAccent(projectId: string): HubProjectAccent {
  return HUB_PROJECT_ACCENTS[projectId] ?? DEFAULT_ACCENT;
}

export function hubAccentCssVars(accent: HubProjectAccent): CSSProperties {
  return {
    '--hub-accent': accent.hex,
    '--hub-accent-hover': accent.hexHover,
    '--hub-accent-muted': accent.muted,
    '--hub-accent-border': accent.border,
    '--hub-accent-shadow': accent.shadow,
    '--hub-accent-light': accent.hexLight ?? accent.hex,
  } as CSSProperties;
}
