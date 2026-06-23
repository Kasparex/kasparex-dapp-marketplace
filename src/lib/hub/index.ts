/**
 * Shared Hub wallet gate system used across Kasparex sections.
 *
 * - useHubAccess / useHubWalletGate: generic L1/L2/either access checks
 * - HubWalletGateModal: L1 custom modal (KasWare/Kastle) + optional EVM button
 * - HubWalletGateShell: page/section wrapper with auto-prompt and overlay
 * - HubModuleListingCard: gated module listing cards
 *
 * dApps use useDAppAccess + useDAppWalletGate (thin wrappers over the same patterns).
 */

export { useHubAccess } from '@/hooks/useHubAccess';
export { useHubWalletGate } from '@/hooks/useHubWalletGate';
export { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
export { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
export { HubNetworkBadge } from '@/components/hub/HubNetworkBadge';
export { HubModuleListingCard } from '@/components/hub/HubModuleListingCard';
export type { HubWalletGateConfig } from '@/components/hub/HubWalletGateShell';
export type { HubAccessRequirement, HubNetworkLayer } from '@/lib/hub/access';
export {
  CROWDKAS_L1_COVENANT_GATE,
  CROWDKAS_L2_DASHBOARD_GATE,
  CROWDKAS_L2_MODULES_GATE,
  CROWDKAS_L2_STUDIO_GATE,
  MAGAZINE_L1_PURCHASE_GATE,
  STORE_L1_PURCHASE_GATE,
} from '@/lib/hub/gateConfigs';
