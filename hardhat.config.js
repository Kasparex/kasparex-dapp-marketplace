require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@typechain/hardhat");
require("dotenv/config");

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    kasplexL2Mainnet: {
      url: process.env.KASPLEX_L2_MAINNET_RPC || "https://evmrpc.kasplex.org",
      chainId: 202555,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    kasplexL2Testnet: {
      url: process.env.KASPLEX_L2_TESTNET_RPC || "https://rpc.kasplextest.xyz",
      chainId: 167012,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
  },
  etherscan: {
    apiKey: {
      kasplexL2Mainnet: process.env.KASPLEX_EXPLORER_API_KEY || "",
      kasplexL2Testnet: process.env.KASPLEX_TESTNET_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "kasplexL2Mainnet",
        chainId: 202555,
        urls: {
          apiURL: "https://explorer.kasplex.org/api",
          browserURL: "https://explorer.kasplex.org",
        },
      },
      {
        network: "kasplexL2Testnet",
        chainId: 167012,
        urls: {
          apiURL: "https://explorer.testnet.kasplextest.xyz/api",
          browserURL: "https://explorer.testnet.kasplextest.xyz",
        },
      },
    ],
  },
};

