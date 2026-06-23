/**
 * Shared Hub wallet gate system used across Kasparex sections.
 *
 * - useHubAccess / useHubWalletGate: generic L1/L2/either access checks
 * - useHubListingGate / HubGatedListingCard: gated listing cards (no navigation when blocked)
 * - HubWalletGateModal: L1 custom modal (KasWare/Kastle) + optional EVM button
 * - HubWalletGateShell: page/section wrapper with auto-prompt and overlay
 * - HubModuleListingCard: gated module listing cards
 *
 * dApps use useDAppAccess + useDAppWalletGate (thin wrappers over the same patterns).
 */

export { useHubAccess } from '@/hooks/useHubAccess';
export { useHubWalletGate } from '@/hooks/useHubWalletGate';
export { useHubListingGate } from '@/hooks/useHubListingGate';
export { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
export { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
export { HubGatedListingCard } from '@/components/hub/HubGatedListingCard';
export { HubWalletGateOverlay } from '@/components/hub/HubWalletGateOverlay';
export { HubNetworkBadge } from '@/components/hub/HubNetworkBadge';
export { HubModuleListingCard } from '@/components/hub/HubModuleListingCard';
export type { HubWalletGateConfig } from '@/components/hub/HubWalletGateShell';
export type { HubAccessRequirement, HubNetworkLayer } from '@/lib/hub/access';
export {
  CROWDKAS_L1_COVENANT_GATE,
  CROWDKAS_L2_DASHBOARD_GATE,
  CROWDKAS_L2_MODULES_GATE,
  CROWDKAS_L2_STUDIO_GATE,
  gameL1PlayGateConfig,
  hubModuleGateConfig,
  MAGAZINE_L1_PURCHASE_GATE,
  MAGAZINES_DASHBOARD_GATE,
  magazineIssueGateConfig,
  STORE_DASHBOARD_GATE,
  STORE_L1_PURCHASE_GATE,
  storeProductGateConfig,
  VBLOG_DASHBOARD_GATE,
} from '@/lib/hub/gateConfigs';
