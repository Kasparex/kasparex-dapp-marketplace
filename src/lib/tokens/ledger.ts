import { GRID_L1_MAINNET } from './grid-l1-canonical';
import { GRID_L2_IGRA_MAINNET, GRID_L2_KASPLEX_MAINNET } from './grid-l2-bridged';

export type TokenLedgerId = 'grid';

export interface TokenLedgerLine {
  label: string;
  amount: number;
  unit: string;
  note?: string;
}

export interface TokenLedgerSnapshot {
  id: TokenLedgerId;
  symbol: string;
  maxSupply: number;
  decimals: number;
  asOf: string; // ISO date string
  lines: TokenLedgerLine[];
}

/**
 * Off-chain ledger used for external clarity.
 * Source-of-truth is internal accounting; values may not be provable on-chain.
 */
export const TOKEN_LEDGER: Record<TokenLedgerId, TokenLedgerSnapshot> = {
  grid: {
    id: 'grid',
    symbol: 'GRID',
    maxSupply: GRID_L1_MAINNET.maxSupplyHuman,
    decimals: GRID_L1_MAINNET.decimals,
    asOf: new Date().toISOString(),
    lines: [
      {
        label: 'L1 Treasury',
        amount: 9_900_000_000,
        unit: 'GRID',
        note: 'Kaspa L1 (canonical supply custody)',
      },
      {
        label: `Distributed on ${GRID_L2_KASPLEX_MAINNET.name}`,
        amount: 50_000_000,
        unit: 'GRID',
        note: `L2 operational layer (chainId ${GRID_L2_KASPLEX_MAINNET.chainId})`,
      },
      {
        label: `Distributed on ${GRID_L2_IGRA_MAINNET.name}`,
        amount: 50_000_000,
        unit: 'GRID',
        note: `L2 operational layer (chainId ${GRID_L2_IGRA_MAINNET.chainId})`,
      },
    ],
  },
} as const;

export function getTokenLedger(id: TokenLedgerId): TokenLedgerSnapshot {
  return TOKEN_LEDGER[id];
}

export function sumLedger(lines: TokenLedgerLine[]): number {
  return lines.reduce((acc, l) => acc + (Number.isFinite(l.amount) ? l.amount : 0), 0);
}

export function getLedgerCirculatingSupply(snapshot: TokenLedgerSnapshot): number {
  const totalAccounted = sumLedger(snapshot.lines);
  return Math.max(0, snapshot.maxSupply - totalAccounted);
}

