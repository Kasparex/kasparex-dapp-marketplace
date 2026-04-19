/**
 * Bridged GRID (ERC-20) on Kasplex + Igra mainnets via Katbridge.
 * Full record: docs/GRID_L2_BRIDGED_KATBRIDGE_DEPLOYMENT.md
 * Onboarding: https://onboard.katbridge.com/
 */
export const GRID_L2_KASPLEX_MAINNET = {
  chainId: 202555,
  name: 'Kasplex',
  tokenAddress: '0x9396eDf77EcA8087DDE39121e7A15ABfB8784570',
  deployTxHash: '0x05ac0186cc5c2c0a4486cd4150e264c673a5f6f796f84c1a2995d72c0276c1a6',
  submissionId: 'TKN-1776607643669-3Z6TK36RC',
  ticker: 'GRID',
  decimals: 8,
  maxSupplyHuman: 10_000_000_000,
} as const;

export const GRID_L2_IGRA_MAINNET = {
  chainId: 38833,
  name: 'Igra',
  tokenAddress: '0x05E02a8b14CD7974c6102CDB855F2dCd8E1f4902',
  deployTxHash: '0x0fafad59d80009e8971652b69e23a228a2cf3a8d8040f544b6464bc70803ccb4',
  submissionId: 'TKN-1776607889641-5Z0F18W9N',
  ticker: 'GRID',
  decimals: 8,
  maxSupplyHuman: 10_000_000_000,
} as const;

export const GRID_L2_DEPLOYER_KASPA =
  'kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp' as const;
