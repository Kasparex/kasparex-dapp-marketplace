/**
 * Contract Addresses
 * 
 * These addresses are populated after deployment.
 * Update these with the deployed contract addresses from the deployments folder.
 */

// Helper to safely get env var (handles both server and client side)
const getEnvVar = (key: string): string => {
  if (typeof window === 'undefined') {
    // Server side
    return process.env[key] || '';
  }
  // Client side - Next.js exposes env vars via window
  return process.env[key] || '';
};

const DEFAULT_CONTRACT_ADDRESSES = {
  kasplexL2Mainnet: {
    Treasury: "",
    FeeCollector: "",
    DAppRegistry: "",
    SimplePayment: "",
    PlatformSubscription: "",
    DAppSubscription: "",
    SubscriptionManager: "",
  },
  kasplexL2Testnet: {
    Treasury: "",
    FeeCollector: "",
    DAppRegistry: "",
    SimplePayment: "",
    PlatformSubscription: "",
    DAppSubscription: "",
    SubscriptionManager: "",
  },
};

export const CONTRACT_ADDRESSES = {
  // Kasplex L2 Mainnet (Chain ID: 202555)
  kasplexL2Mainnet: {
    Treasury: getEnvVar('NEXT_PUBLIC_TREASURY_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.Treasury,
    FeeCollector: getEnvVar('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.FeeCollector,
    DAppRegistry: getEnvVar('NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppRegistry,
    SimplePayment: getEnvVar('NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.SimplePayment,
    PlatformSubscription: getEnvVar('NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.PlatformSubscription,
    DAppSubscription: getEnvVar('NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppSubscription,
    SubscriptionManager: getEnvVar('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.SubscriptionManager,
  },
  // Kasplex L2 Testnet (Chain ID: 167012)
  kasplexL2Testnet: {
    Treasury: getEnvVar('NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.Treasury,
    FeeCollector: getEnvVar('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.FeeCollector,
    DAppRegistry: getEnvVar('NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.DAppRegistry,
    SimplePayment: getEnvVar('NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.SimplePayment,
    PlatformSubscription: getEnvVar('NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.PlatformSubscription,
    DAppSubscription: getEnvVar('NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.DAppSubscription,
    SubscriptionManager: getEnvVar('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.SubscriptionManager,
  },
};

/**
 * Get contract address for a specific chain
 * @param chainId Chain ID
 * @param contractName Name of the contract
 * @returns Contract address or empty string if not found
 */
export const getContractAddress = (
  chainId: number,
  contractName: keyof typeof CONTRACT_ADDRESSES.kasplexL2Mainnet
): string => {
  if (chainId === 202555) {
    return CONTRACT_ADDRESSES.kasplexL2Mainnet[contractName] || "";
  } else if (chainId === 167012) {
    return CONTRACT_ADDRESSES.kasplexL2Testnet[contractName] || "";
  }
  return "";
};


