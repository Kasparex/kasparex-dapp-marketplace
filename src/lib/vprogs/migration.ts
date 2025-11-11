/**
 * vProgs Migration Utilities
 * Tools for migrating dApps and tokens from EVM to vProgs
 */

import type { VProgsDApp, VProgsToken } from './types';

export interface MigrationExport {
  type: 'dapp' | 'token';
  id: string;
  data: VProgsDApp | VProgsToken;
  exportedAt: string;
}

/**
 * Export dApp data for vProgs migration
 */
export function exportDAppForVProgs(dApp: VProgsDApp): MigrationExport {
  return {
    type: 'dapp',
    id: dApp.id.toString(),
    data: dApp,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Export token data for vProgs migration
 */
export function exportTokenForVProgs(token: VProgsToken): MigrationExport {
  return {
    type: 'token',
    id: token.address,
    data: token,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import dApp data to vProgs
 */
export async function importDAppToVProgs(
  exportData: MigrationExport,
  vProgsAbstraction: any
): Promise<number> {
  if (exportData.type !== 'dapp') {
    throw new Error('Invalid export type');
  }

  const dApp = exportData.data as VProgsDApp;
  
  // Register dApp on vProgs
  const dAppId = await vProgsAbstraction.registerDApp(
    dApp.name,
    dApp.version,
    dApp.category,
    dApp.contractAddress
  );

  // Link token if exists
  if (dApp.tokenAddress) {
    // Link token (implementation depends on vProgs API)
  }

  return dAppId;
}

/**
 * Import token data to vProgs
 */
export async function importTokenToVProgs(
  exportData: MigrationExport,
  vProgsAbstraction: any
): Promise<string> {
  if (exportData.type !== 'token') {
    throw new Error('Invalid export type');
  }

  const token = exportData.data as VProgsToken;
  
  // Deploy token on vProgs
  const tokenAddress = await vProgsAbstraction.deployToken({
    name: token.name,
    symbol: token.symbol,
    maxSupply: token.totalSupply,
    // Other config...
  });

  return tokenAddress;
}

/**
 * Batch export multiple dApps
 */
export function batchExportDApps(dApps: VProgsDApp[]): MigrationExport[] {
  return dApps.map(exportDAppForVProgs);
}

/**
 * Batch export multiple tokens
 */
export function batchExportTokens(tokens: VProgsToken[]): MigrationExport[] {
  return tokens.map(exportTokenForVProgs);
}

