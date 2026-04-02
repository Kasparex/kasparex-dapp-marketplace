import type { ModuleConfig, ModuleId } from './types';

export const MODULES: Record<ModuleId, ModuleConfig> = {
  confirmed_reads: {
    id: 'confirmed_reads',
    label: 'Confirmed reads',
    weight: 1,
  },
  nft_slots: {
    id: 'nft_slots',
    label: 'NFT slots',
    weight: 1,
  },
} as const;

