export type KrexWrapStatus =
  | 'draft'
  | 'fee_paid'
  | 'deposited'
  | 'pending_mint'
  /** v2: KRC-20 burned to keyless sink; waiting for attestor. */
  | 'burned'
  /** v2: burn attested; claim / mint in progress. */
  | 'awaiting_attest'
  | 'minted'
  | 'failed';

export type Krc20BridgeNetwork = 'mainnet' | 'testnet-10';

export type KrexWrapRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  wallet: string;
  /** KRC-20 tick migrated (uppercase). Older records may omit; treat as KREX. */
  tick: string;
  network?: Krc20BridgeNetwork;
  /** Human amount of KRC-20 sent to the vault / sink. */
  amount: number;
  /** @deprecated Prefer `amount`. Kept for older localStorage rows. */
  amountKrex?: number;
  feeKas: number;
  feeTxHash?: string;
  /** v1 vault deposit or v2 burn tx. */
  depositTxHash?: string;
  mintTxHash?: string;
  status: KrexWrapStatus;
  note?: string;
  /** v2 migrate path when set. */
  migrateVersion?: 1 | 2;
};

/** Per-tick KCC20 covenant (mint side) when live. */
export type Krc20WrapCovenantMap = Record<string, string>;

export type KrexWrapPublicConfig = {
  network: Krc20BridgeNetwork;
  vaultAddress: string | null;
  /** v2 keyless burn sink (unspendable P2SH). */
  sinkAddress: string | null;
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
  /** Keyless migrate UI (Burn → Attest → Claim). */
  migrateV2Enabled: boolean;
  /** True when the default tick has a covenant + (vault or sink). */
  mintLive: boolean;
  ready: boolean;
  /** True when a testnet vault/sink path is available. */
  testnetAvailable: boolean;
};
