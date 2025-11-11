/**
 * Contract Interaction Abstraction
 * Interface for contract operations that works with both EVM and vProgs
 */

export interface ContractOperation {
  registerDApp: (name: string, version: string, category: string, contractAddress: string) => Promise<number>;
  deployToken: (config: TokenDeploymentConfig) => Promise<string>;
  checkAccess: (user: string, dAppContract: string) => Promise<boolean>;
  distributeRewards: (user: string, dAppContract: string, actionValue: string) => Promise<boolean>;
}

export interface TokenDeploymentConfig {
  name: string;
  symbol: string;
  maxSupply: string;
  rewardVault: string;
  liquidityReserve: string;
  treasury: string;
  devAddress: string;
  airdropAddress: string;
}

export interface ContractAbstraction {
  registerDApp(name: string, version: string, category: string, contractAddress: string): Promise<number>;
  deployToken(config: TokenDeploymentConfig): Promise<string>;
  checkAccess(user: string, dAppContract: string): Promise<boolean>;
  distributeRewards(user: string, dAppContract: string, actionValue: string): Promise<boolean>;
  getNetworkType(): 'evm' | 'vprogs';
}

