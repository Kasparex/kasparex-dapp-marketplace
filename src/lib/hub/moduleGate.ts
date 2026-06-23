import type { HubNetworkBadgeConfig, HubNetworkLayer } from '@/lib/hub/access';

export function hubModuleNetworkBadge(layer: HubNetworkLayer): HubNetworkBadgeConfig {
  if (layer === 'L2') {
    return { layer: 'L2', label: 'Kasplex L2' };
  }
  if (layer === 'either') {
    return { layer: 'either', label: 'Kaspa or EVM' };
  }
  return { layer: 'L1', label: 'Kaspa' };
}
