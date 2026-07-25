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

/** Official Kasparex Games publisher seed (legacy). Prefer getKasparexGamesAuthorWallet(). */
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
    hexLight: '#84cc16',
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
    hex: '#22c55e',
    hexHover: '#16a34a',
    hexLight: '#818cf8',
    muted: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.25)',
    shadow: 'rgba(34, 197, 94, 0.35)',
    tiltShadow: '0 0 10px rgba(34, 197, 94, 0.35)',
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
    hex: '#0d9488',
    hexHover: '#0f766e',
    hexLight: '#22d3ee',
    muted: 'rgba(13, 148, 136, 0.1)',
    border: 'rgba(13, 148, 136, 0.25)',
    shadow: 'rgba(13, 148, 136, 0.35)',
    tiltShadow: '0 0 10px rgba(13, 148, 136, 0.35)',
  },
  'kasparex-magazines': {
    projectId: 'kasparex-magazines',
    accentId: 'magazines',
    hex: '#eab308',
    hexHover: '#ca8a04',
    hexLight: '#fb923c',
    muted: 'rgba(234, 179, 8, 0.1)',
    border: 'rgba(234, 179, 8, 0.25)',
    shadow: 'rgba(234, 179, 8, 0.35)',
    tiltShadow: '0 0 10px rgba(234, 179, 8, 0.35)',
  },
  'krex-chronicles': {
    projectId: 'krex-chronicles',
    accentId: 'chronicles',
    hex: '#38bdf8',
    hexHover: '#0ea5e9',
    hexLight: '#22d3ee',
    muted: 'rgba(56, 189, 248, 0.1)',
    border: 'rgba(56, 189, 248, 0.25)',
    shadow: 'rgba(56, 189, 248, 0.35)',
    tiltShadow: '0 0 10px rgba(56, 189, 248, 0.35)',
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
    hex: '#06b6d4',
    hexHover: '#0891b2',
    hexLight: '#5eead4',
    muted: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
    shadow: 'rgba(6, 182, 212, 0.35)',
    tiltShadow: '0 0 10px rgba(6, 182, 212, 0.35)',
  },
  'kasparex-ai': {
    projectId: 'kasparex-ai',
    accentId: 'ai',
    hex: '#c084fc',
    hexHover: '#a855f7',
    hexLight: '#22d3ee',
    muted: 'rgba(192, 132, 252, 0.1)',
    border: 'rgba(192, 132, 252, 0.25)',
    shadow: 'rgba(192, 132, 252, 0.35)',
    tiltShadow: '0 0 10px rgba(192, 132, 252, 0.35)',
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
