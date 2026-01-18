/**
 * Contract Addresses
 * 
 * These addresses are populated after deployment.
 * Update these with the deployed contract addresses from the deployments folder.
 */

// Helper to safely get env var (handles both server and client side)
// Next.js automatically exposes NEXT_PUBLIC_* vars to both server and client via process.env
const getEnvVar = (key: string): string => {
  // In Next.js, NEXT_PUBLIC_* vars are available in process.env on both server and client
  // They are inlined at build time, so we can safely access process.env
  return (process.env[key] || '') as string;
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
    DAOVoting: "0x97004140704097e122CB7B9808330c80464ab69d",
    QuizToEarn: "",
    GRIDToken: "",
    RewardVault: "",
    RewardManager: "",
    ProofOfUtility: "",
    SecureProofOfUtility: "",
    FeeHandler: "",
    AffiliateManager: "",
    LoyaltyPoints: "",
    ProfileRegistry: "",
    UserProfileDashboard: "",
    AdminDashboard: "",
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
    DAOVoting: "0xf5b2a43A626116690675676C00f4b2c4c86020D3",
    QuizToEarn: "0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05",
    GRIDToken: "0x6c4B153eE2Fe3EfcD9CbF5D4A55e058d40Ec86a2",
    RewardVault: "0x59e49E4f60397CC1C2F0eB3d7ebcF9C9c8AACCAD",
    RewardManager: "0x2044FEb08a4Cb14Ff736b00f947E017044da50E6",
    ProofOfUtility: "0xBa8701e6545F3e00864A374Cf61950872eccCDAC",
    SecureProofOfUtility: "", // Will be deployed and updated
    FeeHandler: "0xedAb230E5613B07E72D454a843162E207d451A15",
    AffiliateManager: "0x374fa97A64A43c4fC0AD57dBf6EAE7Ee12924B04",
    LoyaltyPoints: "0x0Bd1DF89A6747e8570992448337647447a9Ad909",
    ProfileRegistry: "0x6fa56cC4a1Fc468867a91b94615d6E83D34f044B",
    UserProfileDashboard: "0x7335913B5dBF5934D98Cd9814A2Af7691541ae43",
    AdminDashboard: "0x96c6Bab5EB4633eE33D07070E8d59C5bf3aD6502",
  },
  igraCaravelTestnet: {
    Treasury: "",
    FeeCollector: "",
    DAppRegistry: "",
    SimplePayment: "",
    PlatformSubscription: "",
    DAppSubscription: "",
    SubscriptionManager: "",
    AuthorizationRegistry: "",
    DAOVoting: "0x97004140704097e122CB7B9808330c80464ab69d",
    QuizToEarn: "",
    GRIDToken: "",
    RewardVault: "",
    RewardManager: "",
    ProofOfUtility: "",
    SecureProofOfUtility: "",
    FeeHandler: "",
    AffiliateManager: "",
    LoyaltyPoints: "",
    ProfileRegistry: "",
    UserProfileDashboard: "",
    AdminDashboard: "",
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
    DAOVoting: "",
    QuizToEarn: "",
    GRIDToken: "",
    RewardVault: "",
    RewardManager: "",
    ProofOfUtility: "",
    SecureProofOfUtility: "",
    FeeHandler: "",
    AffiliateManager: "",
    LoyaltyPoints: "",
    ProfileRegistry: "",
    UserProfileDashboard: "",
    AdminDashboard: "",
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
    DAOVoting: "",
    QuizToEarn: "",
    GRIDToken: "",
    RewardVault: "",
    RewardManager: "",
    ProofOfUtility: "",
    SecureProofOfUtility: "",
    FeeHandler: "",
    AffiliateManager: "",
    LoyaltyPoints: "",
    ProfileRegistry: "",
    UserProfileDashboard: "",
    AdminDashboard: "",
  },
  igraCaravelTestnet: {
    Treasury: "",
    FeeCollector: "",
    DAppRegistry: "",
    SimplePayment: "",
    PlatformSubscription: "",
    DAppSubscription: "",
    SubscriptionManager: "",
    AuthorizationRegistry: "",
    DAOVoting: "",
    QuizToEarn: "",
    GRIDToken: "",
    RewardVault: "",
    RewardManager: "",
    ProofOfUtility: "",
    SecureProofOfUtility: "",
    FeeHandler: "",
    AffiliateManager: "",
    LoyaltyPoints: "",
    ProfileRegistry: "",
    UserProfileDashboard: "",
    AdminDashboard: "",
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
    DAOVoting: getEnvVar('NEXT_PUBLIC_DAO_VOTING_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.DAOVoting || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.DAOVoting,
    QuizToEarn: getEnvVar('NEXT_PUBLIC_QUIZ_TO_EARN_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.QuizToEarn || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.QuizToEarn,
    GRIDToken: getEnvVar('NEXT_PUBLIC_GRID_TOKEN_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.GRIDToken || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.GRIDToken,
    RewardVault: getEnvVar('NEXT_PUBLIC_REWARD_VAULT_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.RewardVault || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.RewardVault,
    RewardManager: getEnvVar('NEXT_PUBLIC_REWARD_MANAGER_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.RewardManager || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.RewardManager,
    ProofOfUtility: getEnvVar('NEXT_PUBLIC_PROOF_OF_UTILITY_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.ProofOfUtility || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.ProofOfUtility,
    SecureProofOfUtility: getEnvVar('NEXT_PUBLIC_SECURE_PROOF_OF_UTILITY_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.SecureProofOfUtility || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.SecureProofOfUtility,
    FeeHandler: getEnvVar('NEXT_PUBLIC_FEE_HANDLER_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.FeeHandler || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.FeeHandler,
    AffiliateManager: getEnvVar('NEXT_PUBLIC_AFFILIATE_MANAGER_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.AffiliateManager || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.AffiliateManager,
    LoyaltyPoints: getEnvVar('NEXT_PUBLIC_LOYALTY_POINTS_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.LoyaltyPoints || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.LoyaltyPoints,
    ProfileRegistry: getEnvVar('NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.ProfileRegistry || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.ProfileRegistry,
    UserProfileDashboard: getEnvVar('NEXT_PUBLIC_USER_PROFILE_DASHBOARD_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.UserProfileDashboard || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.UserProfileDashboard,
    AdminDashboard: getEnvVar('NEXT_PUBLIC_ADMIN_DASHBOARD_ADDRESS') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Mainnet.AdminDashboard || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Mainnet.AdminDashboard,
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
    AuthorizationRegistry: getEnvVar('NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.AuthorizationRegistry || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.AuthorizationRegistry,
    DAOVoting: getEnvVar('NEXT_PUBLIC_DAO_VOTING_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.DAOVoting || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.DAOVoting,
    QuizToEarn: getEnvVar('NEXT_PUBLIC_QUIZ_TO_EARN_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.QuizToEarn || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.QuizToEarn,
    GRIDToken: getEnvVar('NEXT_PUBLIC_GRID_TOKEN_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.GRIDToken || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.GRIDToken,
    RewardVault: getEnvVar('NEXT_PUBLIC_REWARD_VAULT_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.RewardVault || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.RewardVault,
    RewardManager: getEnvVar('NEXT_PUBLIC_REWARD_MANAGER_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.RewardManager || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.RewardManager,
    ProofOfUtility: getEnvVar('NEXT_PUBLIC_PROOF_OF_UTILITY_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.ProofOfUtility || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.ProofOfUtility,
    SecureProofOfUtility: getEnvVar('NEXT_PUBLIC_SECURE_PROOF_OF_UTILITY_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.SecureProofOfUtility || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.SecureProofOfUtility,
    FeeHandler: getEnvVar('NEXT_PUBLIC_FEE_HANDLER_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.FeeHandler || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.FeeHandler,
    AffiliateManager: getEnvVar('NEXT_PUBLIC_AFFILIATE_MANAGER_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.AffiliateManager || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.AffiliateManager,
    LoyaltyPoints: getEnvVar('NEXT_PUBLIC_LOYALTY_POINTS_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.LoyaltyPoints || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.LoyaltyPoints,
    ProfileRegistry: getEnvVar('NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.ProfileRegistry || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.ProfileRegistry,
    UserProfileDashboard: getEnvVar('NEXT_PUBLIC_USER_PROFILE_DASHBOARD_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.UserProfileDashboard || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.UserProfileDashboard,
    AdminDashboard: getEnvVar('NEXT_PUBLIC_ADMIN_DASHBOARD_ADDRESS_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.kasplexL2Testnet.AdminDashboard || DEFAULT_CONTRACT_ADDRESSES.kasplexL2Testnet.AdminDashboard,
  },
  // Igra Caravel Testnet (Chain ID: 19416)
  igraCaravelTestnet: {
    Treasury: getEnvVar('NEXT_PUBLIC_TREASURY_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.Treasury,
    FeeCollector: getEnvVar('NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.FeeCollector,
    DAppRegistry: getEnvVar('NEXT_PUBLIC_DAPP_REGISTRY_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.DAppRegistry,
    SimplePayment: getEnvVar('NEXT_PUBLIC_SIMPLE_PAYMENT_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.SimplePayment,
    PlatformSubscription: getEnvVar('NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.PlatformSubscription,
    DAppSubscription: getEnvVar('NEXT_PUBLIC_DAPP_SUBSCRIPTION_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.DAppSubscription,
    SubscriptionManager: getEnvVar('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.SubscriptionManager,
    AuthorizationRegistry: getEnvVar('NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS_IGRA_TESTNET') || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.AuthorizationRegistry,
    DAOVoting: getEnvVar('NEXT_PUBLIC_DAO_VOTING_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.DAOVoting || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.DAOVoting,
    QuizToEarn: getEnvVar('NEXT_PUBLIC_QUIZ_TO_EARN_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.QuizToEarn || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.QuizToEarn,
    GRIDToken: getEnvVar('NEXT_PUBLIC_GRID_TOKEN_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.GRIDToken || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.GRIDToken,
    RewardVault: getEnvVar('NEXT_PUBLIC_REWARD_VAULT_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.RewardVault || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.RewardVault,
    RewardManager: getEnvVar('NEXT_PUBLIC_REWARD_MANAGER_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.RewardManager || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.RewardManager,
    ProofOfUtility: getEnvVar('NEXT_PUBLIC_PROOF_OF_UTILITY_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.ProofOfUtility || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.ProofOfUtility,
    SecureProofOfUtility: getEnvVar('NEXT_PUBLIC_SECURE_PROOF_OF_UTILITY_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.SecureProofOfUtility || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.SecureProofOfUtility,
    FeeHandler: getEnvVar('NEXT_PUBLIC_FEE_HANDLER_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.FeeHandler || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.FeeHandler,
    AffiliateManager: getEnvVar('NEXT_PUBLIC_AFFILIATE_MANAGER_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.AffiliateManager || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.AffiliateManager,
    LoyaltyPoints: getEnvVar('NEXT_PUBLIC_LOYALTY_POINTS_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.LoyaltyPoints || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.LoyaltyPoints,
    ProfileRegistry: getEnvVar('NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.ProfileRegistry || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.ProfileRegistry,
    UserProfileDashboard: getEnvVar('NEXT_PUBLIC_USER_PROFILE_DASHBOARD_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.UserProfileDashboard || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.UserProfileDashboard,
    AdminDashboard: getEnvVar('NEXT_PUBLIC_ADMIN_DASHBOARD_ADDRESS_IGRA_TESTNET') || HARDCODED_FALLBACK_ADDRESSES.igraCaravelTestnet.AdminDashboard || DEFAULT_CONTRACT_ADDRESSES.igraCaravelTestnet.AdminDashboard,
  },
};

/**
 * Get contract address for a specific chain
 * @param chainId Chain ID
 * @param contractName Name of the contract
 * @returns Contract address or empty string if not found
 */
// vProgs network addresses (placeholder)
const VPROGS_ADDRESSES = {
  vProgsTestnet: {
    DAppRegistry: "",
    FeeHandler: "",
    RewardManager: "",
    GRIDToken: "",
    // Add other contracts as needed
  },
  vProgsMainnet: {
    DAppRegistry: "",
    FeeHandler: "",
    RewardManager: "",
    GRIDToken: "",
    // Add other contracts as needed
  },
};

export const getContractAddress = (
  chainId: number,
  contractName: keyof typeof CONTRACT_ADDRESSES.kasplexL2Testnet
): string => {
  if (chainId === 202555) {
    return CONTRACT_ADDRESSES.kasplexL2Mainnet[contractName] || "";
  } else if (chainId === 167012) {
    return CONTRACT_ADDRESSES.kasplexL2Testnet[contractName] || "";
  } else if (chainId === 19416) {
    return CONTRACT_ADDRESSES.igraCaravelTestnet[contractName] || "";
  } else if (chainId === 999999) {
    // vProgs Testnet
    return VPROGS_ADDRESSES.vProgsTestnet[contractName as keyof typeof VPROGS_ADDRESSES.vProgsTestnet] || "";
  } else if (chainId === 999998) {
    // vProgs Mainnet
    return VPROGS_ADDRESSES.vProgsMainnet[contractName as keyof typeof VPROGS_ADDRESSES.vProgsMainnet] || "";
  }
  return "";
};


