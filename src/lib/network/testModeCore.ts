/**
 * SSR-safe test mode helper. No React, no wagmi.
 * Use this wherever you only need isTestMode(chain) so server prerender never loads wagmi.
 */

export interface ChainWithTestnet {
  testnet?: boolean;
}

export function isTestMode(chain: ChainWithTestnet | null | undefined): boolean {
  return chain?.testnet ?? false;
}
