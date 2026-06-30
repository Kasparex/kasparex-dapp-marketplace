/** L2 chain logos keyed by chain id (avoids importing wagmi.ts and circular init). */
export const L2_CHAIN_LOGOS: Partial<Record<number, string>> = {
  202555: '/img/logos/kasplex.png',
  167012: '/img/logos/kasplex.png',
  38836: '/img/logos/igra.png',
  38833: '/img/logos/igra.png',
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
