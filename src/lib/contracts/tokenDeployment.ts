/**
 * Token Deployment Logic
 * Handles deployment of DAppToken contracts with standardized allocation
 */

import { DAPP_TOKEN_ABI, DAPP_REGISTRY_ABI } from './abis';

export interface TokenDeploymentConfig {
  name: string;
  symbol: string;
  maxSupply: string; // In tokens (will be converted to wei)
  rewardVault: string;
  liquidityReserve: string;
  treasury: string;
  devAddress: string;
  airdropAddress: string;
}

export interface TokenDeploymentResult {
  tokenAddress: string;
  transactionHash: string;
  dAppId?: number;
}

/**
 * Calculate token allocation amounts
 */
export function calculateTokenAllocation(maxSupplyWei: bigint) {
  const useToMint = (maxSupplyWei * BigInt(8000)) / BigInt(10000); // 80%
  const liquidity = (maxSupplyWei * BigInt(1000)) / BigInt(10000); // 10%
  const treasuryAmount = (maxSupplyWei * BigInt(500)) / BigInt(10000); // 5%
  const devAmount = (maxSupplyWei * BigInt(300)) / BigInt(10000); // 3%
  const airdropAmount = maxSupplyWei - useToMint - liquidity - treasuryAmount - devAmount; // 2%

  return {
    useToMint: useToMint.toString(),
    liquidity: liquidity.toString(),
    treasury: treasuryAmount.toString(),
    dev: devAmount.toString(),
    airdrops: airdropAmount.toString(),
  };
}

/**
 * Convert token amount to wei
 */
export function tokensToWei(amount: string): bigint {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error('Invalid token amount');
  }
  return BigInt(Math.floor(num * 1e18));
}

/**
 * Convert wei to tokens
 */
export function weiToTokens(amount: bigint): string {
  const num = Number(amount) / 1e18;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Validate token deployment config
 */
export function validateTokenConfig(config: TokenDeploymentConfig): { valid: boolean; error?: string } {
  if (!config.name || config.name.trim().length === 0) {
    return { valid: false, error: 'Token name is required' };
  }

  if (!config.symbol || config.symbol.trim().length === 0) {
    return { valid: false, error: 'Token symbol is required' };
  }

  if (config.symbol.length > 10) {
    return { valid: false, error: 'Token symbol must be 10 characters or less' };
  }

  const maxSupply = parseFloat(config.maxSupply);
  if (isNaN(maxSupply) || maxSupply <= 0) {
    return { valid: false, error: 'Invalid max supply' };
  }

  if (!config.rewardVault || !config.rewardVault.startsWith('0x')) {
    return { valid: false, error: 'Invalid reward vault address' };
  }

  if (!config.liquidityReserve || !config.liquidityReserve.startsWith('0x')) {
    return { valid: false, error: 'Invalid liquidity reserve address' };
  }

  if (!config.treasury || !config.treasury.startsWith('0x')) {
    return { valid: false, error: 'Invalid treasury address' };
  }

  if (!config.devAddress || !config.devAddress.startsWith('0x')) {
    return { valid: false, error: 'Invalid dev address' };
  }

  if (!config.airdropAddress || !config.airdropAddress.startsWith('0x')) {
    return { valid: false, error: 'Invalid airdrop address' };
  }

  return { valid: true };
}

