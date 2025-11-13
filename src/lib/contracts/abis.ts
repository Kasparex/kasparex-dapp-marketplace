/**
 * Contract ABIs
 * 
 * These ABIs are generated from the compiled contracts.
 * In production, these should be imported from the artifacts or typechain-generated files.
 */

export const TREASURY_ABI = [
  {
    type: "function",
    name: "collectFee",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "distributeRevenue",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "setDistributionPercentages",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_treasuryPercentage", type: "uint256" },
      { internalType: "uint256", name: "_developerPercentage", type: "uint256" },
      { internalType: "uint256", name: "_builderPercentage", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setDistributionAddresses",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_developerAddress", type: "address" },
      { internalType: "address", name: "_builderAddress", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalFeesCollected",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "treasuryPercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "developerPercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "builderPercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "developerAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "function",
    name: "builderAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "event",
    name: "FeeCollected",
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RevenueDistributed",
    inputs: [
      { indexed: false, internalType: "uint256", name: "treasuryAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "developerAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "builderAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const FEE_COLLECTOR_ABI = [
  {
    type: "function",
    name: "forwardFee",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "setTreasury",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_treasury", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "event",
    name: "FeeForwarded",
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const DAPP_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerDApp",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_version", type: "string" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "address", name: "_contractAddress", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "linkDAppToToken",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "address", name: "_tokenAddress", type: "address" },
      { internalType: "string", name: "_ticker", type: "string" },
      { internalType: "uint256", name: "_totalSupply", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "updateDAppStatus",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "bool", name: "_isActive", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "updateDAppMetadata",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "string", name: "_ipfsCID", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getDApp",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" }
    ],
    outputs: [
      {
        components: [
          { internalType: "string", name: "", type: "string" },
          { internalType: "string", name: "", type: "string" },
          { internalType: "string", name: "", type: "string" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "bool", name: "", type: "bool" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "string", name: "", type: "string" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "string", name: "", type: "string" }
        ],
        internalType: "tuple",
        name: "",
        type: "tuple"
      }
    ]
  },
  {
    type: "function",
    name: "getDAppToken",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" }
    ],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "function",
    name: "getTokenDApps",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_tokenAddress", type: "address" }
    ],
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ]
  },
  {
    type: "function",
    name: "getDAppIdByContract",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_contractAddress", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "dAppCount",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "DAppRegistered",
    inputs: [
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      { indexed: false, internalType: "string", name: "version", type: "string" },
      { indexed: true, internalType: "address", name: "deployer", type: "address" },
      { indexed: true, internalType: "address", name: "contractAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DAppLinkedToToken",
    inputs: [
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: true, internalType: "address", name: "tokenAddress", type: "address" },
      { indexed: false, internalType: "string", name: "ticker", type: "string" },
      { indexed: false, internalType: "uint256", name: "totalSupply", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DAppMetadataUpdated",
    inputs: [
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: false, internalType: "string", name: "ipfsCID", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const DAPP_TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "account", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getRemainingSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "MAX_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  }
] as const;

export const GRID_TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "account", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalBurned",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "circulatingSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "burnPercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "burnFrom",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  }
] as const;

export const PROOF_OF_UTILITY_ABI = [
  {
    type: "function",
    name: "recordUsage",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "dAppId", type: "uint256" },
      { internalType: "string", name: "actionType", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordUsageBatch",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address[]", name: "users", type: "address[]" },
      { internalType: "address[]", name: "dAppContracts", type: "address[]" },
      { internalType: "uint256[]", name: "dAppIds", type: "uint256[]" },
      { internalType: "string[]", name: "actionTypes", type: "string[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordUsageAndReward",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "dAppId", type: "uint256" },
      { internalType: "string", name: "actionType", type: "string" },
      { internalType: "uint256", name: "actionValue", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getUserEvents",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "string", name: "", type: "string" },
          { internalType: "uint256", name: "", type: "uint256" }
        ],
        internalType: "tuple[]",
        name: "",
        type: "tuple[]"
      }
    ]
  },
  {
    type: "function",
    name: "getDAppEvents",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "dAppContract", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "string", name: "", type: "string" },
          { internalType: "uint256", name: "", type: "uint256" }
        ],
        internalType: "tuple[]",
        name: "",
        type: "tuple[]"
      }
    ]
  },
  {
    type: "function",
    name: "getUserEventCount",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalEvents",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "rewardManager",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "function",
    name: "setRewardManager",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_rewardManager", type: "address" }
    ],
    outputs: []
  },
  {
    type: "event",
    name: "UsageEventRecorded",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: false, internalType: "string", name: "actionType", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardManagerUpdated",
    inputs: [
      { indexed: true, internalType: "address", name: "oldManager", type: "address" },
      { indexed: true, internalType: "address", name: "newManager", type: "address" }
    ],
    anonymous: false
  }
] as const;

