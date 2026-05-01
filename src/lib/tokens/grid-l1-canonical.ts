/**
 * Canonical GRID (KRC-20) on Kaspa L1 mainnet - facts for UI / config.
 * Full deployment record: docs/GRID_L1_MAINNET_KRC20_DEPLOYMENT.md
 * Bridged L2: docs/GRID_L2_BRIDGED_KATBRIDGE_DEPLOYMENT.md · `grid-l2-bridged.ts`
 */
export const GRID_L1_MAINNET = {
  network: 'kaspa-mainnet',
  tickerDisplay: 'GRID',
  /** KRC-20 deploy `tick` field (lowercase). */
  tickerKrc20: 'grid',
  decimals: 8,
  maxSupplyHuman: 10_000_000_000,
  premintHuman: 10_000_000_000,
  deployerKaspa: 'kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp',
  deployerEvmRef: '0xEaCE479d80d2DC1e8704aaf96F3cA17937269c3B',
  commitTxId: '3d6a1dd78928576f29080eb4bb6059613f550cac473853f0cd86fe7d97af26cd',
  revealTxId: '11a5d15b0ad12e89303efa625e0b9a134c7a1328ddfdbed26c01069d99c07135',
  inscriptionHash: '1c3185ba3130db02648d2fef88e6f6a3e1959b51f9dcee56194e173aa32e2a7f',
  explorerCommitUrl:
    'https://explorer.kaspa.org/transactions/3d6a1dd78928576f29080eb4bb6059613f550cac473853f0cd86fe7d97af26cd',
  explorerRevealUrl:
    'https://explorer.kaspa.org/transactions/11a5d15b0ad12e89303efa625e0b9a134c7a1328ddfdbed26c01069d99c07135',
} as const;
