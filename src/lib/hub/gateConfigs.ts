import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import type { HubWalletGateConfig } from '@/components/hub/HubWalletGateShell';
import type { Game } from '@/lib/games/games';

export function gameL1PlayGateConfig(game: Pick<Game, 'name'>): HubWalletGateConfig {
  return {
    title: 'Wallet required',
    name: game.name,
    message: `Connect your Kaspa wallet to play ${game.name}.`,
    requirement: { layer: 'L1' },
    networkBadge: { layer: 'L1', label: 'Kaspa' },
    autoPrompt: true,
  };
}

export const CROWDKAS_L2_STUDIO_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'CrowdKAS Studio',
  message: 'Connect your EVM wallet on Igra Mainnet to create and manage campaigns.',
  requirement: { layer: 'L2', chainIds: [CROWDKAS_CHAIN_ID] },
  networkBadge: { layer: 'L2', label: 'Igra Mainnet' },
  autoPrompt: true,
};

export const CROWDKAS_L2_DASHBOARD_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'CrowdKAS dashboard',
  message: 'Connect your EVM wallet on Igra Mainnet to see your creator campaigns.',
  requirement: { layer: 'L2', chainIds: [CROWDKAS_CHAIN_ID] },
  networkBadge: { layer: 'L2', label: 'Igra Mainnet' },
  autoPrompt: true,
};

export const CROWDKAS_L2_MODULES_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'CrowdKAS modules',
  message: 'Connect your EVM wallet on Igra Mainnet to unlock modules for your campaigns.',
  requirement: { layer: 'L2', chainIds: [CROWDKAS_CHAIN_ID] },
  networkBadge: { layer: 'L2', label: 'Igra Mainnet' },
  autoPrompt: true,
};

export const CROWDKAS_L1_COVENANT_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'CrowdKAS L1 covenant',
  message: 'Connect your Kaspa wallet to launch or manage L1 covenant campaigns.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: false,
};

export const STORE_L1_PURCHASE_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'Kasparex Store',
  message: 'Connect your Kaspa wallet to purchase this product.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: true,
};

export const MAGAZINE_L1_PURCHASE_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'Kasparex Magazines',
  message: 'Connect your Kaspa wallet to purchase this issue.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: false,
};
