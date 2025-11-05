/**
 * Contract ABIs
 * 
 * These ABIs are generated from the compiled contracts.
 * In production, these should be imported from the artifacts or typechain-generated files.
 */

export const TREASURY_ABI = [
  "function collectFee() external payable",
  "function distributeRevenue() external",
  "function setDistributionPercentages(uint256 _treasuryPercentage, uint256 _developerPercentage, uint256 _builderPercentage) external",
  "function setDistributionAddresses(address _developerAddress, address _builderAddress) external",
  "function getBalance() external view returns (uint256)",
  "function totalFeesCollected() external view returns (uint256)",
  "function treasuryPercentage() external view returns (uint256)",
  "function developerPercentage() external view returns (uint256)",
  "function builderPercentage() external view returns (uint256)",
  "function developerAddress() external view returns (address)",
  "function builderAddress() external view returns (address)",
  "event FeeCollected(address indexed from, uint256 amount, uint256 timestamp)",
  "event RevenueDistributed(uint256 treasuryAmount, uint256 developerAmount, uint256 builderAmount, uint256 timestamp)",
] as const;

export const FEE_COLLECTOR_ABI = [
  "function forwardFee() external payable",
  "function setTreasury(address _treasury) external",
  "function treasury() external view returns (address)",
  "event FeeForwarded(address indexed from, uint256 amount, uint256 timestamp)",
] as const;

export const DAPP_REGISTRY_ABI = [
  "function registerDApp(string memory _name, string memory _version, string memory _category, address _contractAddress) external returns (uint256)",
  "function linkDAppToToken(uint256 _dAppId, address _tokenAddress) external",
  "function updateDAppStatus(uint256 _dAppId, bool _isActive) external",
  "function getDApp(uint256 _dAppId) external view returns ((string, string, string, address, address, bool, uint256, address))",
  "function getTokenDApps(address _tokenAddress) external view returns (uint256[] memory)",
  "function getDAppIdByContract(address _contractAddress) external view returns (uint256)",
  "function dAppCount() external view returns (uint256)",
  "event DAppRegistered(uint256 indexed dAppId, string name, string version, address indexed deployer, address indexed contractAddress, uint256 timestamp)",
] as const;

export const SIMPLE_PAYMENT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
    ],
    name: "sendPayment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_feeCollector",
        type: "address",
      },
    ],
    name: "setFeeCollector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_feePercentage",
        type: "uint256",
      },
    ],
    name: "setFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "calculateFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "getPaymentAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [
      {
        internalType: "contract FeeCollector",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feePercentage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "PaymentSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "FeeCollected",
    type: "event",
  },
] as const;

export const PLATFORM_SUBSCRIPTION_ABI = [
  "function subscribe() external payable",
  "function isSubscribed(address _user) external view returns (bool)",
  "function isInGracePeriod(address _user) external view returns (bool)",
  "function getExpiryTimestamp(address _user) external view returns (uint256)",
  "function monthlyPrice() external view returns (uint256)",
  "function subscriptionPeriod() external view returns (uint256)",
  "function gracePeriod() external view returns (uint256)",
  "event SubscriptionPurchased(address indexed user, uint256 amount, uint256 expiryTimestamp, uint256 timestamp)",
  "event SubscriptionRenewed(address indexed user, uint256 amount, uint256 newExpiryTimestamp, uint256 timestamp)",
] as const;

export const DAPP_SUBSCRIPTION_ABI = [
  "function subscribe(address _dAppContract, uint8 _frequency) external payable",
  "function isSubscribed(address _user, address _dAppContract) external view returns (bool)",
  "function getExpiryTimestamp(address _user, address _dAppContract) external view returns (uint256)",
  "function createSubscriptionPlan(address _dAppContract, uint256 _monthlyPrice, uint256 _quarterlyPrice, uint256 _yearlyPrice) external",
  "function updateSubscriptionPlan(address _dAppContract, uint256 _monthlyPrice, uint256 _quarterlyPrice, uint256 _yearlyPrice) external",
  "function getSubscriptionPlan(address _dAppContract) external view returns ((address, address, uint256, uint256, uint256, bool, uint256))",
  "event SubscriptionPurchased(address indexed user, address indexed dAppContract, uint8 frequency, uint256 amount, uint256 expiryTimestamp, uint256 timestamp)",
  "event SubscriptionPlanCreated(address indexed dAppContract, address indexed developer, uint256 monthlyPrice, uint256 quarterlyPrice, uint256 yearlyPrice, uint256 timestamp)",
] as const;

export const SUBSCRIPTION_MANAGER_ABI = [
  "function hasAccess(address _user, address _dAppContract) external view returns (bool)",
  "function hasPlatformSubscription(address _user) external view returns (bool)",
  "function hasDAppSubscription(address _user, address _dAppContract) external view returns (bool)",
  "function isInPlatformGracePeriod(address _user) external view returns (bool)",
  "function getPlatformExpiry(address _user) external view returns (uint256)",
  "function getDAppExpiry(address _user, address _dAppContract) external view returns (uint256)",
  "function getSubscriptionStatus(address _user, address _dAppContract) external view returns (bool, uint256, bool, uint256, bool)",
] as const;


