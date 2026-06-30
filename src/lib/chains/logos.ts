import { CHAIN_IDS } from '@/lib/wagmi';

export const L2_CHAIN_LOGOS: Partial<Record<number, string>> = {
  [CHAIN_IDS.KASPLEX_L2_MAINNET]: '/img/logos/kasplex.png',
  [CHAIN_IDS.KASPLEX_L2_TESTNET]: '/img/logos/kasplex.png',
  [CHAIN_IDS.IGRA_GALLEON_TESTNET]: '/img/logos/igra.png',
  [CHAIN_IDS.IGRA_MAINNET]: '/img/logos/igra.png',
};

export function getL2ChainLogoSrc(chainId: number): string | undefined {
  return L2_CHAIN_LOGOS[chainId];
}

export function getL2ChainLogoByName(name: string): string | undefined {
  const normalized = name.toLowerCase();
  if (normalized.includes('kasplex')) return '/img/logos/kasplex.png';
  if (normalized.includes('igra')) return '/img/logos/igra.png';
  return undefined;
}
