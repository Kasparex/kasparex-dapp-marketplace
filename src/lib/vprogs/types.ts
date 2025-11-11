/**
 * vProgs Type Definitions
 * Types matching expected vProgs API structure
 */

export interface VProgsDApp {
  id: number;
  name: string;
  version: string;
  category: string;
  contractAddress: string;
  deployer: string;
  isActive: boolean;
  createdAt: number;
  tokenAddress?: string;
  ticker?: string;
  totalSupply?: string;
  ipfsCID?: string;
}

export interface VProgsToken {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  balance?: string;
}

export interface VProgsUsageEvent {
  user: string;
  dAppContract: string;
  dAppId: number;
  actionType: string;
  timestamp: number;
}

export interface VProgsContractCall {
  contract: string;
  function: string;
  args: unknown[];
  value?: string;
}

export interface VProgsTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  data: string;
  timestamp: number;
}

