/**
 * Genesis Dapp Type Definitions
 * Types for the Genesis Dapp vProgs implementation
 */

export interface GenesisMessage {
  id: number;
  message: string;
  author: string;
  timestamp: number;
}

export interface GenesisDappState {
  messageCount: number;
  messageFee: string; // in wei/smallest unit
  maxMessageLength: number;
}

export interface LeaveMessageParams {
  message: string;
  author: string;
  fee: string;
}

export interface GenesisDappConfig {
  dAppId: number;
  contractAddress: string;
  messageFee: string;
  maxMessageLength: number;
}
