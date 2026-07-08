/**
 * Payment Configuration System
 * 
 * Centralized configuration for dApp payment amounts per network type (L1/L2)
 */

import { DApp } from '@/lib/dapps';

export interface PaymentAction {
  actionId: string;
  actionName: string;
  baseCost: number; // in KAS
  costL1?: number; // Optional L1-specific override
  costL2?: number; // Optional L2-specific override
  nextStep?: string;
  /** When true, cost is user-entered (e.g. Simple Payment); show generic step, no fixed cost/reward */
  variableAmount?: boolean;
}

export interface PaymentConfig {
  dappId: string;
  networkType: 'L1' | 'L2';
  actions: PaymentAction[];
}

/**
 * Default payment configurations for common dApp actions
 * These can be overridden per dApp if needed
 */
const DEFAULT_PAYMENT_CONFIGS: Record<string, PaymentConfig> = {
  // Payment dApps
  'simple-payment': {
    dappId: 'simple-payment',
    networkType: 'L2',
    actions: [
      {
        actionId: 'send-payment',
        actionName: 'Send Payment',
        baseCost: 1.0,
        costL1: 1.0,
        costL2: 1.0,
        nextStep: 'Payment processed',
        variableAmount: true,
      },
    ],
  },
  'send-kas': {
    dappId: 'send-kas',
    networkType: 'L1',
    actions: [
      {
        actionId: 'send-kas',
        actionName: 'Send KAS',
        baseCost: 1.0,
        costL1: 1.0,
        variableAmount: true,
      },
    ],
  },
  'send-krex': {
    dappId: 'send-krex',
    networkType: 'L1',
    actions: [
      {
        actionId: 'send-krex',
        actionName: 'Send KREX',
        baseCost: 1.0,
        costL1: 1.0,
        variableAmount: true,
      },
    ],
  },
  'kaspa-capsule': {
    dappId: 'kaspa-capsule',
    networkType: 'L1',
    actions: [
      {
        actionId: 'leave-message',
        actionName: 'Leave message',
        baseCost: 10.0,
        costL1: 10.0,
        nextStep: 'Message stored on-chain',
      },
    ],
  },
  // Kasparex vDonations (L2 escrow donations)
  'vdonations': {
    dappId: 'vdonations',
    networkType: 'L2',
    actions: [
      {
        actionId: 'donation',
        actionName: 'Donate',
        baseCost: 100,
        costL2: 100,
        nextStep: 'Donation recorded',
        variableAmount: true,
      },
    ],
  },
  // DAO Voting
  'dao-voting': {
    dappId: 'dao-voting',
    networkType: 'L2',
    actions: [
      {
        actionId: 'submit-proposal',
        actionName: 'Submit Proposal',
        baseCost: 10.0,
        costL2: 10.0,
        nextStep: 'Wait for voting period',
      },
      {
        actionId: 'cast-vote',
        actionName: 'Cast Vote',
        baseCost: 1.0,
        costL2: 1.0,
        nextStep: 'View results',
      },
    ],
  },
  // Subscription dApps
  'subscription': {
    dappId: 'subscription',
    networkType: 'L2',
    actions: [
      {
        actionId: 'subscribe',
        actionName: 'Subscribe',
        baseCost: 5.0,
        costL2: 5.0,
        nextStep: 'Access content',
      },
      {
        actionId: 'renew-subscription',
        actionName: 'Renew Subscription',
        baseCost: 5.0,
        costL2: 5.0,
        nextStep: 'Continue access',
      },
    ],
  },
};

/**
 * Get payment configuration for a dApp
 * Returns default config if available, otherwise returns null
 */
export function getDAppPaymentConfig(
  dapp: DApp,
  networkType: 'L1' | 'L2'
): PaymentConfig | null {
  // Try to find config by slug first
  const slug = dapp.slug || dapp.id.toLowerCase().replace(/\s+/g, '-');
  const configBySlug = DEFAULT_PAYMENT_CONFIGS[slug];
  
  if (configBySlug && configBySlug.networkType === networkType) {
    return configBySlug;
  }
  
  // Try to find config by ID
  const configById = DEFAULT_PAYMENT_CONFIGS[dapp.id];
  if (configById && configById.networkType === networkType) {
    return configById;
  }
  
  // Try to find by category/name patterns
  const nameLower = dapp.name.toLowerCase();
  const categoryLower = dapp.category.toLowerCase();
  
  if (categoryLower === 'payment' || nameLower.includes('payment')) {
    return DEFAULT_PAYMENT_CONFIGS['simple-payment'];
  }
  
  if (nameLower.includes('dao') || nameLower.includes('voting')) {
    return DEFAULT_PAYMENT_CONFIGS['dao-voting'];
  }
  
  if (categoryLower === 'subscription' || nameLower.includes('subscription')) {
    return DEFAULT_PAYMENT_CONFIGS['subscription'];
  }
  
  if (nameLower.includes('send kas') || slug === 'send-kas') {
    return DEFAULT_PAYMENT_CONFIGS['send-kas'];
  }
  
  if (nameLower.includes('send krex') || slug === 'send-krex') {
    return DEFAULT_PAYMENT_CONFIGS['send-krex'];
  }
  
  if (nameLower.includes('vdonation') || slug === 'vdonations') {
    return DEFAULT_PAYMENT_CONFIGS['vdonations'];
  }
  
  // Return default action if no specific config found
  return {
    dappId: dapp.id,
    networkType,
    actions: [
      {
        actionId: 'use-dapp',
        actionName: 'Use dApp',
        baseCost: 1.0,
        costL1: 1.0,
        costL2: 1.0,
        nextStep: 'Complete action',
      },
    ],
  };
}

/**
 * Get cost for a specific action on a specific network
 */
export function getActionCost(
  dapp: DApp,
  actionId: string,
  networkType: 'L1' | 'L2'
): number {
  const config = getDAppPaymentConfig(dapp, networkType);
  if (!config) {
    return 1.0; // Default cost
  }
  
  const action = config.actions.find(a => a.actionId === actionId);
  if (!action) {
    return config.actions[0]?.baseCost || 1.0; // Return first action cost or default
  }
  
  // Return network-specific cost if available, otherwise base cost
  if (networkType === 'L1' && action.costL1 !== undefined) {
    return action.costL1;
  }
  if (networkType === 'L2' && action.costL2 !== undefined) {
    return action.costL2;
  }
  
  return action.baseCost;
}
