/**
 * Deploy Test DAppToken for Promo Engine
 * 
 * Deploys a DAppToken contract for testing on Igra Caravel Testnet
 * and sets the PromoMintRouter as the minter
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;
  
  console.log("\n🚀 Deploying Test DAppToken for Promo Engine...\n");
  console.log("Network:", network);
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "KAS\n");

  // Configuration from environment or defaults
  const TOKEN_NAME = process.env.TOKEN_NAME || "Test Genesis Token";
  const TOKEN_TICKER = process.env.TOKEN_TICKER || "TGEN";
  const MAX_SUPPLY = process.env.MAX_SUPPLY ? BigInt(process.env.MAX_SUPPLY) : 100000000n * 10n**18n; // 100M tokens with 18 decimals
  
  // Allocation addresses - use deployer for all in testnet, or from env
  const REWARD_VAULT = process.env.REWARD_VAULT || deployer.address;
  const LIQUIDITY_RESERVE = process.env.LIQUIDITY_RESERVE || deployer.address;
  const TREASURY = process.env.TREASURY || deployer.address;
  const DEV_ADDRESS = process.env.DEV_ADDRESS || deployer.address;
  const AIRDROP_ADDRESS = process.env.AIRDROP_ADDRESS || deployer.address;
  
  // PromoMintRouter address (must be set)
  const ROUTER_ADDRESS = process.env.PROMO_MINT_ROUTER_ADDRESS || "";
  
  if (!ROUTER_ADDRESS) {
    throw new Error("PROMO_MINT_ROUTER_ADDRESS environment variable is required");
  }

  console.log("Token Configuration:");
  console.log("  Name:", TOKEN_NAME);
  console.log("  Ticker:", TOKEN_TICKER);
  console.log("  Max Supply:", MAX_SUPPLY.toString());
  console.log("\nAllocation Addresses:");
  console.log("  Reward Vault:", REWARD_VAULT);
  console.log("  Liquidity Reserve:", LIQUIDITY_RESERVE);
  console.log("  Treasury:", TREASURY);
  console.log("  Dev Address:", DEV_ADDRESS);
  console.log("  Airdrop Address:", AIRDROP_ADDRESS);
  console.log("\nPromoMintRouter:", ROUTER_ADDRESS);

  // Deploy DAppToken
  console.log("\n=== Deploying DAppToken ===");
  const DAppToken = await ethers.getContractFactory("DAppToken");
  const token = await DAppToken.deploy(
    TOKEN_NAME,
    TOKEN_TICKER,
    MAX_SUPPLY,
    REWARD_VAULT,
    LIQUIDITY_RESERVE,
    TREASURY,
    DEV_ADDRESS,
    AIRDROP_ADDRESS
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ DAppToken deployed to:", tokenAddress);

  // Set PromoMintRouter as minter
  console.log("\n=== Setting PromoMintRouter as Minter ===");
  const setMinterTx = await token.setMinter(ROUTER_ADDRESS);
  await setMinterTx.wait();
  console.log("✅ PromoMintRouter set as minter");
  console.log("  Transaction:", setMinterTx.hash);

  // Verify minter
  const minter = await token.minter();
  console.log("  Verified minter:", minter);
  if (minter.toLowerCase() !== ROUTER_ADDRESS.toLowerCase()) {
    throw new Error("Minter was not set correctly!");
  }

  // Save deployment info
  const deploymentInfo = {
    network,
    contractName: "DAppToken",
    address: tokenAddress,
    name: TOKEN_NAME,
    ticker: TOKEN_TICKER,
    maxSupply: MAX_SUPPLY.toString(),
    minter: ROUTER_ADDRESS,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: token.deploymentTransaction()?.hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `test-token-${TOKEN_TICKER}-${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to:", deploymentFile);

  console.log("\n📝 Next Steps:");
  console.log("1. Update .env file with TOKEN_ADDRESS:", tokenAddress);
  console.log("2. Run: npm run hardhat:setup:promo-token");
  console.log("\n✅ Token deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
