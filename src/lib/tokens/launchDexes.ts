/**
 * External L1 launchpad / DEX options for KCC-20 (and future Hub token connects).
 * Hub lists and utilities only; deploys happen on the selected launchpad.
 */

import {
  kronLaunchExploreUrl,
  kronLaunchNewUrl,
} from '@/lib/programmable/kron';

export type TokenLaunchDexId = 'kron' | 'kaspacom' | 'zealous';

export type TokenLaunchDexOption = {
  id: TokenLaunchDexId;
  label: string;
  /** Short line under the switcher. */
  blurb: string;
  active: boolean;
  launchUrl?: string;
  exploreUrl?: string;
  launchLabel?: string;
  exploreLabel?: string;
};

export const TOKEN_LAUNCH_DEX_OPTIONS: TokenLaunchDexOption[] = [
  {
    id: 'kron',
    label: 'KRON',
    blurb: 'Bonding-curve launches and L1 pools on Kaspa.',
    active: true,
    launchUrl: kronLaunchNewUrl(),
    exploreUrl: kronLaunchExploreUrl(),
    launchLabel: 'Launch on KRON',
    exploreLabel: 'Browse KRON launches',
  },
  {
    id: 'kaspacom',
    label: 'KaspaCom',
    blurb: 'KaspaCom L1 DEX and launch flow (coming soon).',
    active: false,
  },
  {
    id: 'zealous',
    label: 'Zealous',
    blurb: 'Zealous Swap L1 DEX and launch flow (coming soon).',
    active: false,
  },
];

export function getTokenLaunchDex(id: TokenLaunchDexId): TokenLaunchDexOption {
  return TOKEN_LAUNCH_DEX_OPTIONS.find((d) => d.id === id) ?? TOKEN_LAUNCH_DEX_OPTIONS[0];
}
