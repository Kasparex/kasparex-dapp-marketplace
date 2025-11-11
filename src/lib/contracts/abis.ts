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
  "function linkDAppToToken(uint256 _dAppId, address _tokenAddress, string memory _ticker, uint256 _totalSupply) external",
  "function updateDAppStatus(uint256 _dAppId, bool _isActive) external",
  "function updateDAppMetadata(uint256 _dAppId, string memory _ipfsCID) external",
  "function getDApp(uint256 _dAppId) external view returns ((string, string, string, address, address, bool, uint256, address, string, uint256, string))",
  "function getDAppToken(uint256 _dAppId) external view returns (address)",
  "function getTokenDApps(address _tokenAddress) external view returns (uint256[] memory)",
  "function getDAppIdByContract(address _contractAddress) external view returns (uint256)",
  "function dAppCount() external view returns (uint256)",
  "event DAppRegistered(uint256 indexed dAppId, string name, string version, address indexed deployer, address indexed contractAddress, uint256 timestamp)",
  "event DAppLinkedToToken(uint256 indexed dAppId, address indexed tokenAddress, string ticker, uint256 totalSupply, uint256 timestamp)",
  "event DAppMetadataUpdated(uint256 indexed dAppId, string ipfsCID, uint256 timestamp)",
] as const;

export const DAPP_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function getRemainingSupply() external view returns (uint256)",
  "function MAX_SUPPLY() external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
] as const;

export const GRID_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function totalBurned() external view returns (uint256)",
  "function circulatingSupply() external view returns (uint256)",
  "function burnPercentage() external view returns (uint256)",
  "function burn(uint256 amount) external",
  "function burnFrom(address from, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
] as const;

export const PROOF_OF_UTILITY_ABI = [
  "function recordUsage(address user, address dAppContract, uint256 dAppId, string memory actionType) external",
  "function recordUsageBatch(address[] memory users, address[] memory dAppContracts, uint256[] memory dAppIds, string[] memory actionTypes) external",
  "function getUserEvents(address user) external view returns ((address, address, uint256, string, uint256)[])",
  "function getDAppEvents(address dAppContract) external view returns ((address, address, uint256, string, uint256)[])",
  "function getUserEventCount(address user) external view returns (uint256)",
  "function totalEvents() external view returns (uint256)",
  "event UsageEventRecorded(address indexed user, address indexed dAppContract, uint256 indexed dAppId, string actionType, uint256 timestamp)",
] as const;

export const ACCESS_CONTROL_ABI = [
  "function hasAccess(address user) external view returns (bool)",
  "function checkAndCacheAccess(address user) external returns (bool)",
  "function recordTokenAcquisition(address user) external",
  "function accessToken() external view returns (address)",
  "function minBalance() external view returns (uint256)",
  "function minHoldingTime() external view returns (uint256)",
] as const;

export const FEE_HANDLER_ABI = [
  "function collectFee(address _projectTreasury) external payable",
  "function collectFeesBatch(address[] memory _projectTreasuries) external payable",
  "function getProjectFees(address _projectTreasury) external view returns (uint256)",
  "function totalFeesCollected() external view returns (uint256)",
  "function kasparexTreasury() external view returns (address)",
  "function projectTreasury() external view returns (address)",
  "event FeeReceived(address indexed from, address indexed projectTreasury, uint256 totalAmount, uint256 kasparexAmount, uint256 projectAmount, uint256 timestamp)",
] as const;

export const REWARD_MANAGER_ABI = [
  "function distributeReward(address user, address dAppContract, uint256 actionValue) external",
  "function distributeRewardsBatch(address[] memory users, address[] memory dAppContracts, uint256[] memory actionValues) external",
  "function setRewardRate(address dAppContract, uint256 rate) external",
  "function setRewardType(address dAppContract, bool useGRID) external",
  "function setDAppToken(address dAppContract, address tokenContract) external",
  "function rewardRates(address) external view returns (uint256)",
  "function useGRID(address) external view returns (bool)",
  "event RewardDistributed(address indexed user, address indexed dAppContract, address indexed token, uint256 amount, string rewardType)",
] as const;

