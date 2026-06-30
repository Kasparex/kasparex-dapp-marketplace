import type { CovenantRuntimeMode } from '@/lib/covenant/types';

export type CovenantRuntimeBadge = {
  label: string;
  tone: 'simulator' | 'l1' | 'hybrid';
  description: string;
};

export function covenantRuntimeBadge(mode: CovenantRuntimeMode): CovenantRuntimeBadge {
  switch (mode) {
    case 'silverscript':
      return {
        label: 'L1 Covenant',
        tone: 'l1',
        description: 'Real Kaspa covenant transactions on mainnet.',
      };
    case 'hybrid':
      return {
        label: 'Hybrid',
        tone: 'hybrid',
        description: 'Uses L1 covenants when your wallet supports them; otherwise local simulator.',
      };
    case 'simulator':
    default:
      return {
        label: 'Simulator',
        tone: 'simulator',
        description: 'Local prototype on your device until covenant wallet APIs are available.',
      };
  }
}
