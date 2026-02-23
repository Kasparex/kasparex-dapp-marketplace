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

/** Minimal ERC20 view ABI for symbol() used by stats/contract params. */
export const ERC20_VIEW_ABI = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "string", name: "", type: "string" }],
  },
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

export const SECURE_PROOF_OF_UTILITY_ABI = [
  {
    type: "function",
    name: "recordUsageAndReward",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "dAppId", type: "uint256" },
      { internalType: "string", name: "actionType", type: "string" },
      { internalType: "uint256", name: "actionValue", type: "uint256" },
      { internalType: "bytes32", name: "txHash", type: "bytes32" },
      { internalType: "uint256", name: "nonce", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordUsage",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "dAppContract", type: "address" },
      { internalType: "uint256", name: "dAppId", type: "uint256" },
      { internalType: "string", name: "actionType", type: "string" },
      { internalType: "bytes32", name: "txHash", type: "bytes32" },
      { internalType: "uint256", name: "nonce", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "authorizedDApps",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "processedTransactions",
    stateMutability: "view",
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "lastActionTime",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "string", name: "", type: "string" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "maxActionValue",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "maxRewardPerAction",
    stateMutability: "view",
    inputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "cooldownPeriods",
    stateMutability: "view",
    inputs: [
      { internalType: "string", name: "", type: "string" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "defaultCooldownPeriod",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
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
          { internalType: "address", name: "user", type: "address" },
          { internalType: "address", name: "dAppContract", type: "address" },
          { internalType: "uint256", name: "dAppId", type: "uint256" },
          { internalType: "string", name: "actionType", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bytes32", name: "txHash", type: "bytes32" },
          { internalType: "uint256", name: "nonce", type: "uint256" }
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
          { internalType: "address", name: "user", type: "address" },
          { internalType: "address", name: "dAppContract", type: "address" },
          { internalType: "uint256", name: "dAppId", type: "uint256" },
          { internalType: "string", name: "actionType", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bytes32", name: "txHash", type: "bytes32" },
          { internalType: "uint256", name: "nonce", type: "uint256" }
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
    name: "rewardManager",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "address", name: "", type: "address" }
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
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "event",
    name: "UsageEventRecorded",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: false, internalType: "string", name: "actionType", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "txHash", type: "bytes32" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardDistributed",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: false, internalType: "uint256", name: "rewardAmount", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DAppAuthorized",
    inputs: [
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: false, internalType: "bool", name: "authorized", type: "bool" }
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
    name: "distributeRewardDirect",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "amountWei", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setGridTreasury",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_gridTreasury", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setAuthorizedRewardCaller",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "caller", type: "address" },
      { internalType: "bool", name: "allowed", type: "bool" }
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
    name: "awardPointsWithMultiplier",
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
  {
    type: "function",
    name: "updateProfile",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "string", name: "ipfsCID", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setPreferences",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "bytes", name: "preferences", type: "bytes" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "linkSocial",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "string", name: "platform", type: "string" },
      { internalType: "string", name: "handle", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setIconColor",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "string", name: "colorHex", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getProfileCID",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "string", name: "", type: "string" }
    ]
  }
] as const;

export const ADMIN_DASHBOARD_ABI = [
  {
    type: "function",
    name: "proposeOperation",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "bytes32", name: "operationHash", type: "bytes32" }
    ],
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" }
    ]
  },
  {
    type: "function",
    name: "approveOperation",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "bytes32", name: "operationId", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approveDApp",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "dAppId", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setFeeRates",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "newKasparexPercentage", type: "uint256" },
      { internalType: "uint256", name: "newProjectPercentage", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setMultiSigThreshold",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "newThreshold", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getPendingOperations",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "bytes32[]", name: "", type: "bytes32[]" }
    ]
  },
  {
    type: "function",
    name: "getOperation",
    stateMutability: "view",
    inputs: [
      { internalType: "bytes32", name: "operationId", type: "bytes32" }
    ],
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "multiSigThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  }
] as const;