export const AFFILIATE_MANAGER_ABI = [
  "function recordReferral(address affiliate, address user, address dAppContract) external",
  "function distributeReferralReward(address affiliate, address dAppContract, uint256 actionValue) external",
  "function getReferralCount(address affiliate, address dAppContract) external view returns (uint256)",
  "function getUserReferrals(address user) external view returns ((address, address, address, uint256, bool)[])",
  "function getAffiliateReferrals(address affiliate) external view returns ((address, address, address, uint256, bool)[])",
  "function referralRewardRate() external view returns (uint256)",
  "event ReferralRecorded(address indexed affiliate, address indexed user, address indexed dAppContract, uint256 timestamp)",
  "event ReferralRewarded(address indexed affiliate, address indexed dAppContract, uint256 amount, uint256 timestamp)",
] as const;

export const LOYALTY_POINTS_ABI = [
  "function awardPoints(address user, string memory actionType) external",
  "function awardPointsBatch(address[] memory users, string[] memory actionTypes) external",
  "function getUserLoyalty(address user) external view returns ((uint256, uint256, uint256, uint256))",
  "function getTotalPoints(address user) external view returns (uint256)",
  "function getStreak(address user) external view returns (uint256)",
  "function actionPoints(string) external view returns (uint256)",
  "event PointsAwarded(address indexed user, string actionType, uint256 points, uint256 totalPoints, uint256 timestamp)",
] as const;

export const REWARD_VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, address to, uint256 amount) external",
  "function getBalance(address token) external view returns (uint256)",
  "function rewardManager() external view returns (address)",
] as const;

export const USER_PROFILE_DASHBOARD_ABI = [
  "function updateProfile(string memory ipfsCID) external",
  "function setPreferences(bytes memory preferences) external",
  "function linkSocial(string memory platform, string memory handle) external",
  "function setIconColor(string memory colorHex) external",
  "function getProfileCID(address user) external view returns (string memory)",
] as const;

export const ADMIN_DASHBOARD_ABI = [
  "function proposeOperation(bytes32 operationHash) external returns (bytes32)",
  "function approveOperation(bytes32 operationId) external",
  "function approveDApp(uint256 dAppId) external",
  "function setFeeRates(uint256 newKasparexPercentage, uint256 newProjectPercentage) external",
  "function setMultiSigThreshold(uint256 newThreshold) external",
  "function getPendingOperations() external view returns (bytes32[] memory)",
  "function getOperation(bytes32 operationId) external view returns (bytes32, address, uint256, bool)",
  "function multiSigThreshold() external view returns (uint256)",
] as const;

