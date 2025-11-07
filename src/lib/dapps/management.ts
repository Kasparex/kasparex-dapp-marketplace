'use client';

import { DApp } from '@/lib/dapps';
import { isDeployer } from '@/lib/dapps/deployer';

/**
 * Get all dApps created/listed by a specific deployer address
 * Note: This now also includes dApps where the user is assigned as developer via AuthorizationRegistry
 * Use getAssignedDApps() to get only assigned dApps
 */
export function getDAppsByDeployer(dapps: DApp[], deployerAddress: string): DApp[] {
  if (!deployerAddress) {
    return [];
  }

  return dapps.filter((dapp) => {
    // Check deployerAddress field
    if (dapp.deployerAddress && dapp.deployerAddress.toLowerCase() === deployerAddress.toLowerCase()) {
      return true;
    }
    
    // Check developer field if it's a wallet address
    if (dapp.developer && dapp.developer.startsWith('0x') && dapp.developer.toLowerCase() === deployerAddress.toLowerCase()) {
      return true;
    }
    
    return false;
  });
}

/**
 * Get dApps where user is assigned as developer (via AuthorizationRegistry)
 * This should be used in combination with getDAppsByDeployer for complete list
 */
export function getAssignedDApps(dapps: DApp[], assignedDAppIds: number[]): DApp[] {
  if (assignedDAppIds.length === 0) {
    return [];
  }

  return dapps.filter((dapp) => {
    const dAppId = parseInt(dapp.id, 10);
    return !isNaN(dAppId) && assignedDAppIds.includes(dAppId);
  });
}

/**
 * Check if a user can edit a specific dApp
 * This checks both deployer address and on-chain authorization
 * Note: For on-chain check, use useDAppAuthorization hook in components
 */
export function canEditDApp(userAddress: string | undefined, dapp: DApp, isAssignedDeveloper: boolean = false): boolean {
  if (!userAddress) {
    return false;
  }

  // Check if user is assigned developer via AuthorizationRegistry
  if (isAssignedDeveloper) {
    return true;
  }

  // Check if user is the deployer
  const deployerAddress = dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    '';

  return isDeployer(userAddress, deployerAddress);
}

/**
 * Validate dApp data before saving
 */
export function validateDAppData(dapp: Partial<DApp>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (dapp.name !== undefined && (!dapp.name || dapp.name.trim().length === 0)) {
    errors.push('Name is required');
  }

  if (dapp.name !== undefined && dapp.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (dapp.description !== undefined && dapp.description && dapp.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (dapp.utility !== undefined && (!dapp.utility || dapp.utility.trim().length === 0)) {
    errors.push('Utility is required');
  }

  if (dapp.process !== undefined && (!dapp.process || dapp.process.trim().length === 0)) {
    errors.push('Process is required');
  }

  if (dapp.developerLinks !== undefined && dapp.developerLinks.length > 3) {
    errors.push('Maximum 3 developer links allowed');
  }

  if (dapp.developerLinks !== undefined) {
    dapp.developerLinks.forEach((link, index) => {
      if (!link.label || link.label.trim().length === 0) {
        errors.push(`Developer link ${index + 1}: Label is required`);
      }
      if (!link.url || link.url.trim().length === 0) {
        errors.push(`Developer link ${index + 1}: URL is required`);
      }
      if (link.url && !isValidUrl(link.url)) {
        errors.push(`Developer link ${index + 1}: Invalid URL format`);
      }
    });
  }

  if (dapp.url !== undefined && dapp.url && !isValidUrl(dapp.url)) {
    errors.push('Invalid dApp URL format');
  }

  if (dapp.widgetUrl !== undefined && dapp.widgetUrl && !isValidUrl(dapp.widgetUrl)) {
    errors.push('Invalid widget URL format');
  }

  if (dapp.image !== undefined && dapp.image && !isValidUrl(dapp.image)) {
    errors.push('Invalid image URL format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update dApp metadata (frontend-only for now, contract updates handled separately)
 * This is a placeholder for future contract integration
 */
export function updateDAppMetadata(dappId: string, updates: Partial<DApp>): Promise<boolean> {
  // For now, this is a placeholder
  // In the future, this could:
  // 1. Save to localStorage for frontend-only updates
  // 2. Call contract methods for on-chain updates
  // 3. Save to a backend API
  
  return Promise.resolve(true);
}

