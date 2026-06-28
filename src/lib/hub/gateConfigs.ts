import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import type { HubWalletGateConfig } from '@/components/hub/HubWalletGateShell';
import type { Game } from '@/lib/games/games';
import type { HubNetworkLayer } from '@/lib/hub/access';
import { hubModuleNetworkBadge } from '@/lib/hub/moduleGate';

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
  autoPrompt: false,
};

export const MAGAZINE_L1_PURCHASE_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'Kasparex Magazines',
  message: 'Connect your Kaspa wallet to purchase this issue.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: false,
};

export const VBLOG_DASHBOARD_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'vBlog dashboard',
  message: 'Connect a Kaspa L1 or EVM wallet to access your author dashboard.',
  requirement: { layer: 'either' },
  networkBadge: { layer: 'either', label: 'Kaspa or EVM' },
  autoPrompt: true,
};

export const MAGAZINES_DASHBOARD_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'Magazines dashboard',
  message: 'Connect your Kaspa wallet to view purchases, manage publications, and track revenue.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: true,
};

export const STORE_DASHBOARD_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'Store dashboard',
  message: 'Connect your Kaspa wallet to manage listings, sales, and purchases.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: false,
};

export const DAPPS_DASHBOARD_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'dApps dashboard',
  message: 'Connect your Kaspa wallet to manage directory listings and submit promotional dApps.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: false,
};

export const CHRONICLES_CENTER_GATE: HubWalletGateConfig = {
  title: 'Wallet required',
  name: 'Chronicles Center',
  message: 'Connect your Kaspa wallet to submit and manage community lore.',
  requirement: { layer: 'L1' },
  networkBadge: { layer: 'L1', label: 'Kaspa' },
  autoPrompt: false,
};

export function storeProductGateConfig(product: Pick<{ title: string }, 'title'>): HubWalletGateConfig {
  return {
    title: 'Wallet required',
    name: product.title,
    message: 'Connect your Kaspa wallet to view and purchase this product.',
    requirement: { layer: 'L1' },
    networkBadge: { layer: 'L1', label: 'Kaspa' },
    autoPrompt: false,
  };
}

export function magazineIssueGateConfig(issue: Pick<{ title: string }, 'title'>): HubWalletGateConfig {
  return {
    title: 'Wallet required',
    name: issue.title,
    message: 'Connect your Kaspa wallet to purchase this issue.',
    requirement: { layer: 'L1' },
    networkBadge: { layer: 'L1', label: 'Kaspa' },
    autoPrompt: false,
  };
}

export function hubModuleGateConfig(
  title: string,
  requiredNetwork: HubNetworkLayer
): HubWalletGateConfig {
  return {
    title: 'Wallet required',
    name: title,
    message: `Connect your ${requiredNetwork === 'L2' ? 'EVM' : 'Kaspa'} wallet to unlock this module.`,
    requirement: {
      layer: requiredNetwork,
      chainIds: requiredNetwork === 'L2' ? [] : undefined,
    },
    networkBadge: hubModuleNetworkBadge(requiredNetwork),
    autoPrompt: false,
  };
}