export const PROFILE_REGISTRY_ABI = [
  "function setProfileCID(address user, string memory ipfsCID) external",
  "function setDisplayName(address user, string memory displayName) external",
  "function setVerified(address user, bool verified) external",
  "function setPreferences(address user, bytes memory preferences) external",
  "function getProfile(address user) external view returns ((string, string, bool, bytes, uint256))",
  "function getProfileCID(address user) external view returns (string memory)",
  "function verifiedAddresses(address) external view returns (bool)",
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
  "function setKasparexFeePercentage(uint256 _newPercentage) external",
  "function kasparexFeePercentage() external view returns (uint256)",
  "function setTreasury(address _treasury) external",
  "function setAuthorizationRegistry(address _authorizationRegistry) external",
  "function setDAppRegistry(address _dAppRegistry) external",
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

export const AUTHORIZATION_REGISTRY_ABI = [
  "function assignDeveloper(uint256 _dAppId, address _developer) external",
  "function revokeDeveloper(uint256 _dAppId, address _developer) external",
  "function isDeveloper(uint256 _dAppId, address _developer) external view returns (bool)",
  "function getDAppDevelopers(uint256 _dAppId) external view returns (address[])",
  "function getDeveloperDApps(address _developer) external view returns (uint256[])",
  "function batchAssignDevelopers(uint256 _dAppId, address[] calldata _developers) external",
  "function batchRevokeDevelopers(uint256 _dAppId, address[] calldata _developers) external",
  "function dAppDevelopers(uint256, address) external view returns (bool)",
  "event DeveloperAssigned(uint256 indexed dAppId, address indexed developer, address indexed assignedBy, uint256 timestamp)",
  "event DeveloperRevoked(uint256 indexed dAppId, address indexed developer, address indexed revokedBy, uint256 timestamp)",
] as const;

export const DAO_VOTING_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
    ],
    name: "submitProposal",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_proposalId", type: "uint256" },
      { internalType: "bool", name: "_support", type: "bool" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_proposalId", type: "uint256" },
      { internalType: "bool", name: "_newSupport", type: "bool" },
    ],
    name: "changeVote",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_proposalId", type: "uint256" }],
    name: "flagProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_proposalId", type: "uint256" }],
    name: "getProposal",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "address", name: "proposer", type: "address" },
          { internalType: "uint256", name: "submissionFee", type: "uint256" },
          { internalType: "uint256", name: "voteFee", type: "uint256" },
          { internalType: "uint256", name: "yesVotes", type: "uint256" },
          { internalType: "uint256", name: "noVotes", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "bool", name: "isFlagged", type: "bool" },
          { internalType: "bool", name: "isActive", type: "bool" },
        ],
        internalType: "struct DAOVoting.Proposal",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_offset", type: "uint256" },
      { internalType: "uint256", name: "_limit", type: "uint256" },
    ],
    name: "getProposals",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "address", name: "proposer", type: "address" },
          { internalType: "uint256", name: "submissionFee", type: "uint256" },
          { internalType: "uint256", name: "voteFee", type: "uint256" },
          { internalType: "uint256", name: "yesVotes", type: "uint256" },
          { internalType: "uint256", name: "noVotes", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "bool", name: "isFlagged", type: "bool" },
          { internalType: "bool", name: "isActive", type: "bool" },
        ],
        internalType: "struct DAOVoting.Proposal[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_proposalId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "hasUserVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_proposalId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getUserVote",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "support", type: "bool" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct DAOVoting.Vote",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "submissionFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "voteFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "flagThreshold",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "proposals",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "uint256", name: "submissionFee", type: "uint256" },
      { internalType: "uint256", name: "voteFee", type: "uint256" },
      { internalType: "uint256", name: "yesVotes", type: "uint256" },
      { internalType: "uint256", name: "noVotes", type: "uint256" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "bool", name: "isFlagged", type: "bool" },
      { internalType: "bool", name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "proposer", type: "address" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ProposalSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "bool", name: "support", type: "bool" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "bool", name: "oldSupport", type: "bool" },
      { indexed: false, internalType: "bool", name: "newSupport", type: "bool" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "VoteChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "yesVotes", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "noVotes", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ProposalFlagged",
    type: "event",
  },
] as const;

export const KAS_TIP_ABI = [
  "function tip(address _recipient, address _referral) external payable",
  "function getTopTippers(uint256 _limit) external view returns (address[])",
  "function getUserRank(address _user) external view returns (uint256)",
  "function getTotalTipsCount() external view returns (uint256)",
  "function getRecipientTips(address _recipient) external view returns ((address, address, uint256, uint256, address, uint256)[])",
  "function getSenderTips(address _sender) external view returns ((address, address, uint256, uint256, address, uint256)[])",
  "function tippers(address) external view returns (address user, uint256 totalTipped, uint256 tipCount, uint256 lastTipTime)",
  "function calculateFee(uint256 _amount) external view returns (uint256)",
  "function getStats() external view returns (uint256 totalTips, uint256 totalTipped, uint256 totalFees, uint256 topTippersCount)",
  "function feePercentage() external view returns (uint256)",
  "function dAppId() external view returns (uint256)",
  "event TipSent(address indexed from, address indexed to, uint256 amount, uint256 fee, address indexed referral, uint256 timestamp)",
  "event LeaderboardUpdated(address indexed user, uint256 totalTipped, uint256 rank)",
] as const;

