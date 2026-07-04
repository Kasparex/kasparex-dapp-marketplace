import type { ProgrammableNetworkId } from './config';

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
