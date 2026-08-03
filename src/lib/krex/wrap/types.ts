export type KrexWrapStatus =
  | 'draft'
  | 'fee_paid'
  | 'deposited'
  | 'pending_mint'
  | 'minted'
  | 'failed';

export type KrexWrapRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  wallet: string;
  /** KRC-20 tick wrapped (uppercase). Older records may omit; treat as KREX. */
  tick: string;
  /** Human amount of KRC-20 sent to the vault. */
  amount: number;
  /** @deprecated Prefer `amount`. Kept for older localStorage rows. */
  amountKrex?: number;
  feeKas: number;
  feeTxHash?: string;
  depositTxHash?: string;
  mintTxHash?: string;
  status: KrexWrapStatus;
  note?: string;
};

/** Per-tick KCC20 covenant (mint side) when live. */
export type Krc20WrapCovenantMap = Record<string, string>;

export type KrexWrapPublicConfig = {
  vaultAddress: string | null;
  treasuryAddress: string | null;
  /** Default / legacy KREX covenant (also present in `covenants` when set). */
  kcc20CovenantId: string | null;
  /** Uppercase tick → 64-hex covenant id. */
  covenants: Krc20WrapCovenantMap;
  /** Default tick preselected in the UI. */
  defaultTick: string;
  decimals: number;
  baseFeeKas: number;
  minWrapAmount: number;
  /** @deprecated Alias of minWrapAmount for older callers. */
  minWrapKrex: number;
  unwrapEnabled: boolean;
  /** True when the default tick has a covenant + vault. */
  mintLive: boolean;
  ready: boolean;
};