export const PROFILE_REGISTRY_ABI = [
  {
    type: "function",
    name: "setProfileCID",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "string", name: "ipfsCID", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setDisplayName",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "string", name: "displayName", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setVerified",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bool", name: "verified", type: "bool" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setPreferences",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bytes", name: "preferences", type: "bytes" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "string", name: "", type: "string" },
          { internalType: "string", name: "", type: "string" },
          { internalType: "bool", name: "", type: "bool" },
          { internalType: "bytes", name: "", type: "bytes" },
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
    name: "getProfileCID",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "user", type: "address" }
    ],
    outputs: [
      { internalType: "string", name: "", type: "string" }
    ]
  },
  {
    type: "function",
    name: "verifiedAddresses",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  }
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
  {
    type: "function",
    name: "subscribe",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "isSubscribed",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "isInGracePeriod",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "getExpiryTimestamp",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "monthlyPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "subscriptionPeriod",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "gracePeriod",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "SubscriptionPurchased",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "expiryTimestamp", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SubscriptionRenewed",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newExpiryTimestamp", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const DAPP_SUBSCRIPTION_ABI = [
  {
    type: "function",
    name: "subscribe",
    stateMutability: "payable",
    inputs: [
      { internalType: "address", name: "_dAppContract", type: "address" },
      { internalType: "uint8", name: "_frequency", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "isSubscribed",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "getExpiryTimestamp",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "createSubscriptionPlan",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_dAppContract", type: "address" },
      { internalType: "uint256", name: "_monthlyPrice", type: "uint256" },
      { internalType: "uint256", name: "_quarterlyPrice", type: "uint256" },
      { internalType: "uint256", name: "_yearlyPrice", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "updateSubscriptionPlan",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_dAppContract", type: "address" },
      { internalType: "uint256", name: "_monthlyPrice", type: "uint256" },
      { internalType: "uint256", name: "_quarterlyPrice", type: "uint256" },
      { internalType: "uint256", name: "_yearlyPrice", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getSubscriptionPlan",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "address", name: "", type: "address" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "bool", name: "", type: "bool" },
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
    name: "setKasparexFeePercentage",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_newPercentage", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "kasparexFeePercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
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
    name: "setAuthorizationRegistry",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_authorizationRegistry", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "setDAppRegistry",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "address", name: "_dAppRegistry", type: "address" }
    ],
    outputs: []
  },
  {
    type: "event",
    name: "SubscriptionPurchased",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: false, internalType: "uint8", name: "frequency", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "expiryTimestamp", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SubscriptionPlanCreated",
    inputs: [
      { indexed: true, internalType: "address", name: "dAppContract", type: "address" },
      { indexed: true, internalType: "address", name: "developer", type: "address" },
      { indexed: false, internalType: "uint256", name: "monthlyPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "quarterlyPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "yearlyPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
] as const;

export const SUBSCRIPTION_MANAGER_ABI = [
  {
    type: "function",
    name: "hasAccess",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "hasPlatformSubscription",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "hasDAppSubscription",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "isInPlatformGracePeriod",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "getPlatformExpiry",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getDAppExpiry",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getSubscriptionStatus",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "address", name: "_dAppContract", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" }
    ]
  }
] as const;

export const AUTHORIZATION_REGISTRY_ABI = [
  {
    type: "function",
    name: "assignDeveloper",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "address", name: "_developer", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "revokeDeveloper",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "address", name: "_developer", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "isDeveloper",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "address", name: "_developer", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "getDAppDevelopers",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" }
    ],
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" }
    ]
  },
  {
    type: "function",
    name: "getDeveloperDApps",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "_developer", type: "address" }
    ],
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" }
    ]
  },
  {
    type: "function",
    name: "batchAssignDevelopers",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "address[]", name: "_developers", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "batchRevokeDevelopers",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_dAppId", type: "uint256" },
      { internalType: "address[]", name: "_developers", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "dAppDevelopers",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" }
    ],
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ]
  },
  {
    type: "event",
    name: "DeveloperAssigned",
    inputs: [
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: true, internalType: "address", name: "developer", type: "address" },
      { indexed: true, internalType: "address", name: "assignedBy", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DeveloperRevoked",
    inputs: [
      { indexed: true, internalType: "uint256", name: "dAppId", type: "uint256" },
      { indexed: true, internalType: "address", name: "developer", type: "address" },
      { indexed: true, internalType: "address", name: "revokedBy", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  }
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

export const PROMO_MINT_ROUTER_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { internalType: "bytes32", name: "tokenId", type: "bytes32" },
      { internalType: "bytes32", name: "pageId", type: "bytes32" },
      { internalType: "uint256", name: "count", type: "uint256" },
      { internalType: "address[5]", name: "pageSlots", type: "address[5]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getTokenConfig",
    stateMutability: "view",
    inputs: [
      { internalType: "bytes32", name: "tokenId", type: "bytes32" }
    ],
    outputs: [
      {
        components: [
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "mintPrice", type: "uint256" },
          { internalType: "uint256", name: "tokensPerMint", type: "uint256" },
          { internalType: "uint256", name: "mintableSupply", type: "uint256" },
          { internalType: "uint256", name: "mintedSoFar", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "platform", type: "address" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "uint16", name: "creatorBps", type: "uint16" },
          { internalType: "uint16", name: "platformBps", type: "uint16" },
          { internalType: "uint16[5]", name: "slotBps", type: "uint16[5]" }
        ],
        internalType: "struct PromoMintRouter.TokenConfig",
        name: "",
        type: "tuple"
      }
    ]
  },
  {
    type: "function",
    name: "getWalletSecurity",
    stateMutability: "view",
    inputs: [
      { internalType: "address", name: "wallet", type: "address" }
    ],
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "lastMintDay", type: "uint64" },
          { internalType: "uint64", name: "mintsToday", type: "uint64" },
          { internalType: "uint64", name: "lastMintTime", type: "uint64" },
          { internalType: "uint256", name: "totalMints", type: "uint256" }
        ],
        internalType: "struct PromoMintRouter.WalletSecurity",
        name: "",
        type: "tuple"
      }
    ]
  },
  {
    type: "function",
    name: "cooldownSeconds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "maxMintsPerDay",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "maxMintsPerTx",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "MintExecuted",
    inputs: [
      { indexed: true, internalType: "bytes32", name: "tokenId", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "pageId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "minter", type: "address" },
      { indexed: false, internalType: "uint256", name: "mintCount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "mintPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalPaid", type: "uint256" },
      { indexed: false, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "address", name: "platform", type: "address" },
      { indexed: false, internalType: "address[5]", name: "slotsBefore", type: "address[5]" },
      { indexed: false, internalType: "uint256", name: "creatorAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "platformAmount", type: "uint256" },
      { indexed: false, internalType: "uint256[5]", name: "slotAmounts", type: "uint256[5]" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MintBlocked",
    inputs: [
      { indexed: true, internalType: "address", name: "wallet", type: "address" },
      { indexed: true, internalType: "bytes32", name: "tokenId", type: "bytes32" },
      { indexed: false, internalType: "string", name: "reason", type: "string" }
    ],
    anonymous: false
  }
] as const;

/** RevenueTreeManager: setReferrer, volume, activation, upline, distributeToUpline */
export const REVENUE_TREE_MANAGER_ABI = [
  {
    type: "function",
    name: "setReferrer",
    stateMutability: "nonpayable",
    inputs: [{ internalType: "address", name: "referrer", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "referrerOf",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "", type: "address" }],
    outputs: [{ internalType: "address", name: "", type: "address" }]
  },
  {
    type: "function",
    name: "lifetimeVolume",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "", type: "address" }],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "activatedAt",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "", type: "address" }],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getVolumeLast30Days",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "isActive",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    outputs: [{ internalType: "bool", name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "getUpline",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    outputs: [{ internalType: "address[5]", name: "", type: "address[5]" }]
  },
  {
    type: "function",
    name: "getActivationStatus",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    outputs: [
      { internalType: "bool", name: "activated", type: "bool" },
      { internalType: "address[5]", name: "uplineSnapshot", type: "address[5]" }
    ]
  },
  {
    type: "function",
    name: "activationThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "activityThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "ReferrerSet",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "referrer", type: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Activated",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "address", name: "l1", type: "address" },
      { indexed: false, internalType: "address", name: "l2", type: "address" },
      { indexed: false, internalType: "address", name: "l3", type: "address" },
      { indexed: false, internalType: "address", name: "l4", type: "address" },
      { indexed: false, internalType: "address", name: "l5", type: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RevenueDistributed",
    inputs: [
      { indexed: true, internalType: "address", name: "payer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "level", type: "uint256" },
      { indexed: true, internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "bool", name: "toGenesis", type: "bool" }
    ],
    anonymous: false
  }
] as const;

export const GENESIS_BADGE_ABI = [
  {
    type: "function",
    name: "unlockOrBoost",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "badges",
    stateMutability: "view",
    inputs: [{ internalType: "address", name: "", type: "address" }],
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "uint8", name: "themeId", type: "uint8" },
      { internalType: "uint8", name: "titleId", type: "uint8" },
      { internalType: "uint256", name: "totalSpentWei", type: "uint256" },
      { internalType: "uint32", name: "boostCount", type: "uint32" }
    ]
  },
  {
    type: "function",
    name: "MIN_PAYMENT_WEI",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "THEME_COUNT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }]
  },
  {
    type: "function",
    name: "TITLE_COUNT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }]
  },
  {
    type: "event",
    name: "BadgeUnlocked",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint8", name: "themeId", type: "uint8" },
      { indexed: false, internalType: "uint8", name: "titleId", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amountWei", type: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BadgeBoosted",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountWei", type: "uint256" },
      { indexed: false, internalType: "uint32", name: "newBoostCount", type: "uint32" }
    ],
    anonymous: false
  }
] as const;

