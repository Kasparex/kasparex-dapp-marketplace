import type { ProgrammableNetworkId } from './config';

export type CovenantReadSource = 'kcc20Info' | 'kaspaCom' | 'kascov';

/** Normalized covenant read model used across kcc20.info, KaspaCom, and kascov. */
export type CovenantReadDetail = {
  source: CovenantReadSource;
  covenant_id: string;
  status?: string;
  live_value?: number;
  live_utxos?: number;
  event_count?: number;
  genesis_txid?: string | null;
  born_value?: number;
  template?: string;
  address?: string | null;
  decodedArgs?: Record<string, unknown> | null;
};

export type KaspaComCovenantSummary = {
  activeUtxos?: number;
  address?: string | null;
  covenantIdHex?: string | null;
  createdAtMs?: number | null;
  decodedArgs?: Record<string, unknown> | null;
  genesisTxidHex?: string | null;
  scriptHashHex?: string;
  template?: string | null;
  totalAmountSompi?: number | string | null;
  classificationKind?: string | null;
  classificationStatus?: string | null;
};

export type KaspaComActionRow = {
  action?: string | null;
  covenantIdHex?: string | null;
  txidHex?: string;
  decodedArgs?: Record<string, unknown> | null;
  template?: string | null;
  [key: string]: unknown;
};

export type KaspaComCovenantDetail = {
  covenant?: KaspaComCovenantSummary;
  actions?: KaspaComActionRow[];
  events?: Array<Record<string, unknown>>;
};

export type KascovCovenantStatus = 'active' | 'burned' | string;

export type KascovCovenantSummary = {
  covenant_id: string;
  status?: KascovCovenantStatus;
  live_value?: number;
  live_utxos?: number;
  event_count?: number;
  genesis_txid?: string | null;
  genesis_daa?: number | null;
  born_value?: number;
  template?: string;
  generated_at_ms?: number;
};

export type KascovCovenantDetail = KascovCovenantSummary & {
  events?: Array<{
    kind?: string;
    txid?: string;
    seq?: number;
    accepting_daa?: number;
  }>;
  utxos?: Array<{
    value?: number;
    live?: boolean;
    script_hex?: string;
    template?: string;
    state_fields?: Record<string, unknown>;
  }>;
  lineage_complete?: boolean;
};

export type KascovTxCovenantLookup = {
  covenant_id?: string;
};
