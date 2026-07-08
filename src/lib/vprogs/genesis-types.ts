/**
 * Kaspa Capsule message types (local Hub registry).
 */

export interface GenesisMessage {
  id: number;
  messageId: string;
  /** Plain text excerpt for search and previews. */
  message: string;
  contentHtml: string;
  author: string;
  timestamp: number;
  payloadBytes: number;
  chunkCount: number;
  feeKas: number;
  /** On-chain L1 payment transaction id. */
  txHash: string;
  /** @deprecated Legacy simulator reference. */
  txRef?: string;
  /** When set, message is hidden from Hub lists (on-chain data unchanged). */
  deletedAt?: number;
}

export interface GenesisDappState {
  messageCount: number;
  maxMessageLength: number;
}

export interface SaveMessageParams {
  contentHtml: string;
  author: string;
  feeKas: number;
  payloadBytes: number;
  chunkCount: number;
  txHash: string;
  messageId: string;
}

export interface GenesisDappConfig {
  dAppId: number;
  contractAddress: string;
  maxMessageLength: number;
}