/** DonationEscrow (Kasparex vDonations): verify, campaigns, donate, claim, claimRefund, recordL1Donation */
export const DONATION_ESCROW_ABI = [
  { inputs: [], name: "verify", outputs: [], stateMutability: "payable", type: "function" },
  {
    inputs: [
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "uint256", name: "_targetWei", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "string", name: "_l1Address", type: "string" }
    ],
    name: "createCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "uint256", name: "_targetWei", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "string", name: "_l1Address", type: "string" }
    ],
    name: "updateCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_creator", type: "address" }],
    name: "donate",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  { inputs: [], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "address", name: "_creator", type: "address" }],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "_creator", type: "address" },
      { internalType: "bytes32", name: "_txHash", type: "bytes32" },
      { internalType: "address", name: "_donorL2", type: "address" },
      { internalType: "uint256", name: "_amountWei", type: "uint256" }
    ],
    name: "recordL1Donation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "campaigns",
    outputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "targetWei", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint256", name: "raisedWei", type: "uint256" },
      { internalType: "uint256", name: "donorCount", type: "uint256" },
      { internalType: "string", name: "ipfsHash", type: "string" },
      { internalType: "string", name: "l1Address", type: "string" },
      { internalType: "bool", name: "active", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "verified",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCreatorCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "creatorAt",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "contributions",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "l1TxRecorded",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    type: "event",
    name: "Donated",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "donor", type: "address", indexed: true },
      { name: "amountWei", type: "uint256", indexed: false },
      { name: "feeWei", type: "uint256", indexed: false }
    ]
  }
] as const;

