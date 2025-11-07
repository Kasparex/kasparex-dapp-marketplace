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

/**
 * Hardcoded fallback addresses from deployed contracts
 * These are used when environment variables are not set
 */
const HARDCODED_FALLBACK_ADDRESSES = {
  kasplexL2Mainnet: {
    Treasury: "0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40",
    FeeCollector: "0x3bA56061Db6350A78dD5BE76766370e0A3fe8E4a",
    DAppRegistry: "",
    SimplePayment: "",
    PlatformSubscription: "",
    DAppSubscription: "",
    SubscriptionManager: "",
    AuthorizationRegistry: "",
  },
  kasplexL2Testnet: {
    Treasury: "0x305B4ee627aD8b12bFCF6427453964771aA30622",
    FeeCollector: "0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2",
    DAppRegistry: "0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd",
    SimplePayment: "0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85",
    PlatformSubscription: "0xaC941a612b30Fe15F84a961a1FaCF2Ea5c2ef21E",
    DAppSubscription: "0x0530c962A17fB4602418087689e762e5989f1D43",
    SubscriptionManager: "0x0F405c342e9596621430C5f888D673d40111a0ac",
    AuthorizationRegistry: "0x90A9aa9eB4C91b9c7A6eb72248bDe6a9FB6f79ef",
  },
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
    AuthorizationRegistry: "",
  },
  kasplexL2Testnet: {
    Treasury: "",
    FeeCollector: "",
    DAppRegistry: "",
    SimplePayment: "",
    PlatformSubscription: "",
    DAppSubscription: "",
    SubscriptionManager: "",
    AuthorizationRegistry: "",
  },
};

export const CONTRACT_ADDRESSES = {
  // Kasplex L2 Mainnet (Chain ID: 202555)
  kasplexL2Mainnet: {
    Treasury: getEnvVar('NEXT_PUBLIC_TREASURY_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.Treasury || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.Treasury,
    FeeCollector: getEnvVar('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.FeeCollector || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.FeeCollector,
    DAppRegistry: getEnvVar('NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppRegistry,
    SimplePayment: getEnvVar('NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.SimplePayment,
    PlatformSubscription: getEnvVar('NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.PlatformSubscription,
    DAppSubscription: getEnvVar('NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppSubscription,
    SubscriptionManager: getEnvVar('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.SubscriptionManager,
    AuthorizationRegistry: getEnvVar('NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.AuthorizationRegistry,
  },
  // Kasplex L2 Testnet (Chain ID: 167012)
  kasplexL2Testnet: {
    Treasury: getEnvVar('NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.Treasury || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.Treasury,
    FeeCollector: getEnvVar('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.FeeCollector || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.FeeCollector,
    DAppRegistry: getEnvVar('NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.DAppRegistry,
    SimplePayment: getEnvVar('NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.SimplePayment,
    PlatformSubscription: getEnvVar('NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.PlatformSubscription,
    DAppSubscription: getEnvVar('NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.DAppSubscription,
    SubscriptionManager: getEnvVar('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.SubscriptionManager,
    AuthorizationRegistry: getEnvVar('NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.AuthorizationRegistry,
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


