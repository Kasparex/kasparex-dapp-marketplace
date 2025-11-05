/**
 * Contract Addresses
 * 
 * These addresses are populated after deployment.
 * Update these with the deployed contract addresses from the deployments folder.
 */

export const CONTRACT_ADDRESSES = {
  // Kasplex L2 Mainnet (Chain ID: 202555)
  kasplexL2Mainnet: {
    Treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "",
    FeeCollector: process.env.NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS || "",
    DAppRegistry: process.env.NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS || "",
    SimplePayment: process.env.NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS || "",
    PlatformSubscription: process.env.NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS || "",
    DAppSubscription: process.env.NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS || "",
    SubscriptionManager: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS || "",
  },
  // Kasplex L2 Testnet (Chain ID: 167012)
  kasplexL2Testnet: {
    Treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET || "",
    FeeCollector: process.env.NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET || "",
    DAppRegistry: process.env.NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET || "",
    SimplePayment: process.env.NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET || "",
    PlatformSubscription: process.env.NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET || "",
    DAppSubscription: process.env.NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET || "",
    SubscriptionManager: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET || "",
  },
} as const;

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