export const ACCESS_CONTROL_ABI = [
  {
    type: "function",
    name: "hasAccess",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "checkAndCacheAccess",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "recordTokenAcquisition",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "accessToken",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "function",
    name: "minBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "minHoldingTime",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  }
] as const;

export const FEE_HANDLER_ABI = [
  {
    type: "function",
    name: "collectFee",
    stateMutability: "payable",
    inputs: [
      { internalType: "address", name: "_projectTreasury", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "collectFeesBatch",
    stateMutability: "payable",
    inputs: [
      { internalType: "address[]", name: "_projectTreasuries", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getProjectFees",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_projectTreasury", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "totalFeesCollected",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "kasparexTreasury",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "function",
    name: "projectTreasury",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  },
  {
    type: "event",
    name: "FeeReceived",
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "projectTreasury", type: "address" },
      { indexed: false, internalType: "uint256", name: "totalAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "kasparexAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "projectAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const REWARD_MANAGER_ABI = [
  {
    type: "function",
    name: "distributeReward",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "actionValue", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "distributeRewardsBatch",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address[]", name: "users", type: "address[]" },
      { internalType: "address[]", name: "dAppContracts", type: "address[]" },
      { internalType: "uint256[]", name: "actionValues", type: "uint256[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setRewardRate",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "rate", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setRewardType",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "bool", name: "useGRID", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setDAppToken",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "address", name: "tokenContract", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "rewardRates",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "useGRID",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "event",
    name: "RewardDistributed",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: true, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "string", name: "rewardType", type: "string" }
    ],
    anonymous: false
  }
] as const;

export const AFFILIATE_MANAGER_ABI = [
  {
    type: "function",
    name: "recordReferral",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "affiliate", type: "address" },
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "distributeReferralReward",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "affiliate", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "actionValue", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getReferralCount",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "affiliate", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getUserReferrals",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "bool", name: "", type: "bool" }
        ],
        internalType: "tuple[]",
        name: "",
        type: "tuple[]"
      }
    ]
  },
  {
    type: "function",
    name: "getAffiliateReferrals",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "affiliate", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "bool", name: "", type: "bool" }
        ],
        internalType: "tuple[]",
        name: "",
        type: "tuple[]"
      }
    ]
  },
  {
    type: "function",
    name: "referralRewardRate",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "ReferralRecorded",
    inputs: [
      { indexed: true, internalType: "address", name: "affiliate", type: "address" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ReferralRewarded",
    inputs: [
      { indexed: true, internalType: "address", name: "affiliate", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const LOYALTY_POINTS_ABI = [
  {
    type: "function",
    name: "awardPoints",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "string", name: "actionType", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "awardPointsBatch",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address[]", name: "users", type: "address[]" },
      { internalType: "string[]", name: "actionTypes", type: "string[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getUserLoyalty",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "uint256", name: "", type: "uint256" }
        ],
        internalType: "tuple",
        name: "",
        type: "tuple"
      }
    ]
  },
  {
    type: "function",
    name: "getTotalPoints",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getStreak",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "actionPoints",
    stateMutability: "view",
    inputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "PointsAwarded",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "string", name: "actionType", type: "string" },
      { indexed: false, internalType: "uint256", name: "points", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalPoints", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const REWARD_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getBalance",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "token", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "rewardManager",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ]
  }
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

export const QUIZ_TO_EARN_ABI = [
  {
    type: "function",
    name: "submitAnswer",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_questionId", type: "uint256" },
      { internalType: "uint256", name: "_selectedAnswerIndex", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "addQuestion",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "string", name: "_questionText", type: "string" },
      { internalType: "string[]", name: "_options", type: "string[]" },
      { internalType: "uint256", name: "_correctAnswerIndex", type: "uint256" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "uint256", name: "_rewardAmount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "updateQuestionStatus",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_questionId", type: "uint256" },
      { internalType: "bool", name: "_isActive", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getQuestion",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_questionId", type: "uint256" }
    ],
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "questionText", type: "string" },
      { internalType: "string[]", name: "options", type: "string[]" },
      { internalType: "string", name: "category", type: "string" },
      { internalType: "uint256", name: "rewardAmount", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "createdAt", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getUserAnswer",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_questionId", type: "uint256" }
    ],
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "questionId", type: "uint256" },
          { internalType: "uint256", name: "selectedAnswerIndex", type: "uint256" },
          { internalType: "bool", name: "isCorrect", type: "bool" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "rewardClaimed", type: "bool" }
        ],
        internalType: "struct QuizToEarn.UserAnswer",
        name: "",
        type: "tuple"
      }
    ]
  },
  {
    type: "function",
    name: "getUserAnsweredQuestions",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ]
  },
  {
    type: "function",
    name: "getActiveQuestions",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_offset", type: "uint256" },
      { internalType: "uint256", name: "_limit", type: "uint256" }
    ],
    outputs: [
      { internalType: "uint256[]", name: "ids", type: "uint256[]" },
      { internalType: "string[]", name: "questionTexts", type: "string[]" },
      { internalType: "string[][]", name: "optionsArray", type: "string[][]" },
      { internalType: "string[]", name: "categories", type: "string[]" },
      { internalType: "uint256[]", name: "rewardAmounts", type: "uint256[]" }
    ]
  },
  {
    type: "function",
    name: "questionCount",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "defaultRewardAmount",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "feePercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "dAppId",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "setDAppId",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setDefaultRewardAmount",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_newRewardAmount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setFeePercentage",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_newFeePercentage", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setFeeCollector",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_feeCollector", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setProofOfUtility",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_proofOfUtility", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "calculateFee",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "QuestionAdded",
    inputs: [
      { indexed: true, internalType: "uint256", name: "questionId", type: "uint256" },
      { indexed: false, internalType: "string", name: "questionText", type: "string" },
      { indexed: false, internalType: "string", name: "category", type: "string" },
      { indexed: false, internalType: "uint256", name: "rewardAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "QuestionUpdated",
    inputs: [
      { indexed: true, internalType: "uint256", name: "questionId", type: "uint256" },
      { indexed: false, internalType: "bool", name: "isActive", type: "bool" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "AnswerSubmitted",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "questionId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "selectedAnswerIndex", type: "uint256" },
      { indexed: false, internalType: "bool", name: "isCorrect", type: "bool" },
      { indexed: false, internalType: "uint256", name: "rewardAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardClaimed",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "questionId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "rewardAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DAppInitialized",
    inputs: [
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: true, internalType: "address", name: "deployer", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DefaultRewardUpdated",
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldReward", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newReward", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

